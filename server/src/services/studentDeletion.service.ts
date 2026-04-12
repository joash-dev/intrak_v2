import fs from 'fs';
import path from 'path';
import { prisma } from '../config/database';
import { getNASConfig } from '../config/nas';

type FileRef = {
  model: 'document' | 'companyProposalAttachment' | 'profilePhoto';
  id: string;
  filepath: string;
};

export type StudentDeletionResult = {
  userId: string;
  studentId: string;
  deleted: {
    attendanceLogs: number;
    attendanceNoWorkNotices: number;
    documents: number;
    evaluations: number;
    companyApplications: number;
    companyProposals: number;
    partnershipMessages: number;
    partnershipConversationReads: number;
    refreshTokens: number;
    trustedDevices: number;
    notifications: number;
    auditLogs: number;
    activities: number;
    studentRecord: number;
    userAccount: number;
  };
  files: {
    discovered: number;
    deleted: number;
    missing: number;
    failed: number;
    failures: string[];
  };
};

const buildProfilePhotoRelPath = (profilePhoto: string): string => {
  return path.join('profile-photos', profilePhoto);
};

/**
 * Try to unlink a file at the given path. Returns true if something was
 * deleted, false if the file didn't exist. Throws on unexpected errors.
 */
const tryUnlink = async (targetPath: string): Promise<boolean> => {
  try {
    await fs.promises.unlink(targetPath);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException)?.code === 'ENOENT') return false;
    throw error;
  }
};

/**
 * Delete a file from both NAS and local storage so no orphans remain.
 * For stored absolute paths (documents, attachments) the NAS path is
 * the stored value itself; the local mirror is derived by replacing the
 * NAS mount prefix with the local UPLOAD_PATH.
 * For relative paths (profile photos) both roots are prepended.
 */
const deletePhysicalFile = async (storedPath: string): Promise<{ deleted: boolean; missing: boolean }> => {
  const nasConfig = getNASConfig();
  const localRoot = process.env.UPLOAD_PATH || './uploads';

  const candidates: string[] = [];

  if (path.isAbsolute(storedPath)) {
    candidates.push(storedPath);
    if (nasConfig.enabled && storedPath.startsWith(nasConfig.mountPath)) {
      const relative = path.relative(nasConfig.mountPath, storedPath);
      candidates.push(path.join(localRoot, relative));
    } else if (nasConfig.enabled) {
      const relative = path.relative(localRoot, storedPath);
      candidates.push(path.join(nasConfig.mountPath, relative));
    }
  } else {
    candidates.push(path.join(localRoot, storedPath));
    if (nasConfig.enabled) {
      candidates.push(path.join(nasConfig.mountPath, storedPath));
    }
  }

  let anyDeleted = false;
  for (const candidate of candidates) {
    try {
      if (await tryUnlink(candidate)) anyDeleted = true;
    } catch {
      // NAS might be down — swallow and continue to next candidate
    }
  }

  return { deleted: anyDeleted, missing: !anyDeleted };
};

const collectStudentFileRefs = async (studentId: string, userId: string): Promise<FileRef[]> => {
  const [documents, attachments, user] = await Promise.all([
    prisma.document.findMany({
      where: { studentId },
      select: { id: true, filepath: true },
    }),
    prisma.companyProposalAttachment.findMany({
      where: { proposal: { studentId } },
      select: { id: true, filepath: true },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { profilePhoto: true },
    }),
  ]);

  const refs: FileRef[] = [];
  for (const doc of documents) {
    if (doc.filepath && doc.filepath !== 'PENDING_PDF_GENERATION') {
      refs.push({ model: 'document', id: doc.id, filepath: doc.filepath });
    }
  }

  for (const attachment of attachments) {
    if (attachment.filepath) {
      refs.push({ model: 'companyProposalAttachment', id: attachment.id, filepath: attachment.filepath });
    }
  }

  if (user?.profilePhoto) {
    refs.push({
      model: 'profilePhoto',
      id: userId,
      filepath: buildProfilePhotoRelPath(user.profilePhoto),
    });
  }

  return refs;
};

const shouldDeletePhysicalPath = async (ref: FileRef, studentId: string): Promise<boolean> => {
  if (ref.model === 'document') {
    const externalRefs = await prisma.document.count({
      where: {
        filepath: ref.filepath,
        studentId: { not: studentId },
      },
    });
    return externalRefs === 0;
  }

  if (ref.model === 'companyProposalAttachment') {
    const externalRefs = await prisma.companyProposalAttachment.count({
      where: {
        filepath: ref.filepath,
        proposal: { studentId: { not: studentId } },
      },
    });
    return externalRefs === 0;
  }

  return true;
};

const purgeStudentFiles = async (studentId: string, userId: string): Promise<StudentDeletionResult['files']> => {
  const refs = await collectStudentFileRefs(studentId, userId);
  const files = {
    discovered: refs.length,
    deleted: 0,
    missing: 0,
    failed: 0,
    failures: [] as string[],
  };

  for (const ref of refs) {
    try {
      const shouldDelete = await shouldDeletePhysicalPath(ref, studentId);
      if (!shouldDelete) {
        continue;
      }

      const result = await deletePhysicalFile(ref.filepath);
      if (result.deleted) files.deleted += 1;
      if (result.missing) files.missing += 1;
    } catch (error) {
      files.failed += 1;
      files.failures.push(`${ref.model}:${ref.id} -> ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return files;
};

export const deleteStudentAccountWithNASPurge = async (studentId: string): Promise<StudentDeletionResult> => {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { id: true, userId: true },
  });

  if (!student) {
    const notFound = new Error('Student not found') as Error & { statusCode?: number };
    notFound.statusCode = 404;
    throw notFound;
  }

  const files = await purgeStudentFiles(student.id, student.userId);

  const deleted = await prisma.$transaction(async (tx) => {
    const [attendanceLogs, attendanceNoWorkNotices, documents, evaluations, companyApplications, companyProposals, partnershipMessages, partnershipConversationReads, refreshTokens, trustedDevices, notifications, auditLogs, activities] = await Promise.all([
      tx.attendanceLog.deleteMany({ where: { studentId: student.id } }),
      tx.attendanceNoWorkNotice.deleteMany({ where: { studentId: student.id } }),
      tx.document.deleteMany({ where: { studentId: student.id } }),
      tx.evaluation.deleteMany({ where: { studentId: student.id } }),
      tx.companyApplication.deleteMany({ where: { studentId: student.id } }),
      tx.companyProposal.deleteMany({ where: { studentId: student.id } }),
      tx.partnershipMessage.deleteMany({ where: { studentId: student.id } }),
      tx.partnershipConversationRead.deleteMany({ where: { studentId: student.id } }),
      tx.refreshToken.deleteMany({ where: { userId: student.userId } }),
      tx.trustedDevice.deleteMany({ where: { userId: student.userId } }),
      tx.notification.deleteMany({ where: { userId: student.userId } }),
      tx.auditLog.deleteMany({ where: { userId: student.userId } }),
      tx.activity.deleteMany({ where: { userId: student.userId } }),
    ]);

    await tx.student.delete({ where: { id: student.id } });
    await tx.user.delete({ where: { id: student.userId } });

    return {
      attendanceLogs: attendanceLogs.count,
      attendanceNoWorkNotices: attendanceNoWorkNotices.count,
      documents: documents.count,
      evaluations: evaluations.count,
      companyApplications: companyApplications.count,
      companyProposals: companyProposals.count,
      partnershipMessages: partnershipMessages.count,
      partnershipConversationReads: partnershipConversationReads.count,
      refreshTokens: refreshTokens.count,
      trustedDevices: trustedDevices.count,
      notifications: notifications.count,
      auditLogs: auditLogs.count,
      activities: activities.count,
      studentRecord: 1,
      userAccount: 1,
    };
  });

  return {
    userId: student.userId,
    studentId: student.id,
    deleted,
    files,
  };
};
