/**
 * In-memory record of the last NAS backup runs (scheduled cron + manual admin sync).
 * Survives for the lifetime of the Node process; resets on server restart.
 */

export type NASBackupSkipReason =
  | 'nas_unavailable'
  | 'auto_backup_disabled'
  | 'sync_already_running'
  | 'nas_disabled';

export interface NASBackupRunRecord {
  finishedAt: string;
  durationSeconds: number;
  status: 'completed' | 'skipped' | 'error';
  skipReason?: NASBackupSkipReason;
  summary?: 'up_to_date' | 'files_copied';
  synced?: number;
  failed?: number;
  hashVerified?: number;
  hashFailed?: number;
  errorMessage?: string;
}

let lastScheduled: NASBackupRunRecord | null = null;
let lastManual: NASBackupRunRecord | null = null;
let _syncInProgress = false;

export const recordScheduledNASBackupRun = (r: NASBackupRunRecord): void => {
  lastScheduled = r;
};

export const recordManualNASBackupRun = (r: NASBackupRunRecord): void => {
  lastManual = r;
};

export const setSyncInProgress = (v: boolean): void => { _syncInProgress = v; };

export const getNASBackupStatusForAdmin = (): {
  lastScheduled: NASBackupRunRecord | null;
  lastManual: NASBackupRunRecord | null;
  syncInProgress: boolean;
  scheduledCron: string;
  healthCheckCron: string;
  nasFeatureEnabled: boolean;
} => ({
  lastScheduled,
  lastManual,
  syncInProgress: _syncInProgress,
  scheduledCron: process.env.NAS_SYNC_CRON || '*/30 * * * *',
  healthCheckCron: process.env.NAS_HEALTH_CRON || '*/2 * * * *',
  nasFeatureEnabled: process.env.USE_NAS === 'true',
});
