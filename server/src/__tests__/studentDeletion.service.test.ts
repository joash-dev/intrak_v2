import { jest, describe, beforeEach, test, expect } from '@jest/globals';

const prismaMock: any = {
  student: { findUnique: jest.fn() },
  document: { findMany: jest.fn(), count: jest.fn() },
  companyProposalAttachment: { findMany: jest.fn(), count: jest.fn() },
  user: { findUnique: jest.fn() },
  $transaction: jest.fn(),
};

jest.mock('../config/database', () => ({
  prisma: prismaMock,
}));

const resolveFilePathMock: any = jest.fn();
const getStoragePathMock: any = jest.fn(() => '/storage');
jest.mock('../config/nas', () => ({
  resolveFilePath: (value: string) => resolveFilePathMock(value),
  getStoragePath: () => getStoragePathMock(),
}));

const unlinkSyncMock: any = jest.fn();
const existsSyncMock: any = jest.fn();
jest.mock('fs', () => ({
  __esModule: true,
  default: {
    unlinkSync: (...args: unknown[]) => unlinkSyncMock(...args),
    existsSync: (...args: unknown[]) => existsSyncMock(...args),
  },
}));

import { deleteStudentAccountWithNASPurge } from '../services/studentDeletion.service';

const createTx = (): any => ({
  attendanceLog: { deleteMany: jest.fn().mockImplementation(async () => ({ count: 2 } as any)) },
  attendanceNoWorkNotice: { deleteMany: jest.fn().mockImplementation(async () => ({ count: 1 } as any)) },
  document: { deleteMany: jest.fn().mockImplementation(async () => ({ count: 3 } as any)) },
  evaluation: { deleteMany: jest.fn().mockImplementation(async () => ({ count: 1 } as any)) },
  companyApplication: { deleteMany: jest.fn().mockImplementation(async () => ({ count: 1 } as any)) },
  companyProposal: { deleteMany: jest.fn().mockImplementation(async () => ({ count: 1 } as any)) },
  partnershipMessage: { deleteMany: jest.fn().mockImplementation(async () => ({ count: 1 } as any)) },
  partnershipConversationRead: { deleteMany: jest.fn().mockImplementation(async () => ({ count: 1 } as any)) },
  refreshToken: { deleteMany: jest.fn().mockImplementation(async () => ({ count: 2 } as any)) },
  trustedDevice: { deleteMany: jest.fn().mockImplementation(async () => ({ count: 1 } as any)) },
  notification: { deleteMany: jest.fn().mockImplementation(async () => ({ count: 1 } as any)) },
  auditLog: { deleteMany: jest.fn().mockImplementation(async () => ({ count: 3 } as any)) },
  activity: { deleteMany: jest.fn().mockImplementation(async () => ({ count: 2 } as any)) },
  student: { delete: jest.fn().mockImplementation(async () => ({} as any)) },
  user: { delete: jest.fn().mockImplementation(async () => ({} as any)) },
});

describe('studentDeletion.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (prismaMock.student.findUnique as any).mockResolvedValue({ id: 'student-1', userId: 'user-1' });
    (prismaMock.document.findMany as any).mockResolvedValue([{ id: 'doc-1', filepath: '/nas/doc1.pdf' }]);
    (prismaMock.companyProposalAttachment.findMany as any).mockResolvedValue([{ id: 'att-1', filepath: '/nas/att1.pdf' }]);
    (prismaMock.user.findUnique as any).mockResolvedValue({ profilePhoto: 'photo.jpg' });
    (prismaMock.document.count as any).mockResolvedValue(0);
    (prismaMock.companyProposalAttachment.count as any).mockResolvedValue(0);
    resolveFilePathMock.mockImplementation((input: unknown) => String(input));
    unlinkSyncMock.mockImplementation(() => undefined);
    existsSyncMock.mockReturnValue(false);

    (prismaMock.$transaction as any).mockImplementation(async (cb: (tx: ReturnType<typeof createTx>) => Promise<unknown>) => {
      const tx = createTx();
      return cb(tx);
    });
  });

  test('deletes student account and purges NAS files', async () => {
    const result = await deleteStudentAccountWithNASPurge('student-1');

    expect(result.studentId).toBe('student-1');
    expect(result.files.discovered).toBe(3);
    expect(result.files.deleted).toBe(3);
    expect(result.files.failed).toBe(0);
    expect(result.deleted.studentRecord).toBe(1);
    expect(result.deleted.userAccount).toBe(1);
  });

  test('treats missing files as success (ENOENT idempotency)', async () => {
    const enoent = Object.assign(new Error('missing'), { code: 'ENOENT' });
    unlinkSyncMock.mockImplementation(() => {
      throw enoent;
    });

    const result = await deleteStudentAccountWithNASPurge('student-1');
    expect(result.files.missing).toBe(3);
    expect(result.files.failed).toBe(0);
  });

  test('does not unlink shared document paths owned by other students', async () => {
    (prismaMock.document.count as any).mockResolvedValue(1);

    const result = await deleteStudentAccountWithNASPurge('student-1');
    expect(result.files.discovered).toBe(3);
    expect(result.files.deleted).toBe(2);
    expect(unlinkSyncMock).toHaveBeenCalledTimes(2);
  });

  test('captures unlink failures and continues deletion', async () => {
    unlinkSyncMock.mockImplementationOnce(() => {
      throw new Error('EACCES denied');
    });

    const result = await deleteStudentAccountWithNASPurge('student-1');
    expect(result.files.failed).toBe(1);
    expect(result.files.failures[0]).toContain('EACCES denied');
    expect(result.deleted.userAccount).toBe(1);
  });
});
