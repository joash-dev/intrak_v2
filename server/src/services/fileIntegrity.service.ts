import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { getNASConfig } from '../config/nas';

export interface IntegrityResult {
  file: string;
  status: 'ok' | 'mismatch' | 'missing_nas' | 'missing_local' | 'error';
  nasHash?: string;
  localHash?: string;
  nasSize?: number;
  localSize?: number;
  detail?: string;
}

export interface IntegrityReport {
  checkedAt: string;
  totalFiles: number;
  ok: number;
  mismatches: number;
  missingNas: number;
  missingLocal: number;
  errors: number;
  results: IntegrityResult[];
}

/**
 * Compute the MD5 hash of a file.
 * Uses streaming to handle large files without loading them entirely into memory.
 */
export const computeFileHash = (filePath: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('md5');
    const stream = fs.createReadStream(filePath);

    stream.on('data', (data) => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', (err) => reject(err));
  });
};

/**
 * Compute the MD5 hash of a buffer (useful for verifying uploads before writing).
 */
export const computeBufferHash = (buffer: Buffer): string => {
  return crypto.createHash('md5').update(buffer).digest('hex');
};

/**
 * Compare a file on NAS against its local backup.
 * Returns detailed integrity result.
 */
export const verifyFileIntegrity = async (
  nasFilePath: string,
  localFilePath: string,
): Promise<IntegrityResult> => {
  const relativePath = nasFilePath; // for display

  try {
    const nasExists = fs.existsSync(nasFilePath);
    const localExists = fs.existsSync(localFilePath);

    if (!nasExists && !localExists) {
      return { file: relativePath, status: 'error', detail: 'File missing from both NAS and local' };
    }
    if (!nasExists) {
      const localStat = fs.statSync(localFilePath);
      return {
        file: relativePath,
        status: 'missing_nas',
        localSize: localStat.size,
        detail: 'File exists locally but not on NAS',
      };
    }
    if (!localExists) {
      const nasStat = fs.statSync(nasFilePath);
      return {
        file: relativePath,
        status: 'missing_local',
        nasSize: nasStat.size,
        detail: 'File exists on NAS but not locally',
      };
    }

    // Both exist - compare sizes first (fast check)
    const nasStat = fs.statSync(nasFilePath);
    const localStat = fs.statSync(localFilePath);

    if (nasStat.size !== localStat.size) {
      return {
        file: relativePath,
        status: 'mismatch',
        nasSize: nasStat.size,
        localSize: localStat.size,
        detail: `Size mismatch: NAS=${nasStat.size} bytes, Local=${localStat.size} bytes`,
      };
    }

    // Sizes match - compute MD5 hashes for deeper verification
    const [nasHash, localHash] = await Promise.all([
      computeFileHash(nasFilePath),
      computeFileHash(localFilePath),
    ]);

    if (nasHash !== localHash) {
      return {
        file: relativePath,
        status: 'mismatch',
        nasHash,
        localHash,
        nasSize: nasStat.size,
        localSize: localStat.size,
        detail: `Hash mismatch: NAS=${nasHash}, Local=${localHash}`,
      };
    }

    return {
      file: relativePath,
      status: 'ok',
      nasHash,
      localHash,
      nasSize: nasStat.size,
      localSize: localStat.size,
    };
  } catch (error: any) {
    return {
      file: relativePath,
      status: 'error',
      detail: error.message || 'Unknown error during integrity check',
    };
  }
};

/**
 * Recursively collect all file paths in a directory.
 */
const collectFiles = (dirPath: string): string[] => {
  const files: string[] = [];

  if (!fs.existsSync(dirPath)) return files;

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    // Skip hidden/test files
    if (entry.name.startsWith('.')) continue;

    if (entry.isDirectory()) {
      files.push(...collectFiles(fullPath));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }

  return files;
};

/**
 * Run a full integrity check across all files in NAS and local storage.
 * Compares every file in both locations by size and MD5 hash.
 */
export const runIntegrityCheck = async (): Promise<IntegrityReport> => {
  const nasConfig = getNASConfig();
  const localPath = process.env.UPLOAD_PATH || './uploads';
  const results: IntegrityResult[] = [];

  console.log('[Integrity] Starting file integrity check...');

  if (!nasConfig.enabled) {
    console.log('[Integrity] NAS is not enabled, skipping integrity check');
    return {
      checkedAt: new Date().toISOString(),
      totalFiles: 0,
      ok: 0,
      mismatches: 0,
      missingNas: 0,
      missingLocal: 0,
      errors: 0,
      results: [],
    };
  }

  // Directories to check
  const directories = ['documents', 'templates', 'profile-photos', 'company-proposals'];

  // Collect all unique relative paths from both NAS and local
  const allRelativePaths = new Set<string>();

  for (const dir of directories) {
    const nasDir = path.join(nasConfig.mountPath, dir);
    const localDir = path.join(localPath, dir);

    // Collect from NAS
    const nasFiles = collectFiles(nasDir);
    for (const f of nasFiles) {
      allRelativePaths.add(path.relative(nasConfig.mountPath, f));
    }

    // Collect from local
    const localFiles = collectFiles(localDir);
    for (const f of localFiles) {
      allRelativePaths.add(path.relative(localPath, f));
    }
  }

  console.log(`[Integrity] Checking ${allRelativePaths.size} files...`);

  // Verify each file
  for (const relativePath of allRelativePaths) {
    const nasFilePath = path.join(nasConfig.mountPath, relativePath);
    const localFilePath = path.join(localPath, relativePath);

    const result = await verifyFileIntegrity(nasFilePath, localFilePath);
    // Use the relative path for cleaner reporting
    result.file = relativePath;
    results.push(result);
  }

  const report: IntegrityReport = {
    checkedAt: new Date().toISOString(),
    totalFiles: results.length,
    ok: results.filter((r) => r.status === 'ok').length,
    mismatches: results.filter((r) => r.status === 'mismatch').length,
    missingNas: results.filter((r) => r.status === 'missing_nas').length,
    missingLocal: results.filter((r) => r.status === 'missing_local').length,
    errors: results.filter((r) => r.status === 'error').length,
    results,
  };

  // Log summary
  console.log('[Integrity] Check Report:');
  console.log(`  Total files: ${report.totalFiles}`);
  console.log(`  OK: ${report.ok}`);
  console.log(`  Mismatches: ${report.mismatches}`);
  console.log(`  Missing on NAS: ${report.missingNas}`);
  console.log(`  Missing locally: ${report.missingLocal}`);
  console.log(`  Errors: ${report.errors}`);

  if (report.mismatches > 0) {
    console.log('[Integrity] MISMATCH DETAILS:');
    results
      .filter((r) => r.status === 'mismatch')
      .forEach((r) => console.log(`  - ${r.file}: ${r.detail}`));
  }

  return report;
};
