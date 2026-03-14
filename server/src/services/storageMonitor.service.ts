import checkDiskSpace from 'check-disk-space';
import fs from 'fs';
import path from 'path';
import { getNASConfig } from '../config/nas';

export interface StorageMetrics {
  total: number; // bytes
  free: number; // bytes
  used: number; // bytes
  percentUsed: number; // 0-100
  totalFormatted: string; // e.g., "1.71 TiB"
  freeFormatted: string; // e.g., "1.63 TiB"
  usedFormatted: string; // e.g., "84.21 GiB"
  path: string;
  available: boolean;
}

export interface StorageAlert {
  type: 'warning' | 'critical' | 'info';
  message: string;
  component: 'storage' | 'database' | 'nas' | 'system';
  timestamp: string;
}

/**
 * Format bytes to human-readable string
 */
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Get storage metrics for a given path
 */
const getStorageMetricsForPath = async (storagePath: string): Promise<StorageMetrics | null> => {
  try {
    // Check if path exists and is accessible
    if (!fs.existsSync(storagePath)) {
      return null;
    }

    const disk = await checkDiskSpace(storagePath);

    if (!disk || disk.size === 0) {
      return null;
    }

    const total = disk.size;
    const free = disk.free;
    const used = total - free;
    const percentUsed = Math.min(100, Math.max(0, Math.round((used / total) * 100)));

    return {
      total,
      free,
      used,
      percentUsed,
      totalFormatted: formatBytes(total),
      freeFormatted: formatBytes(free),
      usedFormatted: formatBytes(used),
      path: storagePath,
      available: true
    };
  } catch (error) {
    console.error(`Error checking storage for ${storagePath}:`, error);
    return null;
  }
};

/**
 * Check if a path is actually a network mount (CIFS/NFS)
 * In Docker containers, bind mounts from host also count as valid NAS
 */
const isNetworkMount = async (mountPath: string): Promise<boolean> => {
  try {
    const { execSync } = require('child_process');
    const mountOutput = execSync('mount', { encoding: 'utf8' });
    const mountLines = mountOutput.split('\n').map((line: string) => line.trim()).filter(Boolean);

    // Build candidate paths from most-specific to least-specific.
    // This lets NAS_PATH like /mnt/nas/intrak/uploads match parent mount /mnt/nas.
    const normalizedPath = path.resolve(mountPath);
    const candidates: string[] = [];
    let current = normalizedPath;
    while (!candidates.includes(current)) {
      candidates.push(current);
      const parent = path.dirname(current);
      if (parent === current) break;
      current = parent;
    }

    const mountInfo = mountLines.find((line: string) =>
      candidates.some(candidate => line.includes(` on ${candidate} `))
    ) || '';

    // Look for network filesystem types: cifs, nfs, smbfs
    const isNetwork = mountInfo.includes('type cifs') ||
      mountInfo.includes('type nfs') ||
      mountInfo.includes('type smbfs');

    // Also check for Docker bind mounts
    const isBindMount = mountInfo.includes('overlay') || mountInfo.trim().length > 0;

    // If USE_NAS is true and path is writable, trust it as NAS (Docker bind mount case)
    if (process.env.USE_NAS === 'true' && !isNetwork && mountInfo.trim().length === 0) {
      const testFile = path.join(mountPath, '.nas_test_' + Date.now());
      try {
        fs.writeFileSync(testFile, 'test');
        fs.unlinkSync(testFile);
        console.log(`[Storage] ${mountPath} is writable - accepting as valid NAS (Docker bind mount)`);
        return true;
      } catch {
        return false;
      }
    }

    console.log(`[Storage] Checking if ${mountPath} is network mount: ${isNetwork || isBindMount ? 'YES' : 'NO'}`);

    return isNetwork || isBindMount;
  } catch (error) {
    console.error(`Error checking mount status for ${mountPath}:`, error);
    return false;
  }
};

/**
 * Get NAS storage metrics
 */
export const getNASStorageMetrics = async (): Promise<StorageMetrics | null> => {
  const nasConfig = getNASConfig();

  if (!nasConfig.enabled) {
    return null;
  }

  // First check if it's actually a network mount
  const isActualNAS = await isNetworkMount(nasConfig.mountPath);

  if (!isActualNAS) {
    console.log(`[Storage] ${nasConfig.mountPath} exists but is NOT a network mount (likely local directory created by Docker)`);
    return null;
  }

  return await getStorageMetricsForPath(nasConfig.mountPath);
};

/**
 * Get local storage metrics
 */
export const getLocalStorageMetrics = async (): Promise<StorageMetrics | null> => {
  const localPath = process.env.UPLOAD_PATH || './uploads';

  // Use the directory's parent or root for disk space check
  // For local storage, check the root filesystem or the uploads directory's parent
  const checkPath = path.isAbsolute(localPath)
    ? path.dirname(localPath) || '/'
    : process.cwd();

  return await getStorageMetricsForPath(checkPath);
};

/**
 * Check storage alerts based on metrics
 */
export const checkStorageAlerts = (metrics: StorageMetrics | null, storageType: 'nas' | 'local'): StorageAlert[] => {
  const alerts: StorageAlert[] = [];

  if (!metrics || !metrics.available) {
    if (storageType === 'nas') {
      alerts.push({
        type: 'warning',
        message: 'NAS storage is not available. System is using local storage fallback.',
        component: 'nas',
        timestamp: new Date().toISOString()
      });
    }
    return alerts;
  }

  // Check storage usage thresholds
  if (metrics.percentUsed >= 90) {
    alerts.push({
      type: 'critical',
      message: `${storageType.toUpperCase()} storage is ${metrics.percentUsed}% full (${metrics.usedFormatted} / ${metrics.totalFormatted}). Immediate action required!`,
      component: 'storage',
      timestamp: new Date().toISOString()
    });
  } else if (metrics.percentUsed >= 80) {
    alerts.push({
      type: 'warning',
      message: `${storageType.toUpperCase()} storage is ${metrics.percentUsed}% full (${metrics.usedFormatted} / ${metrics.totalFormatted}). Consider cleaning up or expanding storage.`,
      component: 'storage',
      timestamp: new Date().toISOString()
    });
  }

  return alerts;
};

/**
 * Get all storage alerts (NAS and local)
 */
export const getAllStorageAlerts = async (): Promise<StorageAlert[]> => {
  const alerts: StorageAlert[] = [];

  // Check NAS storage
  const nasMetrics = await getNASStorageMetrics();
  const nasAlerts = checkStorageAlerts(nasMetrics, 'nas');
  alerts.push(...nasAlerts);

  // Check local storage (only if NAS is not available or as backup check)
  if (!nasMetrics || !nasMetrics.available) {
    const localMetrics = await getLocalStorageMetrics();
    const localAlerts = checkStorageAlerts(localMetrics, 'local');
    alerts.push(...localAlerts);
  }

  return alerts;
};

