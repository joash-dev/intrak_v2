import fs from 'fs';
import path from 'path';
import { computeFileHash } from '../services/fileIntegrity.service';

/**
 * NAS availability cache. Updated exclusively by validateNASConnection() (async).
 * null = not yet checked. While null or false, all storage ops use UPLOAD_PATH
 * so a hung CIFS/NFS mount can never block the Node event loop.
 */
let nasAvailabilityCache: boolean | null = null;

export interface NASConfig {
  enabled: boolean;
  mountPath: string;
  host: string;
  username: string;
  password: string;
  shareName: string;
}

export const getNASConfig = (): NASConfig => {
  return {
    enabled: process.env.USE_NAS === 'true',
    mountPath: process.env.NAS_PATH || '/mnt/nas/intrak',
    host: process.env.NAS_HOST || '192.168.1.100',
    username: process.env.NAS_USERNAME || 'nas_user',
    password: process.env.NAS_PASSWORD || 'nas_password',
    shareName: process.env.NAS_SHARE_NAME || 'documents'
  };
};

export const ensureNASDirectoryExists = async (dirPath: string): Promise<void> => {
  const nasConfig = getNASConfig();

  try {
    await fs.promises.mkdir(dirPath, { recursive: true });
  } catch (error: any) {
    if (nasConfig.enabled && dirPath.startsWith(nasConfig.mountPath)) {
      const localPath = dirPath.replace(nasConfig.mountPath, process.env.UPLOAD_PATH || './uploads');
      console.warn(`WARNING: Failed to create NAS directory, using local fallback: ${localPath}`);
      await fs.promises.mkdir(localPath, { recursive: true });
    } else {
      throw error;
    }
  }
};

/** Effective storage root — NAS when validated, else local UPLOAD_PATH. */
export const getStoragePath = (): string => getStoragePathWithFallback().storagePath;

/**
 * Returns the active storage path based on the cached NAS availability.
 * Zero synchronous I/O — safe to call on every request.
 */
export const getStoragePathWithFallback = (): { storagePath: string; isUsingFallback: boolean } => {
  const nasConfig = getNASConfig();
  const localPath = process.env.UPLOAD_PATH || './uploads';

  if (!nasConfig.enabled) {
    return { storagePath: localPath, isUsingFallback: false };
  }

  if (nasAvailabilityCache === true) {
    return { storagePath: nasConfig.mountPath, isUsingFallback: false };
  }

  return { storagePath: localPath, isUsingFallback: true };
};

const nasIoTimeoutMs = (): number =>
  parseInt(process.env.NAS_IO_TIMEOUT_MS || '4000', 10);

/**
 * Async NAS probe with a wall-clock timeout so a dead CIFS/NFS mount
 * can never block for more than NAS_IO_TIMEOUT_MS (default 4 s).
 */
const probeNASPath = async (mountPath: string, timeoutMs: number): Promise<boolean> => {
  const work = async (): Promise<boolean> => {
    try {
      await fs.promises.access(mountPath, fs.constants.R_OK | fs.constants.W_OK);
    } catch {
      return false;
    }
    const token = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const testFile = path.join(mountPath, `.intrak_nas_probe_${token}`);
    try {
      await fs.promises.writeFile(testFile, 'ok');
      await fs.promises.unlink(testFile);
      return true;
    } catch {
      return false;
    }
  };

  try {
    return await Promise.race([
      work(),
      new Promise<boolean>((resolve) => setTimeout(() => resolve(false), timeoutMs)),
    ]);
  } catch {
    return false;
  }
};

export const validateNASConnection = async (): Promise<boolean> => {
  const nasConfig = getNASConfig();

  if (!nasConfig.enabled) {
    nasAvailabilityCache = null;
    return true;
  }

  const timeoutMs = nasIoTimeoutMs();
  const ok = await probeNASPath(nasConfig.mountPath, timeoutMs);
  nasAvailabilityCache = ok;

  if (!ok) {
    console.warn(
      `[NAS] Storage path not reachable within ${timeoutMs}ms — using local fallback until NAS is reachable`
    );
  }

  return ok;
};

/** Expose cache state for logging / health endpoints. */
export const isNASAvailable = (): boolean | null => nasAvailabilityCache;

/**
 * Immediately mark NAS as unavailable so subsequent requests fall back to
 * local storage. Call this from controller catch blocks when an fs operation
 * fails with a NAS-specific error (EHOSTDOWN, EIO, ETIMEDOUT, etc.).
 *
 * The 2-minute health-check cron will re-validate and flip the cache back
 * to `true` once the NAS recovers.
 */
export const invalidateNASCache = (): void => {
  if (nasAvailabilityCache !== false) {
    console.warn('[NAS] Cache invalidated due to I/O error — falling back to local storage');
    nasAvailabilityCache = false;
  }
};

/**
 * Resolve file path - checks both NAS and local storage
 * Useful when NAS might be disconnected but files exist in local storage
 * @param storedPath The filepath stored in database
 * @returns Resolved filepath or null if not found
 */
export const resolveFilePath = (storedPath: string): string | null => {
  const nasConfig = getNASConfig();
  const localPath = process.env.UPLOAD_PATH || './uploads';
  const nasDown = nasAvailabilityCache === false;

  const normalizedPath = path.normalize(storedPath);

  if (path.isAbsolute(normalizedPath)) {
    // When NAS is known-down, skip any existsSync on NAS paths (avoids blocking)
    const isNASPath = nasConfig.enabled && normalizedPath.startsWith(nasConfig.mountPath);

    if (!isNASPath || !nasDown) {
      if (fs.existsSync(normalizedPath)) {
        return normalizedPath;
      }
    }

    // NAS path but file not found (or NAS down) → try local fallback
    if (isNASPath) {
      const localFallback = normalizedPath.replace(nasConfig.mountPath, localPath);
      if (fs.existsSync(localFallback)) {
        console.warn(`[NAS] File not found on NAS, using local fallback: ${localFallback}`);
        return localFallback;
      }
    }

    // Local path but file not found → try NAS (only when NAS is up)
    if (normalizedPath.startsWith(localPath) && nasConfig.enabled && !nasDown) {
      const nasFallback = normalizedPath.replace(localPath, nasConfig.mountPath);
      if (fs.existsSync(nasFallback)) {
        console.warn(`[NAS] File not found locally, found on NAS: ${nasFallback}`);
        return nasFallback;
      }
    }
  }

  // Try relative paths — skip NAS-rooted candidates when NAS is down
  const possiblePaths = [
    normalizedPath,
    path.resolve(process.cwd(), normalizedPath),
    path.resolve(process.cwd(), 'server', normalizedPath),
    path.resolve(__dirname, '../../', normalizedPath),
  ];

  if (nasConfig.enabled && !nasDown) {
    possiblePaths.push(path.resolve(nasConfig.mountPath, normalizedPath));
  }
  possiblePaths.push(path.resolve(localPath, normalizedPath));

  for (const possiblePath of possiblePaths) {
    if (fs.existsSync(possiblePath)) {
      return possiblePath;
    }
  }

  return null;
};

/**
 * Sync files from local storage to NAS when NAS becomes available.
 * This should be called when NAS reconnects or on a scheduled basis.
 *
 * Enhanced: now compares file sizes (not just existence) so partially copied
 * or outdated files are re-synced, and verifies integrity via MD5 after copy.
 */
export const syncLocalToNAS = async (): Promise<{
  synced: number;
  failed: number;
  hashVerified: number;
  hashFailed: number;
}> => {
  const nasConfig = getNASConfig();
  const localPath = process.env.UPLOAD_PATH || './uploads';

  if (!nasConfig.enabled) {
    return { synced: 0, failed: 0, hashVerified: 0, hashFailed: 0 };
  }

  // Check if NAS is available
  const nasAvailable = await validateNASConnection();
  if (!nasAvailable) {
    console.log('[NAS Sync] NAS not available, skipping sync');
    return { synced: 0, failed: 0, hashVerified: 0, hashFailed: 0 };
  }

  let synced = 0;
  let failed = 0;
  let hashVerified = 0;
  let hashFailed = 0;

  try {
    const syncDirectory = async (localDir: string, nasDir: string) => {
      if (!fs.existsSync(localDir)) {
        return;
      }

      // Ensure NAS directory exists
      if (!fs.existsSync(nasDir)) {
        fs.mkdirSync(nasDir, { recursive: true });
      }

      const files = fs.readdirSync(localDir, { withFileTypes: true });

      for (const file of files) {
        // Skip hidden / test files
        if (file.name.startsWith('.')) continue;

        const localFilePath = path.join(localDir, file.name);
        const nasFilePath = path.join(nasDir, file.name);

        if (file.isDirectory()) {
          await syncDirectory(localFilePath, nasFilePath);
        } else if (file.isFile()) {
          let needsSync = false;

          if (!fs.existsSync(nasFilePath)) {
            // File missing on NAS - sync
            needsSync = true;
          } else {
            // File exists on NAS - compare sizes to catch partial copies
            const localSize = fs.statSync(localFilePath).size;
            const nasSize = fs.statSync(nasFilePath).size;
            if (localSize !== nasSize) {
              console.log(`[NAS Sync] Size mismatch for ${file.name}: local=${localSize}, NAS=${nasSize} - re-syncing`);
              needsSync = true;
            }
          }

          if (needsSync) {
            try {
              fs.copyFileSync(localFilePath, nasFilePath);
              synced++;

              // Verify integrity after copy via MD5
              try {
                const [localHash, nasHash] = await Promise.all([
                  computeFileHash(localFilePath),
                  computeFileHash(nasFilePath),
                ]);

                if (localHash === nasHash) {
                  hashVerified++;
                  console.log(`[NAS Sync] Synced and verified: ${file.name} (MD5: ${localHash})`);
                } else {
                  hashFailed++;
                  console.error(`[NAS Sync] WARNING - Synced but hash mismatch: ${file.name} (local=${localHash}, NAS=${nasHash})`);
                }
              } catch (hashErr) {
                // Hash computation failed - file was still copied
                console.warn(`[NAS Sync] Synced ${file.name} but could not verify hash:`, hashErr);
              }
            } catch (error) {
              failed++;
              console.error(`[NAS Sync] Failed to sync ${file.name}:`, error);
            }
          }
        }
      }
    };

    // Directories to sync
    const syncDirs = ['documents', 'templates', 'profile-photos', 'company-proposals'];

    for (const dir of syncDirs) {
      const localDir = path.join(localPath, dir);
      const nasDir = path.join(nasConfig.mountPath, dir);
      if (fs.existsSync(localDir)) {
        await syncDirectory(localDir, nasDir);
      }
    }

    if (synced > 0 || failed > 0) {
      console.log(
        `[NAS Sync] Complete: ${synced} synced, ${failed} failed, ` +
        `${hashVerified} hash-verified, ${hashFailed} hash-failed`,
      );
    }
  } catch (error) {
    console.error('[NAS Sync] Error:', error);
  }

  return { synced, failed, hashVerified, hashFailed };
};

/**
 * Create backup copy in local storage when saving to NAS
 * This ensures files are accessible even when NAS is disconnected
 * @param nasFilePath The file path on NAS
 * @param fileContent Buffer or path to file to backup
 * @returns Local backup path or null if backup failed
 */
export const createLocalBackup = (nasFilePath: string, fileContent: string | Buffer): string | null => {
  const nasConfig = getNASConfig();
  const localPath = process.env.UPLOAD_PATH || './uploads';

  // Get base NAS path (remove /documents suffix if present)
  const baseNASPath = nasConfig.mountPath.replace(/\/documents$/, '') || '/mnt/nas/intrak';

  // Only create backup if NAS is enabled and file is on NAS
  if (!nasConfig.enabled || !nasFilePath.startsWith(baseNASPath)) {
    return null;
  }

  try {
    // Convert NAS path to local backup path (replace base NAS path with local path)
    const localBackupPath = nasFilePath.replace(baseNASPath, localPath);
    const localBackupDir = path.dirname(localBackupPath);

    // Create directory if it doesn't exist
    if (!fs.existsSync(localBackupDir)) {
      fs.mkdirSync(localBackupDir, { recursive: true });
    }

    // Copy file to local backup
    if (typeof fileContent === 'string') {
      // If it's a file path, copy it
      fs.copyFileSync(fileContent, localBackupPath);
    } else {
      // If it's a buffer, write it
      fs.writeFileSync(localBackupPath, fileContent);
    }

    return localBackupPath;
  } catch (error) {
    console.warn(`[NAS] Failed to create local backup for ${nasFilePath}:`, error);
    return null;
  }
};
