import request from 'supertest';
import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import app from '../index';

const attendanceLogFindMany = jest.fn();
const attendanceLogCreate = jest.fn();
const companyFindMany = jest.fn() as jest.Mock;
const studentFindUnique = jest.fn();
const studentFindFirst = jest.fn();
const qRTokenUpdate = jest.fn();

jest.mock('@prisma/client', () => {
  return {
    PrismaClient: jest.fn(() => ({
      attendanceLog: {
        findMany: (...args: any[]) => attendanceLogFindMany(...args),
        create: (...args: any[]) => attendanceLogCreate(...args),
      },
      student: {
        findUnique: (...args: any[]) => studentFindUnique(...args),
        findFirst: (...args: any[]) => studentFindFirst(...args),
      },
      company: {
        findMany: (...args: any[]) => companyFindMany(...args),
      },
      qRToken: {
        update: (...args: any[]) => qRTokenUpdate(...args),
      },
    })),
  };
});

jest.mock('../middleware/auth', () => ({
  authenticate: (req: any, _res: any, next: any) => {
    req.user = {
      id: 'supervisor-1',
      role: 'INDUSTRY_PARTNER',
      email: 'supervisor@example.com',
    };
    next();
  },
}));

jest.mock('../middleware/authorize', () => ({
  authorize: (_roles: string[]) => (_req: any, _res: any, next: any) => next(),
}));

jest.mock('../services/audit.service', () => ({
  auditLog: jest.fn(),
}));

const verifyQRTokenMock = jest.fn();
jest.mock('../services/qr.service', () => ({
  generateQRToken: jest.fn(),
  verifyQRToken: (...args: any[]) => verifyQRTokenMock(...args),
}));

const getAttendanceReportDataMock = jest.fn();
const generateAttendanceReportPDFMock = jest.fn();
const generateAttendanceReportExcelMock = jest.fn();
const getComplianceReportDataMock = jest.fn();
const generateComplianceReportExcelMock = jest.fn();

jest.mock('../services/report.service', () => ({
  getAttendanceReportData: (...args: any[]) => getAttendanceReportDataMock(...args),
  generateAttendanceReportPDF: (...args: any[]) => generateAttendanceReportPDFMock(...args),
  generateAttendanceReportExcel: (...args: any[]) => generateAttendanceReportExcelMock(...args),
  getComplianceReportData: (...args: any[]) => getComplianceReportDataMock(...args),
  generateComplianceReportExcel: (...args: any[]) => generateComplianceReportExcelMock(...args),
}));

describe('Attendance routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    companyFindMany.mockImplementation(async () => [{ id: 'company-1' }]);
  });

  test('returns attendance logs for supervisor', async () => {
    attendanceLogFindMany.mockImplementation(async () => [
      {
        id: 'log-1',
        studentId: 'student-1',
        date: '2024-01-01T00:00:00.000Z',
        timeIn: '2024-01-01T08:00:00.000Z',
        timeOut: '2024-01-01T17:00:00.000Z',
        durationMinutes: 540,
        verified: true,
        verificationMethod: 'QR',
        student: {
          studentNumber: 'S-001',
          user: { name: 'Jane Doe' },
        },
      },
    ]);

    const response = await request(app)
      .get('/api/attendance?studentId=student-1')
      .set('Authorization', 'Bearer fake-token')
      .expect(200);

    expect(attendanceLogFindMany).toHaveBeenCalled();
    expect(response.body.logs).toHaveLength(1);
    expect(response.body.logs[0]).toMatchObject({
      studentId: 'student-1',
      verified: true,
    });
  });

  test('verifies attendance via QR token', async () => {
    verifyQRTokenMock.mockImplementation(async () => ({
      id: 'qr-token-1',
      studentId: 'student-1',
      used: false,
      expiresAt: new Date(Date.now() + 60_000),
    }));
    studentFindUnique.mockImplementation(async () => ({
      id: 'student-1',
      company: {
        latitude: 1,
        longitude: 1,
      },
    }));
    attendanceLogCreate.mockImplementation(async () => ({ id: 'log-123' }));
    qRTokenUpdate.mockImplementation(async () => ({}));

    const response = await request(app)
      .post('/api/attendance/qr/verify')
      .set('Authorization', 'Bearer fake-token')
      .send({ token: 'valid-token', latitude: 1, longitude: 1 })
      .expect(200);

    expect(verifyQRTokenMock).toHaveBeenCalledWith('valid-token');
    expect(attendanceLogCreate).toHaveBeenCalled();
    expect(qRTokenUpdate).toHaveBeenCalled();
    expect(response.body.log).toEqual({ id: 'log-123' });
  });
});

describe('Report routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    companyFindMany.mockImplementation(async () => [{ id: 'company-1' }]);
  });

  test('serves attendance report JSON', async () => {
    getAttendanceReportDataMock.mockImplementation(async () => ({
      student: {
        id: 'student-1',
        studentNumber: 'S-001',
        name: 'Jane Doe',
        totalHoursRequired: 200,
        completedHours: 40,
      },
      logs: [],
      summary: {
        totalLogs: 1,
        totalMinutes: 60,
        totalHours: 1,
        verifiedLogs: 1,
        pendingLogs: 0,
        averageHoursPerDay: 1,
      },
    }));

    const response = await request(app)
      .get('/api/reports/attendance?studentId=student-1&format=json')
      .set('Authorization', 'Bearer fake-token')
      .expect(200);

    expect(getAttendanceReportDataMock).toHaveBeenCalledWith({
      studentId: 'student-1',
      dateFrom: undefined,
      dateTo: undefined,
    });
    expect(response.body.student.id).toBe('student-1');
    expect(response.body.summary.totalHours).toBe(1);
  });
});
