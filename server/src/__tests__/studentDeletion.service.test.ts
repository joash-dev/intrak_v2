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

const getNASConfigMock: any = jest.fn(() => ({
  enabled: true,
  mountPath: '/mnt/nas/intrak',
  host: '192.168.1.100',
  username: '',
  password: '',
  shareName: 'documents',
}));
jest.mock('../config/nas', () => ({
  getNASConfig: () => getNASConfigMock(),
}));

const unlinkMock: any = jest.fn();
jest.mock('fs', () => ({
  __esModule: true,
  default: {
    promises: {
      unlink: (...args: unknown[]) => unlinkMock(...args),
    },
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
    process.env.UPLOAD_PATH = './uploads';
    (prismaMock.student.findUnique as any).mockResolvedValue({ id: 'student-1', userId: 'user-1' });
    (prismaMock.document.findMany as any).mockResolvedValue([{ id: 'doc-1', filepath: '/mnt/nas/intrak/doc1.pdf' }]);
    (prismaMock.companyProposalAttachment.findMany as any).mockResolvedValue([{ id: 'att-1', filepath: '/mnt/nas/intrak/att1.pdf' }]);
    (prismaMock.user.findUnique as any).mockResolvedValue({ profilePhoto: 'photo.jpg' });
    (prismaMock.document.count as any).mockResolvedValue(0);
    (prismaMock.companyProposalAttachment.count as any).mockResolvedValue(0);
    unlinkMock.mockResolvedValue(undefined);

    (prismaMock.$transaction as any).mockImplementation(async (cb: (tx: ReturnType<typeof createTx>) => Promise<unknown>) => {
      const tx = createTx();
      return cb(tx);
    });
  });

  test('deletes student account and purges files from both locations', async () => {
    const result = await deleteStudentAccountWithNASPurge('student-1');

    expect(result.studentId).toBe('student-1');
    expect(result.files.discovered).toBe(3);
    expect(result.files.deleted).toBe(3);
    expect(result.files.failed).toBe(0);
    expect(result.deleted.studentRecord).toBe(1);
    expect(result.deleted.userAccount).toBe(1);
    // Each file should attempt both NAS and local paths
    expect(unlinkMock.mock.calls.length).toBeGreaterThanOrEqual(3);
  });

  test('treats missing files as success (ENOENT idempotency)', async () => {
    const enoent = Object.assign(new Error('missing'), { code: 'ENOENT' });
    unlinkMock.mockRejectedValue(enoent);

    const result = await deleteStudentAccountWithNASPurge('student-1');
    expect(result.files.missing).toBe(3);
    expect(result.files.failed).toBe(0);
  });

  test('does not unlink shared document paths owned by other students', async () => {
    (prismaMock.document.count as any).mockResolvedValue(1);

    const result = await deleteStudentAccountWithNASPurge('student-1');
    expect(result.files.discovered).toBe(3);
    // doc-1 is shared so skipped; att-1 + profile photo deleted
    expect(result.files.deleted).toBe(2);
  });

  test('captures unlink failures and continues deletion', async () => {
    // First call rejects with a non-ENOENT error, rest succeed
    unlinkMock.mockRejectedValueOnce(new Error('EACCES denied'));

    const result = await deleteStudentAccountWithNASPurge('student-1');
    // Even if one candidate path fails, the second candidate may succeed
    expect(result.deleted.userAccount).toBe(1);
  });
});
