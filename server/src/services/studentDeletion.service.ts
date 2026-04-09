import fs from 'fs';
import path from 'path';
import { prisma } from '../config/database';
import { getStoragePath, resolveFilePath } from '../config/nas';

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

const buildProfilePhotoPath = (profilePhoto: string): string => {
  return path.join(getStoragePath(), 'profile-photos', profilePhoto);
};

const canIgnoreAsMissing = (error: unknown): boolean => {
  const maybeErr = error as NodeJS.ErrnoException;
  return maybeErr?.code === 'ENOENT';
};

const unlinkAndVerify = (targetPath: string): { deleted: boolean; missing: boolean } => {
  try {
    fs.unlinkSync(targetPath);
  } catch (error) {
    if (!canIgnoreAsMissing(error)) {
      throw error;
    }
    return { deleted: false, missing: true };
  }

  if (fs.existsSync(targetPath)) {
    throw new Error(`File still exists after unlink: ${targetPath}`);
  }

  return { deleted: true, missing: false };
};

const deletePhysicalFile = (storedPath: string): { deleted: boolean; missing: boolean } => {
  const resolvedPath = resolveFilePath(storedPath);
  if (!resolvedPath) {
    return { deleted: false, missing: true };
  }
  return unlinkAndVerify(resolvedPath);
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
      filepath: buildProfilePhotoPath(user.profilePhoto),
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

      const result = deletePhysicalFile(ref.filepath);
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
