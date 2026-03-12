import cron from 'node-cron';
import { syncLocalToNAS } from '../config/nas';

let syncTask: cron.ScheduledTask | null = null;
let isSyncing = false;

// Start the scheduled NAS sync cron job.
//
// Default schedule: every 30 minutes ("*/30 * * * *").
// Override with the NAS_SYNC_CRON environment variable.
//
// The job calls syncLocalToNAS() which:
//   1. Copies local-only files to NAS
//   2. Re-syncs files with size mismatches (partial copies)
//   3. Verifies each copy via MD5 hash
export const startNASSyncJob = (): void => {
  const schedule = process.env.NAS_SYNC_CRON || '*/30 * * * *';

  if (!cron.validate(schedule)) {
    console.error(`[NAS Sync] Invalid NAS_SYNC_CRON expression: "${schedule}". Job not started.`);
    return;
  }

  syncTask = cron.schedule(schedule, async () => {
    // Prevent overlapping runs
    if (isSyncing) {
      console.log('[NAS Sync] Sync already in progress, skipping this run');
      return;
    }

    isSyncing = true;
    const startTime = Date.now();

    try {
      console.log('[NAS Sync] Starting scheduled sync...');
      const result = await syncLocalToNAS();

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

      if (result.synced > 0 || result.failed > 0) {
        console.log(
          `[NAS Sync] Finished in ${elapsed}s - ` +
          `${result.synced} synced, ${result.failed} failed, ` +
          `${result.hashVerified} verified, ${result.hashFailed} hash-failed`,
        );
      } else {
        console.log(`[NAS Sync] Finished in ${elapsed}s - everything up to date`);
      }
    } catch (error) {
      console.error('[NAS Sync] Job error:', error);
    } finally {
      isSyncing = false;
    }
  });

  console.log(`[NAS Sync] Cron job started (schedule: "${schedule}")`);
};

/**
 * Stop the scheduled NAS sync cron job.
 */
export const stopNASSyncJob = (): void => {
  if (syncTask) {
    syncTask.stop();
    syncTask = null;
    console.log('[NAS Sync] Cron job stopped');
  }
};
