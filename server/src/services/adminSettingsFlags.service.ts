import { prisma } from '../config/database';

/**
 * When true (default), after a successful primary write to NAS, also mirror to UPLOAD_PATH via createLocalBackup.
 * When false, primary NAS-only (no automatic local duplicate at upload time). NAS-down fallback and syncLocalToNAS unchanged.
 */
export const getMirrorNasUploadsToLocalEnabled = async (): Promise<boolean> => {
  const row = await prisma.adminSettings.findFirst({
    select: { mirrorNasUploadsToLocal: true },
  });
  return row?.mirrorNasUploadsToLocal ?? true;
};
