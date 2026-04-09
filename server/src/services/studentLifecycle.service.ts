import { StudentLifecycleStatus } from '@prisma/client';
import { Request } from 'express';
import { prisma } from '../config/database';
import { auditLog } from './audit.service';

type TransitionInput = {
  studentId: string;
  targetStatus: StudentLifecycleStatus;
  actorUserId: string;
  reason?: string;
  req?: Request;
  retentionYears?: number;
};

const IMMUTABLE_STATUSES = new Set<StudentLifecycleStatus>([
  StudentLifecycleStatus.COMPLETED,
  StudentLifecycleStatus.ARCHIVED,
  StudentLifecycleStatus.PURGED,
]);

const ALLOWED_TRANSITIONS: Record<StudentLifecycleStatus, StudentLifecycleStatus[]> = {
  ACTIVE: [StudentLifecycleStatus.COMPLETED, StudentLifecycleStatus.ARCHIVED],
  COMPLETED: [StudentLifecycleStatus.ARCHIVED, StudentLifecycleStatus.ACTIVE],
  ARCHIVED: [StudentLifecycleStatus.ACTIVE, StudentLifecycleStatus.PURGED],
  PURGED: [],
};

const addYears = (value: Date, years: number): Date => {
  const next = new Date(value);
  next.setFullYear(next.getFullYear() + years);
  return next;
};

export const isStudentLifecycleReadOnly = (status: StudentLifecycleStatus): boolean =>
  IMMUTABLE_STATUSES.has(status);

export const transitionStudentLifecycle = async ({
  studentId,
  targetStatus,
  actorUserId,
  reason,
  req,
  retentionYears = 7,
}: TransitionInput) => {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: {
      id: true,
      userId: true,
      lifecycleStatus: true,
      completedAt: true,
      archivedAt: true,
      retentionUntil: true,
      legalHold: true,
    },
  });

  if (!student) {
    const error = new Error('Student not found');
    (error as any).statusCode = 404;
    throw error;
  }

  if (student.lifecycleStatus === targetStatus) {
    return student;
  }

  const allowed = ALLOWED_TRANSITIONS[student.lifecycleStatus] || [];
  if (!allowed.includes(targetStatus)) {
    const error = new Error(
      `Invalid lifecycle transition from ${student.lifecycleStatus} to ${targetStatus}`,
    );
    (error as any).statusCode = 400;
    throw error;
  }

  if (student.legalHold && targetStatus === StudentLifecycleStatus.PURGED) {
    const error = new Error('Cannot purge a student record while legal hold is active');
    (error as any).statusCode = 409;
    throw error;
  }

  const now = new Date();
  const data: any = { lifecycleStatus: targetStatus };

  if (targetStatus === StudentLifecycleStatus.COMPLETED) {
    data.completedAt = student.completedAt ?? now;
    data.retentionUntil = student.retentionUntil ?? addYears(now, retentionYears);
  }

  if (targetStatus === StudentLifecycleStatus.ARCHIVED) {
    data.archivedAt = now;
  }

  if (targetStatus === StudentLifecycleStatus.ACTIVE) {
    data.archivedAt = null;
  }

  const updated = await prisma.$transaction(async (tx) => {
    const nextStudent = await tx.student.update({
      where: { id: student.id },
      data,
      select: {
        id: true,
        userId: true,
        lifecycleStatus: true,
        completedAt: true,
        archivedAt: true,
        retentionUntil: true,
        legalHold: true,
      },
    });

    // Archived or purged students should no longer authenticate.
    if (targetStatus === StudentLifecycleStatus.ARCHIVED || targetStatus === StudentLifecycleStatus.PURGED) {
      await tx.user.update({
        where: { id: student.userId },
        data: { active: false },
      });
    }

    // If moved back to active/completed from archived, restore account access.
    if (targetStatus === StudentLifecycleStatus.ACTIVE || targetStatus === StudentLifecycleStatus.COMPLETED) {
      await tx.user.update({
        where: { id: student.userId },
        data: { active: true },
      });
    }

    return nextStudent;
  });

  if (req) {
    await auditLog(
      actorUserId,
      'STUDENT_LIFECYCLE_TRANSITIONED',
      {
        studentId: student.id,
        from: student.lifecycleStatus,
        to: targetStatus,
        reason: reason ?? null,
      },
      req,
    );
  }

  return updated;
};

