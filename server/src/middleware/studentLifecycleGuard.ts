import { NextFunction, Response } from 'express';
import { StudentLifecycleStatus } from '@prisma/client';
import { AuthRequest } from './auth';
import { prisma } from '../config/database';

const BLOCKED_STATUSES = new Set<StudentLifecycleStatus>([
  StudentLifecycleStatus.COMPLETED,
  StudentLifecycleStatus.ARCHIVED,
  StudentLifecycleStatus.PURGED,
]);

const isWriteMethod = (method: string): boolean =>
  method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE';

const respondReadOnly = (res: Response, status: StudentLifecycleStatus) =>
  res.status(403).json({
    message: 'Student record is read-only in its current lifecycle state',
    lifecycleStatus: status,
    readOnly: true,
  });

export const guardStudentWriteByAuthenticatedUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!isWriteMethod(req.method)) return next();
    if (req.user?.role !== 'STUDENT') return next();

    const student = await prisma.student.findFirst({
      where: { userId: req.user.id },
      select: { lifecycleStatus: true },
    });

    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    if (BLOCKED_STATUSES.has(student.lifecycleStatus)) {
      return respondReadOnly(res, student.lifecycleStatus);
    }

    return next();
  } catch (error) {
    console.error('Lifecycle guard failed:', error);
    return res.status(500).json({ message: 'Failed to validate lifecycle state' });
  }
};

export const guardStudentWriteByStudentIdParam = (paramName: string = 'studentId') => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!isWriteMethod(req.method)) return next();

      const targetStudentId = (req.params[paramName] || req.body?.studentId) as string | undefined;
      if (!targetStudentId) return next();

      const student = await prisma.student.findUnique({
        where: { id: targetStudentId },
        select: { lifecycleStatus: true },
      });

      if (!student) {
        return res.status(404).json({ message: 'Student profile not found' });
      }

      if (BLOCKED_STATUSES.has(student.lifecycleStatus)) {
        return respondReadOnly(res, student.lifecycleStatus);
      }

      return next();
    } catch (error) {
      console.error('Lifecycle guard failed:', error);
      return res.status(500).json({ message: 'Failed to validate lifecycle state' });
    }
  };
};

