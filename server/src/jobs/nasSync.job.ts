import cron from 'node-cron';
import type { ScheduledTask } from 'node-cron';
import { syncLocalToNAS, validateNASConnection } from '../config/nas';
import { prisma } from '../config/database';
import { recordScheduledNASBackupRun, setSyncInProgress } from '../services/nasBackupStatus.store';
import { emailService } from '../services/email.service';
import { runLocalNasStagingCleanup } from '../services/localNasStagingCleanup.service';

async function notifyAdminsNASStatus(event: 'down' | 'up'): Promise<void> {
  try {
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN', active: true },
      select: { email: true },
    });
    const emails = admins.map((a) => a.email).filter(Boolean);
    if (emails.length > 0) {
      await emailService.sendNASStatusAlert(event, emails);
      console.log(`[NAS Alert] Sent "${event}" email to ${emails.length} admin(s)`);
    }
  } catch (err) {
    console.error('[NAS Alert] Failed to send admin notification:', err);
  }
}

let syncTask: ScheduledTask | null = null;
let healthCheckTask: ScheduledTask | null = null;
let stagingCleanupTask: ScheduledTask | null = null;
let isSyncing = false;
let wasNASAvailable = false;

// Start the scheduled NAS sync cron job.
//
// Default schedule: every 30 minutes ("*/30 * * * *").
// Override with the NAS_SYNC_CRON environment variable.
//
// The job:
//   1. Checks the Auto Backup admin setting (skips if disabled)
//   2. Re-validates NAS connectivity (detects NAS coming back online)
//   3. Copies local-only files to NAS
//   4. Re-syncs files with size mismatches (partial copies)
//   5. Verifies each copy via MD5 hash
export const startNASSyncJob = (): void => {
  const schedule = process.env.NAS_SYNC_CRON || '*/30 * * * *';

  if (!cron.validate(schedule)) {
    console.error(`[NAS Sync] Invalid NAS_SYNC_CRON expression: "${schedule}". Job not started.`);
    return;
  }

  syncTask = cron.schedule(schedule, async () => {
    if (isSyncing) {
      console.log('[NAS Sync] Sync already in progress, skipping this run');
      recordScheduledNASBackupRun({
        finishedAt: new Date().toISOString(),
        durationSeconds: 0,
        status: 'skipped',
        skipReason: 'sync_already_running',
      });
      return;
    }

    isSyncing = true;
    setSyncInProgress(true);
    const startTime = Date.now();
    const elapsedSec = () => Number(((Date.now() - startTime) / 1000).toFixed(1));

    try {
      // Respect the Auto Backup toggle in admin settings
      try {
        const settings = await prisma.adminSettings.findFirst({ select: { autoBackup: true } });
        if (settings && !settings.autoBackup) {
          console.log('[NAS Sync] Auto backup is disabled in admin settings, skipping');
          recordScheduledNASBackupRun({
            finishedAt: new Date().toISOString(),
            durationSeconds: elapsedSec(),
            status: 'skipped',
            skipReason: 'auto_backup_disabled',
          });
          return;
        }
      } catch (err) {
        console.warn('[NAS Sync] Could not read admin settings, proceeding with sync');
      }

      // Re-validate NAS connectivity each run (detects NAS coming back online + updates cache)
      const isNASAvailable = await validateNASConnection();

      if (isNASAvailable && !wasNASAvailable) {
        console.log('[NAS Sync] NAS is now available! Reconnected successfully.');
        notifyAdminsNASStatus('up');
      } else if (!isNASAvailable && wasNASAvailable) {
        console.warn('[NAS Sync] NAS has gone offline. Using local storage fallback.');
        notifyAdminsNASStatus('down');
      } else if (!isNASAvailable) {
        console.log('[NAS Sync] NAS still unavailable, skipping sync (will retry next cycle)');
      }

      wasNASAvailable = isNASAvailable;

      if (!isNASAvailable) {
        recordScheduledNASBackupRun({
          finishedAt: new Date().toISOString(),
          durationSeconds: elapsedSec(),
          status: 'skipped',
          skipReason: 'nas_unavailable',
        });
        return;
      }

      console.log('[NAS Sync] Starting scheduled sync...');
      const result = await syncLocalToNAS();

      const elapsed = elapsedSec();

      if (result.synced > 0 || result.failed > 0) {
        console.log(
          `[NAS Sync] Finished in ${elapsed}s - ` +
          `${result.synced} synced, ${result.failed} failed, ` +
          `${result.hashVerified} verified, ${result.hashFailed} hash-failed`,
        );
      } else {
        console.log(`[NAS Sync] Finished in ${elapsed}s - everything up to date`);
      }

      recordScheduledNASBackupRun({
        finishedAt: new Date().toISOString(),
        durationSeconds: elapsed,
        status: 'completed',
        summary: result.failed > 0 || result.synced > 0 ? 'files_copied' : 'up_to_date',
        synced: result.synced,
        failed: result.failed,
        hashVerified: result.hashVerified,
        hashFailed: result.hashFailed,
      });
    } catch (error) {
      console.error('[NAS Sync] Job error:', error);
      recordScheduledNASBackupRun({
        finishedAt: new Date().toISOString(),
        durationSeconds: elapsedSec(),
        status: 'error',
        errorMessage: error instanceof Error ? error.message : String(error),
      });
    } finally {
      isSyncing = false;
      setSyncInProgress(false);
    }
  });

  console.log(`[NAS Sync] Cron job started (schedule: "${schedule}")`);

  // Lightweight health check — updates the cache every 2 minutes so that
  // error-based invalidation (invalidateNASCache) can recover quickly once
  // the NAS comes back online. Does NOT trigger a full sync.
  const healthSchedule = process.env.NAS_HEALTH_CRON || '*/2 * * * *';

  if (cron.validate(healthSchedule)) {
    healthCheckTask = cron.schedule(healthSchedule, async () => {
      try {
        const isUp = await validateNASConnection();

        if (isUp && !wasNASAvailable) {
          console.log('[NAS Health] NAS is back online — cache updated to available');
          notifyAdminsNASStatus('up');
        } else if (!isUp && wasNASAvailable) {
          console.warn('[NAS Health] NAS went offline — cache updated to unavailable');
          notifyAdminsNASStatus('down');
        }

        wasNASAvailable = isUp;
      } catch (err) {
        console.error('[NAS Health] Check failed:', err);
      }
    });

    console.log(`[NAS Health] Health-check cron started (schedule: "${healthSchedule}")`);
  } else {
    console.error(`[NAS Health] Invalid NAS_HEALTH_CRON expression: "${healthSchedule}". Health check not started.`);
  }

  // Remove aged local staging copies once NAS holds a verified identical file (size + MD5).
  // Default: daily at 03:00. Override with LOCAL_NAS_STAGING_CLEANUP_CRON; disable with LOCAL_NAS_STAGING_CLEANUP_ENABLED=false.
  const cleanupSchedule = process.env.LOCAL_NAS_STAGING_CLEANUP_CRON || '0 3 * * *';
  if (cron.validate(cleanupSchedule)) {
    stagingCleanupTask = cron.schedule(cleanupSchedule, async () => {
      try {
        const result = await runLocalNasStagingCleanup();
        if (result.errors.length > 0) {
          console.warn(`[NAS Staging Cleanup] Completed with ${result.errors.length} error(s)`);
        }
      } catch (err) {
        console.error('[NAS Staging Cleanup] Job error:', err);
      }
    });
    console.log(`[NAS Staging Cleanup] Cron started (schedule: "${cleanupSchedule}")`);
  } else {
    console.error(
      `[NAS Staging Cleanup] Invalid LOCAL_NAS_STAGING_CLEANUP_CRON: "${cleanupSchedule}". Cleanup job not started.`,
    );
  }
};

/**
 * Stop the scheduled NAS sync cron job and health check.
 */
export const stopNASSyncJob = (): void => {
  if (syncTask) {
    syncTask.stop();
    syncTask = null;
    console.log('[NAS Sync] Cron job stopped');
  }
  if (healthCheckTask) {
    healthCheckTask.stop();
    healthCheckTask = null;
    console.log('[NAS Health] Health-check cron stopped');
  }
  if (stagingCleanupTask) {
    stagingCleanupTask.stop();
    stagingCleanupTask = null;
    console.log('[NAS Staging Cleanup] Cron stopped');
  }
};
