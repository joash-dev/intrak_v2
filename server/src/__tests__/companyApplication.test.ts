import request from 'supertest';
import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import app from '../index';

const companyApplicationFindMany = jest.fn();
const companyApplicationFindUnique = jest.fn();
const companyApplicationUpdate = jest.fn();
const companyApplicationUpdateMany = jest.fn();
const companyFindUnique = jest.fn();
const studentUpdate = jest.fn();
const transactionMock = jest.fn();
const txCompanyApplicationUpdate = jest.fn();
const txCompanyApplicationUpdateMany = jest.fn();
const txStudentUpdate = jest.fn();

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => ({
    companyApplication: {
      findMany: (...args: any[]) => companyApplicationFindMany(...args),
      findUnique: (...args: any[]) => companyApplicationFindUnique(...args),
      update: (...args: any[]) => companyApplicationUpdate(...args),
      updateMany: (...args: any[]) => companyApplicationUpdateMany(...args),
    },
    company: {
      findUnique: (...args: any[]) => companyFindUnique(...args),
    },
    student: {
      update: (...args: any[]) => studentUpdate(...args),
    },
    $transaction: (callback: any) => transactionMock(callback),
  })),
}));

jest.mock('../middleware/auth', () => ({
  authenticate: (req: any, _res: any, next: any) => {
    req.user = {
      id: 'instructor-1',
      role: 'INSTRUCTOR',
      name: 'Ana Rodriguez',
    };
    next();
  },
}));

jest.mock('../middleware/authorize', () => ({
  authorize: (_roles: string[]) => (_req: any, _res: any, next: any) => next(),
}));

jest.mock('../controllers/activity.controller', () => ({
  logActivity: jest.fn(),
  getRecentActivities: jest.fn((req: any, res: any) => res.json({ activities: [] })),
  createActivity: jest.fn((req: any, res: any) => res.status(201).json({})),
}));

jest.mock('../services/report.service', () => ({
  getAttendanceReportData: jest.fn(),
  generateAttendanceReportPDF: jest.fn(),
  generateAttendanceReportExcel: jest.fn(),
  getComplianceReportData: jest.fn(),
  generateComplianceReportExcel: jest.fn(),
}));

describe('Company application approval slot enforcement', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    transactionMock.mockImplementation(async (callback: any) =>
      callback({
        companyApplication: {
          update: txCompanyApplicationUpdate,
          updateMany: txCompanyApplicationUpdateMany,
        },
        student: {
          update: txStudentUpdate,
        },
      }),
    );
  });

  test('rejects approval when company has no available slots', async () => {
    companyApplicationFindUnique.mockImplementation(async () => ({
      id: 'application-1',
      status: 'PENDING',
      studentId: 'student-1',
      companyId: 'company-1',
      student: { user: { name: 'John Smith' } },
      company: { name: 'DILG' },
    } as any));

    companyFindUnique.mockImplementation(async () => ({
      id: 'company-1',
      name: 'DILG',
      maxSlots: 5,
      students: [{}, {}, {}, {}, {}],
    } as any));

    const response = await request(app)
      .patch('/api/company-applications/application-1/approve')
      .set('Authorization', 'Bearer fake-token')
      .expect(400);

    expect(companyApplicationFindUnique).toHaveBeenCalledWith({
      where: { id: 'application-1' },
      include: {
        student: { include: { user: true } },
        company: true,
      },
    });
    expect(companyFindUnique).toHaveBeenCalled();
    expect(transactionMock).not.toHaveBeenCalled();
    expect(response.body.message).toMatch(/no available slots/i);
  });

  test('approves application when slots are available', async () => {
    companyApplicationFindUnique.mockImplementation(async () => ({
      id: 'application-2',
      status: 'PENDING',
      studentId: 'student-2',
      companyId: 'company-2',
      student: { user: { name: 'Jane Doe' } },
      company: { name: 'Tech Corp' },
    } as any));

    companyFindUnique.mockImplementation(async () => ({
      id: 'company-2',
      name: 'Tech Corp',
      maxSlots: 5,
      students: [{}, {}],
    } as any));

    txCompanyApplicationUpdate.mockImplementation(async () => ({
      id: 'application-2',
      status: 'APPROVED',
      student: { user: { name: 'Jane Doe' } },
      company: { name: 'Tech Corp', maxSlots: 5 },
      reviewer: { name: 'Ana Rodriguez', email: 'ana@intrak.edu.ph' },
    } as any));
    txStudentUpdate.mockImplementation(async () => ({ id: 'student-2' } as any));
    txCompanyApplicationUpdateMany.mockImplementation(async () => ({ count: 1 } as any));

    const response = await request(app)
      .patch('/api/company-applications/application-2/approve')
      .set('Authorization', 'Bearer fake-token')
      .expect(200);

    expect(transactionMock).toHaveBeenCalled();
    expect(txCompanyApplicationUpdate).toHaveBeenCalledWith({
      where: { id: 'application-2' },
      data: expect.objectContaining({ status: 'APPROVED' }),
      include: expect.any(Object),
    });
    expect(txStudentUpdate).toHaveBeenCalledWith({
      where: { id: 'student-2' },
      data: { companyId: 'company-2' },
    });
    expect(txCompanyApplicationUpdateMany).toHaveBeenCalledWith({
      where: {
        studentId: 'student-2',
        id: { not: 'application-2' },
        status: 'PENDING',
      },
      data: expect.objectContaining({ status: 'REJECTED' }),
    });
    expect(response.body.application.status).toBe('APPROVED');
  });
});
