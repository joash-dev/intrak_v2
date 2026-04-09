import { describe, expect, jest, test, beforeEach } from '@jest/globals';
import { StudentLifecycleStatus } from '@prisma/client';

const mockPrisma = {
  student: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  user: {
    update: jest.fn(),
  },
  $transaction: jest.fn(),
};

const mockAuditLog = jest.fn();

jest.mock('../config/database', () => ({
  prisma: mockPrisma,
}));

jest.mock('../services/audit.service', () => ({
  auditLog: mockAuditLog,
}));

import { transitionStudentLifecycle } from '../services/studentLifecycle.service';
import { guardStudentWriteByAuthenticatedUser } from '../middleware/studentLifecycleGuard';

describe('Student lifecycle service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('transitions ACTIVE -> COMPLETED and writes audit log', async () => {
    const base = {
      id: 'student-1',
      userId: 'user-1',
      lifecycleStatus: StudentLifecycleStatus.ACTIVE,
      completedAt: null,
      archivedAt: null,
      retentionUntil: null,
      legalHold: false,
    };

    (mockPrisma.student.findUnique as any).mockResolvedValue(base);
    const txStudentUpdate = jest.fn() as any;
    txStudentUpdate.mockResolvedValue({
      ...base,
      lifecycleStatus: StudentLifecycleStatus.COMPLETED,
      completedAt: new Date('2026-04-09T00:00:00.000Z'),
      retentionUntil: new Date('2033-04-09T00:00:00.000Z'),
    });
    const txUserUpdate = jest.fn() as any;
    txUserUpdate.mockResolvedValue({});

    (mockPrisma.$transaction as any).mockImplementation(async (cb: any) =>
      cb({
        student: { update: txStudentUpdate },
        user: { update: txUserUpdate },
      }),
    );

    const req = { ip: '127.0.0.1', get: () => 'jest' } as any;
    const result = await transitionStudentLifecycle({
      studentId: 'student-1',
      targetStatus: StudentLifecycleStatus.COMPLETED,
      actorUserId: 'actor-1',
      req,
    });

    expect(result.lifecycleStatus).toBe(StudentLifecycleStatus.COMPLETED);
    expect(mockAuditLog).toHaveBeenCalledTimes(1);
  });

  test('rejects invalid lifecycle transition', async () => {
    (mockPrisma.student.findUnique as any).mockResolvedValue({
      id: 'student-1',
      userId: 'user-1',
      lifecycleStatus: StudentLifecycleStatus.PURGED,
      completedAt: null,
      archivedAt: null,
      retentionUntil: null,
      legalHold: false,
    });

    await expect(
      transitionStudentLifecycle({
        studentId: 'student-1',
        targetStatus: StudentLifecycleStatus.ACTIVE,
        actorUserId: 'actor-1',
      }),
    ).rejects.toThrow('Invalid lifecycle transition');
  });
});

describe('Student lifecycle write guard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('blocks student write request when lifecycle is COMPLETED', async () => {
    (mockPrisma.student.findFirst as any).mockResolvedValue({
      lifecycleStatus: StudentLifecycleStatus.COMPLETED,
    });

    const req: any = { method: 'POST', user: { id: 'u1', role: 'STUDENT' } };
    const json = jest.fn();
    const res: any = { status: jest.fn(() => ({ json })), json };
    const next = jest.fn();

    await guardStudentWriteByAuthenticatedUser(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('allows non-student write request', async () => {
    const req: any = { method: 'PATCH', user: { id: 'u2', role: 'COORDINATOR' } };
    const res: any = { status: jest.fn(() => ({ json: jest.fn() })) };
    const next = jest.fn();

    await guardStudentWriteByAuthenticatedUser(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });
});

