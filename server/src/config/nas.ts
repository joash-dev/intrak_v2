import fs from 'fs';
import path from 'path';
import { computeFileHash } from '../services/fileIntegrity.service';

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

  // Try to create directory, fallback to local if NAS unavailable
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  } catch (error: any) {
    // If NAS path fails, try local fallback
    if (nasConfig.enabled && dirPath.startsWith(nasConfig.mountPath)) {
      const localPath = dirPath.replace(nasConfig.mountPath, process.env.UPLOAD_PATH || './uploads');
      console.warn(`WARNING: Failed to create NAS directory, using local fallback: ${localPath}`);
      if (!fs.existsSync(localPath)) {
        fs.mkdirSync(localPath, { recursive: true });
      }
    } else {
      throw error;
    }
  }
};

export const getStoragePath = (): string => {
  const nasConfig = getNASConfig();

  return nasConfig.enabled
    ? nasConfig.mountPath
    : process.env.UPLOAD_PATH || './uploads';
};

/**
 * Check if a path is actually a network mount (CIFS/NFS) - synchronous version
 * This helps detect stale mounts where directory exists but NAS is unmounted
 * In Docker containers, bind mounts from host also count as valid NAS
 */
const isNetworkMountSync = (mountPath: string): boolean => {
  try {
    const { execSync } = require('child_process');
    // Check if the path is a mount point and if it's a network filesystem
    const mountInfo = execSync(`mount | grep "${mountPath}" || echo ""`, { encoding: 'utf8' });

    // Look for network filesystem types: cifs, nfs, smbfs
    const isNetwork = mountInfo.includes('type cifs') ||
      mountInfo.includes('type nfs') ||
      mountInfo.includes('type smbfs');

    // Also check for Docker bind mounts (when host has NAS mounted)
    // In Docker, host bind mounts appear as "overlay" or just exist without specific type
    const isBindMount = mountInfo.includes('overlay') || mountInfo.trim().length > 0;

    // If USE_NAS is true and path is writable, trust it as NAS
    // This handles Docker containers where host's CIFS mount becomes a bind mount
    if (process.env.USE_NAS === 'true' && !isNetwork && mountInfo.trim().length === 0) {
      // No mount info found, but let's check if it's writable - that's good enough
      const testFile = require('path').join(mountPath, '.nas_test_' + Date.now());
      try {
        require('fs').writeFileSync(testFile, 'test');
        require('fs').unlinkSync(testFile);
        console.log(`[NAS] ${mountPath} is writable - accepting as valid NAS (Docker bind mount)`);
        return true;
      } catch {
        return false;
      }
    }

    return isNetwork || isBindMount;
  } catch (error) {
    // If command fails, assume not a network mount
    return false;
  }
};

export const getStoragePathWithFallback = (): { storagePath: string; isUsingFallback: boolean } => {
  const nasConfig = getNASConfig();
  const localPath = process.env.UPLOAD_PATH || './uploads';

  if (!nasConfig.enabled) {
    return { storagePath: localPath, isUsingFallback: false };
  }

  // Check if NAS is actually available
  try {
    if (fs.existsSync(nasConfig.mountPath)) {
      // Check if it's actually a network mount (not just a local directory)
      const isActualNAS = isNetworkMountSync(nasConfig.mountPath);
      if (!isActualNAS) {
        console.warn('[NAS] Mount point exists but is NOT a network mount (NAS is unmounted), falling back to local storage');
        return { storagePath: localPath, isUsingFallback: true };
      }

      // Test write access
      const testFile = path.join(nasConfig.mountPath, '.test_write');
      try {
        fs.writeFileSync(testFile, 'test');
        fs.unlinkSync(testFile);
        return { storagePath: nasConfig.mountPath, isUsingFallback: false };
      } catch (error) {
        // NAS exists but not writable, fallback to local
        console.warn('[NAS] Mount point exists but not writable, falling back to local storage');
        return { storagePath: localPath, isUsingFallback: true };
      }
    }
  } catch (error) {
    // NAS mount point doesn't exist or error accessing it
    console.warn('[NAS] Mount point not accessible, falling back to local storage');
  }

  // Fallback to local storage
  return { storagePath: localPath, isUsingFallback: true };
};

/**
 * Check if a path is actually a network mount (CIFS/NFS)
 * This helps detect stale mounts where directory exists but NAS is unmounted
 * In Docker containers, bind mounts from host also count as valid NAS
 */
const isNetworkMount = (mountPath: string): boolean => {
  try {
    const { execSync } = require('child_process');
    // Check if the path is a mount point and if it's a network filesystem
    const mountInfo = execSync(`mount | grep "${mountPath}" || echo ""`, { encoding: 'utf8' });

    // Look for network filesystem types: cifs, nfs, smbfs
    const isNetwork = mountInfo.includes('type cifs') ||
      mountInfo.includes('type nfs') ||
      mountInfo.includes('type smbfs');

    // Also check for Docker bind mounts
    const isBindMount = mountInfo.includes('overlay') || mountInfo.trim().length > 0;

    // If USE_NAS is true and path is writable, trust it as NAS
    if (process.env.USE_NAS === 'true' && !isNetwork && mountInfo.trim().length === 0) {
      const testFile = require('path').join(mountPath, '.nas_test_' + Date.now());
      try {
        require('fs').writeFileSync(testFile, 'test');
        require('fs').unlinkSync(testFile);
        console.log(`[NAS] ${mountPath} is writable - accepting as valid NAS (Docker bind mount)`);
        return true;
      } catch {
        return false;
      }
    }

    return isNetwork || isBindMount;
  } catch (error) {
    // If command fails, assume not a network mount
    return false;
  }
};

export const validateNASConnection = async (): Promise<boolean> => {
  const nasConfig = getNASConfig();

  if (!nasConfig.enabled) {
    return true; // NAS not enabled, use local storage
  }

  try {
    // Check if mount point exists
    if (!fs.existsSync(nasConfig.mountPath)) {
      console.warn(`[NAS] Mount point does not exist: ${nasConfig.mountPath}`);
      return false;
    }

    // Check if it's actually a network mount (not just a local directory)
    const isActualNAS = isNetworkMount(nasConfig.mountPath);
    if (!isActualNAS) {
      console.warn(`[NAS] ${nasConfig.mountPath} exists but is NOT a network mount (likely local directory - NAS is unmounted)`);
      return false;
    }

    // Test write access
    const testFile = path.join(nasConfig.mountPath, '.test_write');
    try {
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
      return true;
    } catch (writeError) {
      console.warn(`[NAS] Mount point exists but not writable:`, writeError);
      return false;
    }
  } catch (error) {
    console.error('NAS connection validation failed:', error);
    return false;
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

  // Normalize the path
  const normalizedPath = path.normalize(storedPath);

  // If absolute path, check if it exists
  if (path.isAbsolute(normalizedPath)) {
    if (fs.existsSync(normalizedPath)) {
      return normalizedPath;
    }

    // If NAS path but file not found, try local fallback
    if (nasConfig.enabled && normalizedPath.startsWith(nasConfig.mountPath)) {
      const localFallback = normalizedPath.replace(nasConfig.mountPath, localPath);
      if (fs.existsSync(localFallback)) {
        console.warn(`[NAS] File not found on NAS, using local fallback: ${localFallback}`);
        return localFallback;
      }
    }

    // If local path but file not found, try NAS (in case file was moved)
    if (normalizedPath.startsWith(localPath) && nasConfig.enabled) {
      const nasFallback = normalizedPath.replace(localPath, nasConfig.mountPath);
      if (fs.existsSync(nasFallback)) {
        console.warn(`[NAS] File not found locally, found on NAS: ${nasFallback}`);
        return nasFallback;
      }
    }
  }

  // Try relative paths
  const possiblePaths = [
    normalizedPath,
    path.resolve(process.cwd(), normalizedPath),
    path.resolve(process.cwd(), 'server', normalizedPath),
    path.resolve(__dirname, '../../', normalizedPath),
  ];

  // Add NAS and local paths
  if (nasConfig.enabled) {
    possiblePaths.push(path.resolve(nasConfig.mountPath, normalizedPath));
  }
  possiblePaths.push(path.resolve(localPath, normalizedPath));

  // Find first existing path
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
