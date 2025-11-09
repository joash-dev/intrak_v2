import request from 'supertest';
import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import app from '../index';

const documentFindUnique = jest.fn();
const documentFeedbackFindMany = jest.fn();
const documentFeedbackCreate = jest.fn();
const documentUpdate = jest.fn();
const studentCount = jest.fn();
const createNotificationMock = jest.fn();

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => ({
    document: {
      findUnique: (...args: any[]) => documentFindUnique(...args),
      update: (...args: any[]) => documentUpdate(...args),
    },
    documentFeedback: {
      findMany: (...args: any[]) => documentFeedbackFindMany(...args),
      create: (...args: any[]) => documentFeedbackCreate(...args),
    },
    student: {
      count: (...args: any[]) => studentCount(...args),
    },
  })),
  DocumentFeedbackType: {
    COMMENT: 'COMMENT',
    REQUEST_CHANGES: 'REQUEST_CHANGES',
    APPROVAL_NOTE: 'APPROVAL_NOTE',
    STUDENT_RESPONSE: 'STUDENT_RESPONSE',
  },
  NotificationType: {
    DOCUMENT: 'DOCUMENT',
    ATTENDANCE: 'ATTENDANCE',
    SYSTEM: 'SYSTEM',
    ALERT: 'ALERT',
    OTHER: 'OTHER',
  },
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

jest.mock('../services/notification.service', () => ({
  notificationService: {
    createNotification: (...args: any[]) => createNotificationMock(...args),
  },
}));

jest.mock('../services/report.service', () => ({
  getAttendanceReportData: jest.fn(),
  generateAttendanceReportPDF: jest.fn(),
  generateAttendanceReportExcel: jest.fn(),
  getComplianceReportData: jest.fn(),
  generateComplianceReportExcel: jest.fn(),
}));

jest.mock('../services/audit.service', () => ({
  auditLog: jest.fn(),
}));

describe('Document feedback endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns feedback entries when access is granted', async () => {
    documentFindUnique.mockImplementation(async () => ({
      id: 'doc-1',
      studentId: 'student-1',
    }));
    studentCount.mockImplementation(async () => 1);
    documentFeedbackFindMany.mockImplementation(async () => [
      {
        id: 'fb-1',
        documentId: 'doc-1',
        message: 'Looks good',
        type: 'COMMENT',
        requiresAction: false,
        createdAt: new Date().toISOString(),
        author: { id: 'instructor-2', name: 'Jane Smith', role: 'INSTRUCTOR', profilePhoto: null },
      },
    ]);

    const response = await request(app)
      .get('/api/documents/doc-1/feedback')
      .set('Authorization', 'Bearer fake-token')
      .expect(200);

    expect(documentFindUnique).toHaveBeenCalledWith({
      where: { id: 'doc-1' },
      select: { id: true, studentId: true },
    });
    expect(studentCount).toHaveBeenCalled();
    expect(response.body.feedback).toHaveLength(1);
    expect(response.body.feedback[0].message).toBe('Looks good');
  });

  test('denies feedback retrieval when access is forbidden', async () => {
    documentFindUnique.mockImplementation(async () => ({
      id: 'doc-2',
      studentId: 'student-2',
    }));
    studentCount.mockImplementation(async () => 0);

    await request(app)
      .get('/api/documents/doc-2/feedback')
      .set('Authorization', 'Bearer fake-token')
      .expect(403);

    expect(documentFeedbackFindMany).not.toHaveBeenCalled();
  });

  test('creates feedback and notifies recipients', async () => {
    documentFindUnique.mockImplementation(async () => ({
      id: 'doc-3',
      studentId: 'student-3',
      type: 'FINAL_REPORT',
      student: {
        user: { id: 'student-user-3' },
        instructor: { id: 'instructor-2' },
      },
      uploadedBy: { id: 'uploader-1' },
    }));
    studentCount.mockImplementation(async () => 1);
    documentFeedbackCreate.mockImplementation(async () => ({
      id: 'fb-2',
      documentId: 'doc-3',
      message: 'Please adjust formatting',
      type: 'REQUEST_CHANGES',
      requiresAction: true,
      author: { id: 'instructor-1', name: 'Ana Rodriguez', role: 'INSTRUCTOR', profilePhoto: null },
      createdAt: new Date().toISOString(),
    }));
    documentUpdate.mockImplementation(async () => ({ id: 'doc-3' }));

    const response = await request(app)
      .post('/api/documents/doc-3/feedback')
      .set('Authorization', 'Bearer fake-token')
      .send({ message: 'Please adjust formatting', type: 'REQUEST_CHANGES' })
      .expect(201);

    expect(documentFeedbackCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        documentId: 'doc-3',
        authorId: 'instructor-1',
        message: 'Please adjust formatting',
        type: 'REQUEST_CHANGES',
        requiresAction: true,
      }),
      include: { author: { select: { id: true, name: true, role: true, profilePhoto: true } } },
    });
    expect(documentUpdate).toHaveBeenCalledWith({
      where: { id: 'doc-3' },
      data: { status: 'RESUBMISSION_REQUESTED', remarks: 'Please adjust formatting' },
    });
    expect(createNotificationMock).toHaveBeenCalledTimes(3);
    expect(response.body.feedback.id).toBe('fb-2');
  });
});
