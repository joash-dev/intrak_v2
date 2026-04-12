import fs from 'fs';
import path from 'path';
import { prisma } from '../config/database';
import { getNASConfig, validateNASConnection } from '../config/nas';
import { computeFileHash } from './fileIntegrity.service';

const STAGING_TOP_DIRS = ['documents', 'templates', 'profile-photos', 'company-proposals'] as const;

function parseRetentionDays(): number {
  const raw = process.env.LOCAL_NAS_STAGING_RETENTION_DAYS;
  const n = raw ? parseInt(raw, 10) : 15;
  return Number.isFinite(n) && n >= 1 && n <= 365 ? n : 15;
}

function shouldSkipRelative(rel: string): boolean {
  const norm = rel.split(path.sep).join('/');
  if (norm.startsWith('..')) return true;
  if (norm.startsWith('documents/temp/') || norm === 'documents/temp') return true;
  return false;
}

async function migrateDbPathsIfNeeded(localFilePath: string, nasFilePath: string): Promise<void> {
  const normLocal = path.normalize(localFilePath);
  await prisma.$transaction([
    prisma.document.updateMany({ where: { filepath: normLocal }, data: { filepath: nasFilePath } }),
    prisma.documentTemplate.updateMany({ where: { filepath: normLocal }, data: { filepath: nasFilePath } }),
    prisma.companyProposalAttachment.updateMany({ where: { filepath: normLocal }, data: { filepath: nasFilePath } }),
  ]);
}

/**
 * Deletes local upload files older than retention days when an identical copy exists on NAS
 * (size + MD5). Updates DB filepath from local → NAS where rows still pointed at local.
 * Runs only when USE_NAS=true and NAS is reachable.
 */
export async function runLocalNasStagingCleanup(): Promise<{
  scanned: number;
  deleted: number;
  skipped: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let scanned = 0;
  let deleted = 0;
  let skipped = 0;

  const nasConfig = getNASConfig();
  if (!nasConfig.enabled || process.env.USE_NAS !== 'true') {
    return { scanned, deleted, skipped, errors };
  }

  if (process.env.LOCAL_NAS_STAGING_CLEANUP_ENABLED === 'false') {
    console.log('[NAS Staging Cleanup] Disabled via LOCAL_NAS_STAGING_CLEANUP_ENABLED=false');
    return { scanned, deleted, skipped, errors };
  }

  const nasUp = await validateNASConnection();
  if (!nasUp) {
    console.log('[NAS Staging Cleanup] NAS unavailable, skipping');
    return { scanned, deleted, skipped, errors };
  }

  const localRoot = path.resolve(process.env.UPLOAD_PATH || './uploads');
  const retentionMs = parseRetentionDays() * 24 * 60 * 60 * 1000;
  const cutoff = Date.now() - retentionMs;

  const processFile = async (localFilePath: string): Promise<void> => {
    scanned++;
    let stat: fs.Stats;
    try {
      stat = fs.statSync(localFilePath);
    } catch {
      skipped++;
      return;
    }
    if (!stat.isFile()) return;
    if (stat.mtimeMs > cutoff) {
      skipped++;
      return;
    }

    const rel = path.relative(localRoot, localFilePath);
    if (shouldSkipRelative(rel)) {
      skipped++;
      return;
    }

    const nasFilePath = path.join(nasConfig.mountPath, rel);
    if (!fs.existsSync(nasFilePath)) {
      skipped++;
      return;
    }

    let nasStat: fs.Stats;
    try {
      nasStat = fs.statSync(nasFilePath);
    } catch {
      skipped++;
      return;
    }
    if (nasStat.size !== stat.size) {
      skipped++;
      return;
    }

    try {
      const [hLocal, hNas] = await Promise.all([
        computeFileHash(localFilePath),
        computeFileHash(nasFilePath),
      ]);
      if (hLocal !== hNas) {
        skipped++;
        return;
      }
    } catch (e) {
      errors.push(`${localFilePath}: hash ${e instanceof Error ? e.message : String(e)}`);
      skipped++;
      return;
    }

    const normLocal = path.normalize(localFilePath);
    const [docs, tmpl, att] = await Promise.all([
      prisma.document.count({ where: { filepath: normLocal } }),
      prisma.documentTemplate.count({ where: { filepath: normLocal } }),
      prisma.companyProposalAttachment.count({ where: { filepath: normLocal } }),
    ]);
    if (docs + tmpl + att > 0) {
      await migrateDbPathsIfNeeded(localFilePath, nasFilePath);
    }

    try {
      fs.unlinkSync(localFilePath);
      deleted++;
      console.log(`[NAS Staging Cleanup] Removed local (NAS verified): ${rel}`);
    } catch (e) {
      errors.push(`${localFilePath}: unlink ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const walkDir = async (dir: string): Promise<void> => {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const ent of entries) {
      if (ent.name.startsWith('.')) continue;
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        await walkDir(full);
      } else if (ent.isFile()) {
        await processFile(full);
      }
    }
  };

  try {
    for (const top of STAGING_TOP_DIRS) {
      await walkDir(path.join(localRoot, top));
    }
  } catch (e) {
    errors.push(e instanceof Error ? e.message : String(e));
  }

  if (deleted > 0 || errors.length > 0) {
    console.log(
      `[NAS Staging Cleanup] Done: scanned=${scanned}, deleted=${deleted}, skipped=${skipped}, errors=${errors.length}`,
    );
  }

  return { scanned, deleted, skipped, errors };
}
