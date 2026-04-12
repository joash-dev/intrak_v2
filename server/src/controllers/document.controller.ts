import { Response } from 'express';
import { formDefinitions, hasFormTemplate, FormDefinition } from '../constants/formDefinitions';
import { generatePreviewHtml, generatePdf } from '../services/pdfGenerator.service';
import { DocumentFeedbackType, NotificationType } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { auditLog } from '../services/audit.service';
import { validateNASConnection, getStoragePathWithFallback, ensureNASDirectoryExists, resolveFilePath, invalidateNASCache, getNASConfig } from '../config/nas';

const NAS_IO_ERRORS = ['EHOSTDOWN', 'EIO', 'ETIMEDOUT', 'ECONNRESET', 'ECONNREFUSED', 'ENETUNREACH'];
import path from 'path';
import fs from 'fs';
import { notificationService } from '../services/notification.service';
import { emitDocumentUploaded, emitDocumentStatusChanged } from '../utils/socketEmitters';
import { prisma } from '../config/database';
import { FILE_UNAVAILABLE_TRY_AGAIN_MESSAGE } from '../constants/storageMessages';

/** Pre-deployment types other than RECORD_FILE — Record File checklist row shows ✔ last (after these exist). */
const PRE_DEPLOYMENT_TYPES_EXCEPT_RECORD_FILE = [
  'APPLICATION_INTERNSHIP',
  'MEDICAL_CERTIFICATE',
  'CERTIFICATION_UNITS',
  'INTERNSHIP_RESUME',
  'CONSENT_FORM',
  'ENDORSEMENT_LETTER',
  'INTERNSHIP_RELEASE',
] as const;

/** Each inner array is one required slot; at least one APPROVED document per slot (endorsement: single or multi). */
const PRE_DEPLOYMENT_APPROVAL_SLOTS: readonly (readonly string[])[] = [
  ['APPLICATION_INTERNSHIP'],
  ['MEDICAL_CERTIFICATE'],
  ['CERTIFICATION_UNITS'],
  ['INTERNSHIP_RESUME'],
  ['CONSENT_FORM'],
  ['ENDORSEMENT_LETTER', 'ENDORSEMENT_LETTER_MULTI'],
  ['INTERNSHIP_RELEASE'],
  ['RECORD_FILE'],
];

function isAllPreDeploymentSlotsApproved(approvedTypes: Set<string>): boolean {
  return PRE_DEPLOYMENT_APPROVAL_SLOTS.every((slot) => slot.some((t) => approvedTypes.has(t)));
}

/**
 * For RECORD_FILE documents, compute the checklist status values
 * by querying which document types the student has already submitted (any status).
 * Returns an object like { status_APPLICATION_INTERNSHIP: '✔', status_MOA: '', ... }
 *
 * Row "Record File" (status_RECORD_FILE) only shows ✔ when a RECORD_FILE exists and every other
 * pre-deployment item has been submitted — so it appears as the last checklist item to comply.
 */
const computeRecordFileStatuses = async (studentId: string): Promise<Record<string, string>> => {
  const submittedDocs = await prisma.document.findMany({
    where: { studentId },
    select: { type: true },
  });

  const submittedTypes = new Set(submittedDocs.map(d => d.type));

  const hasSubmitted = (docType: string): boolean => {
    if (docType === 'ENDORSEMENT_LETTER') {
      return submittedTypes.has('ENDORSEMENT_LETTER') || submittedTypes.has('ENDORSEMENT_LETTER_MULTI');
    }
    return submittedTypes.has(docType as any);
  };

  const allDocTypes = [
    'RECORD_FILE', 'APPLICATION_INTERNSHIP', 'MEDICAL_CERTIFICATE',
    'CERTIFICATION_UNITS', 'INTERNSHIP_RESUME', 'CONSENT_FORM',
    'ENDORSEMENT_LETTER', 'INTERNSHIP_RELEASE', 'MOA',
    'INTERNSHIP_AGREEMENT', 'TRAINING_AGREEMENT', 'INTERNSHIP_EVALUATION',
    'CERTIFICATE_COMPLETION', 'NARRATIVE_REPORT', 'DTR_PHOTOCOPY',
    'TIME_FRAMES', 'WEEKLY_REPORTS', 'STUDENT_FEEDBACK',
    'SUPERVISOR_FEEDBACK', 'AGENCY_SELF_EVALUATION', 'INTERNSHIP_EVALUATION_AGENCY'
  ];

  const statuses: Record<string, string> = {};
  allDocTypes.forEach(docType => {
    if (docType === 'RECORD_FILE') {
      const othersComplete = PRE_DEPLOYMENT_TYPES_EXCEPT_RECORD_FILE.every((t) => hasSubmitted(t));
      const hasRecordFile = submittedTypes.has('RECORD_FILE');
      statuses['status_RECORD_FILE'] = hasRecordFile && othersComplete ? '✔' : '';
      return;
    }

    let hasDoc = submittedTypes.has(docType as any);
    // Also count ENDORSEMENT_LETTER_MULTI as fulfilling ENDORSEMENT_LETTER
    if (!hasDoc && docType === 'ENDORSEMENT_LETTER') {
      hasDoc = submittedTypes.has('ENDORSEMENT_LETTER_MULTI' as any);
    }
    statuses[`status_${docType}`] = hasDoc ? '✔' : '';
  });
  return statuses;
};

const getStudentIdForUser = async (userId: string): Promise<string | null> => {
  const student = await prisma.student.findFirst({
    where: { userId },
    select: { id: true },
  });

  return student?.id ?? null;
};

const ensureDocumentAccess = async (req: AuthRequest, documentStudentId: string): Promise<boolean> => {
  const role = req.user?.role;
  const userId = req.user?.id;

  if (!role || !userId) {
    return false;
  }

  if (['ADMIN', 'COORDINATOR'].includes(role)) {
    return true;
  }

  if (role === 'STUDENT') {
    const studentId = await getStudentIdForUser(userId);
    return studentId === documentStudentId;
  }

  if (role === 'INSTRUCTOR') {
    const count = await prisma.student.count({
      where: {
        id: documentStudentId,
        instructorId: userId,
      },
    });
    return count > 0;
  }

  if (role === 'INDUSTRY_PARTNER') {
    const count = await prisma.student.count({
      where: {
        id: documentStudentId,
        company: {
          supervisorId: userId,
        },
      },
    });
    return count > 0;
  }

  return false;
};

const dispatchNotification = async (
  recipientIds: Set<string>,
  payload: { title: string; message: string; link?: string | null; type?: NotificationType },
) => {
  await Promise.all(
    Array.from(recipientIds)
      .filter(Boolean)
      .map((userId) =>
        notificationService.createNotification({
          userId,
          title: payload.title,
          message: payload.message,
          link: payload.link ?? null,
          type: payload.type ?? NotificationType.OTHER,
        }),
      ),
  );
};

export const uploadDocument = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { studentId, type, companyId } = req.body;

    // Validate required fields
    if (!type) {
      return res.status(400).json({
        message: 'Document type is required'
      });
    }

    let targetStudentId = studentId;

    // If user is a student, automatically use their student ID
    if (req.user!.role === 'STUDENT') {
      const currentStudent = await prisma.student.findUnique({
        where: { userId: req.user!.id }
      });

      if (!currentStudent) {
        return res.status(404).json({ message: 'Student record not found' });
      }

      targetStudentId = currentStudent.id;
    } else if (!studentId) {
      return res.status(400).json({
        message: 'Student ID is required for non-student users'
      });
    }

    // Verify student exists
    const student = await prisma.student.findUnique({
      where: { id: targetStudentId },
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const normalizedCompanyId =
      typeof companyId === 'string' && companyId.trim().length > 0
        ? companyId.trim()
        : undefined;

    if (normalizedCompanyId && student.companyId !== normalizedCompanyId) {
      return res.status(400).json({
        message: `Selected student is not assigned to the chosen company${student.company?.name ? ` (${student.company.name})` : ''
          }.`,
      });
    }

    // Get storage path with automatic fallback to local if NAS unavailable
    const { storagePath, isUsingFallback } = getStoragePathWithFallback();
    if (isUsingFallback) {
      console.warn('[NAS] NAS unavailable, using local storage fallback for document upload');
    }

    // Calculate file size in MB
    const fileSizeMB = (req.file.size / (1024 * 1024)).toFixed(2);

    // Move file to student-specific directory
    const studentDir = path.join(storagePath, 'documents', targetStudentId);
    await ensureNASDirectoryExists(studentDir);

    const finalFilename = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(req.file.originalname)}`;
    const finalPath = path.join(studentDir, finalFilename);

    // Move file from temp location to final location
    // Use copy + unlink instead of rename for cross-filesystem compatibility
    try {
      fs.copyFileSync(req.file.path, finalPath);
      fs.unlinkSync(req.file.path);
    } catch (moveError: any) {
      if (NAS_IO_ERRORS.includes(moveError?.code)) invalidateNASCache();
      console.error('Error moving file:', moveError);
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      if (fs.existsSync(finalPath)) {
        fs.unlinkSync(finalPath);
      }
      throw new Error('Failed to save file');
    }

    let document = await prisma.document.create({
      data: {
        studentId: targetStudentId,
        type,
        filename: req.file.originalname,
        filepath: finalPath,
        mimeType: req.file.mimetype,
        uploadedById: req.user!.id,
        status: 'PENDING',
        fileSize: req.file.size
      }
    });

    if (type === 'MOA') {
      const autoApproveEnabled = await prisma.coordinatorSettings.findFirst({
        where: {
          autoApproveDocuments: true,
          requireDocumentReview: false,
        },
      });

      if (autoApproveEnabled) {
        document = await prisma.document.update({
          where: { id: document.id },
          data: { status: 'APPROVED' },
        });
      }
    }

    await auditLog(req.user!.id, 'DOCUMENT_UPLOADED', {
      documentId: document.id,
      type,
      studentId: targetStudentId,
      filename: req.file.originalname,
      fileSize: fileSizeMB + ' MB'
    }, req);

    // Emit real-time event
    if (student.userId) {
      emitDocumentUploaded({
        documentId: document.id,
        studentId: student.userId,
        studentName: student.user?.name || 'Student',
        documentType: type,
        fileName: req.file.originalname,
        createdAt: document.createdAt.toISOString(),
      });
    }

    res.status(201).json({
      document: {
        ...document,
        fileSizeMB: fileSizeMB + ' MB'
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      message: 'Upload failed',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

export const getDocuments = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const { studentId, status, type, page = 1, limit = 20 } = req.query;

    const where: any = {};

    // If user is a student, only show their own documents
    if (req.user.role === 'STUDENT') {
      let student;
      try {
        student = await prisma.student.findUnique({
          where: { userId: req.user.id }
        });
      } catch (dbError: any) {
        console.error('Database error fetching student:', dbError);
        return res.status(500).json({
          message: 'Failed to fetch student record',
          error: process.env.NODE_ENV === 'development' ? (dbError instanceof Error ? dbError.message : String(dbError)) : undefined
        });
      }

      if (student) {
        where.studentId = student.id;
      } else {
        // Return empty array instead of 404 for better UX
        return res.status(200).json({
          documents: [],
          pagination: {
            total: 0,
            page: Number(page),
            limit: Number(limit),
            pages: 0
          }
        });
      }
    } else if (req.user.role === 'INSTRUCTOR') {
      // For instructors, only show documents from their assigned students
      let assignedStudents = [];
      try {
        assignedStudents = await prisma.student.findMany({
          where: { instructorId: req.user.id },
          select: { id: true }
        });
      } catch (dbError: any) {
        console.error('Database error fetching assigned students:', dbError);
        // Return empty array instead of error
        return res.status(200).json({
          documents: [],
          pagination: {
            total: 0,
            page: Number(page),
            limit: Number(limit),
            pages: 0
          }
        });
      }

      if (assignedStudents.length > 0) {
        const assignedStudentIds = assignedStudents.map(s => s.id);
        where.studentId = { in: assignedStudentIds };
      } else {
        // If instructor has no assigned students, return empty array
        return res.status(200).json({
          documents: [],
          pagination: {
            total: 0,
            page: Number(page),
            limit: Number(limit),
            pages: 0
          }
        });
      }
    } else if (studentId) {
      where.studentId = studentId;
    }

    if (status) where.status = status;
    if (type) where.type = type;

    const skip = (Number(page) - 1) * Number(limit);

    let documents = [];
    let total = 0;

    try {
      [documents, total] = await Promise.all([
        prisma.document.findMany({
          where,
          include: {
            student: {
              select: {
                id: true,
                studentNumber: true,
                user: { select: { name: true } },
                company: {
                  select: { name: true }
                }
              }
            },
            uploadedBy: {
              select: { name: true, email: true }
            }
          },
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' }
        }),
        prisma.document.count({ where })
      ]);
    } catch (queryError: any) {
      console.error('Error fetching documents from database:', queryError);
      // Return empty array instead of error
      return res.status(200).json({
        documents: [],
        pagination: {
          total: 0,
          page: Number(page),
          limit: Number(limit),
          pages: 0
        }
      });
    }

    // Format documents with null safety
    const formattedDocuments = documents.map(doc => ({
      id: doc.id || '',
      type: doc.type || '',
      filename: doc.filename || '',
      status: doc.status || 'PENDING',
      uploadedAt: doc.createdAt ? doc.createdAt.toISOString() : null,
      reviewedAt: doc.reviewedAt ? doc.reviewedAt.toISOString() : null,
      remarks: doc.remarks || null,
      fileSize: doc.fileSize || 0,
      filepath: doc.filepath || '',
      mimeType: doc.mimeType || '',
      student: doc.student ? {
        id: doc.student.id || '',
        studentNumber: doc.student.studentNumber || '',
        user: doc.student.user ? { name: doc.student.user.name || '' } : null,
        company: doc.student.company ? { name: doc.student.company.name || '' } : null
      } : null,
      uploadedBy: doc.uploadedBy ? {
        name: doc.uploadedBy.name || '',
        email: doc.uploadedBy.email || ''
      } : null
    }));

    res.json({
      documents: formattedDocuments,
      pagination: {
        total: total || 0,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil((total || 0) / Number(limit))
      }
    });
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({
      message: 'Failed to fetch documents',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    });
  }
};

export const getStudentDocuments = async (req: AuthRequest, res: Response) => {
  try {
    console.log(`[Document] Getting documents for user: ${req.user?.id}, role: ${req.user?.role}`);

    // Check if user is authenticated
    if (!req.user) {
      console.log(`[Document] No authenticated user found`);
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Check if user is a student
    if (req.user.role !== 'STUDENT') {
      console.log(`[Document] User is not a student, role: ${req.user.role}`);
      return res.status(403).json({ message: 'Access denied. Student role required.' });
    }

    // Get current student
    let student;
    try {
      student = await prisma.student.findUnique({
        where: { userId: req.user.id },
        include: {
          user: { select: { name: true } }
        }
      });
    } catch (dbError: any) {
      console.error('Database error fetching student:', dbError);
      return res.status(500).json({
        message: 'Failed to fetch student record',
        error: process.env.NODE_ENV === 'development' ? (dbError instanceof Error ? dbError.message : String(dbError)) : undefined
      });
    }

    console.log(`[Document] Student found:`, student ? 'Yes' : 'No');

    if (!student) {
      console.log(`[Document] Student record not found for user: ${req.user.id}`);
      return res.status(404).json({
        message: 'Student record not found',
        debug: process.env.NODE_ENV === 'development' ? {
          userId: req.user.id,
          userRole: req.user.role,
          userEmail: req.user.email
        } : undefined
      });
    }

    let documents: any[] = [];
    try {
      documents = await prisma.document.findMany({
        where: { studentId: student.id },
        include: {
          uploadedBy: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' }
      });
    } catch (docError: any) {
      console.error('Error fetching documents:', docError);
      // Return empty array instead of error if documents query fails
      documents = [];
    }

    console.log(`[Document] Found ${documents.length} documents for student ${student.id}`);

    // Format documents for client with null safety
    const formattedDocuments = documents.map(doc => ({
      id: doc.id || '',
      type: doc.type || '',
      filename: doc.filename || '',
      status: doc.status || 'PENDING',
      uploadedAt: doc.createdAt ? doc.createdAt.toISOString().split('T')[0] : null,
      reviewedAt: doc.reviewedAt ? doc.reviewedAt.toISOString().split('T')[0] : null,
      remarks: doc.remarks || null,
      fileSize: doc.fileSize || 0,
      sharedStatus: doc.sharedStatus || null,
      parentDocumentId: doc.parentDocumentId || null,
      uploadedBy: doc.uploadedBy ? { name: doc.uploadedBy.name } : undefined,
    }));

    res.json({ documents: formattedDocuments });
  } catch (error) {
    console.error('Get student documents error:', error);
    res.status(500).json({
      message: 'Failed to fetch documents',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    });
  }
};

export const approveDocument = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;

    const existing = await prisma.document.findUnique({
      where: { id },
      include: {
        student: {
          include: {
            user: { select: { id: true, name: true } },
            instructor: { select: { id: true, name: true } },
          },
        },
        uploadedBy: { select: { id: true, name: true } },
      },
    });

    if (!existing) {
      return res.status(404).json({ message: 'Document not found' });
    }

    if (!(await ensureDocumentAccess(req, existing.studentId))) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const priorApproved = await prisma.document.findMany({
      where: { studentId: existing.studentId, status: 'APPROVED' },
      select: { type: true },
    });
    const priorApprovedTypes = new Set(priorApproved.map((d) => d.type));
    const wasPreDeploymentComplete = isAllPreDeploymentSlotsApproved(priorApprovedTypes);

    const document = await prisma.document.update({
      where: { id },
      data: {
        status: 'APPROVED',
        remarks: remarks ?? existing.remarks,
        reviewedAt: new Date(),
      },
    });

    if (remarks) {
      await prisma.documentFeedback.create({
        data: {
          documentId: id,
          authorId: req.user!.id,
          message: remarks,
          type: DocumentFeedbackType.APPROVAL_NOTE,
          requiresAction: false,
        },
      });
    }

    await auditLog(req.user!.id, 'DOCUMENT_APPROVED', {
      documentId: id,
      remarks,
    }, req);

    // Emit real-time event
    const studentUserId = existing.student.user?.id;
    if (studentUserId) {
      emitDocumentStatusChanged({
        documentId: id,
        studentId: studentUserId,
        status: 'APPROVED',
        reviewedBy: req.user?.name,
        reviewedAt: new Date().toISOString(),
        comments: remarks,
      });
    }

    const recipients = new Set<string>();
    if (studentUserId && studentUserId !== req.user!.id) {
      recipients.add(studentUserId);
    }
    if (existing.uploadedBy?.id && existing.uploadedBy.id !== req.user!.id) {
      recipients.add(existing.uploadedBy.id);
    }

    if (recipients.size > 0) {
      await dispatchNotification(recipients, {
        title: 'Document Approved',
        message: `Your ${existing.type.toLowerCase().replace(/_/g, ' ')} has been approved.`,
        link: `/documents/${id}`,
        type: NotificationType.DOCUMENT,
      });
    }

    if (req.user?.role === 'INSTRUCTOR') {
      const coordinators = await prisma.user.findMany({
        where: { role: 'COORDINATOR', active: true },
        select: { id: true },
      });

      const coordinatorRecipients = new Set<string>();
      coordinators.forEach(({ id: coordinatorId }) => {
        if (coordinatorId && coordinatorId !== req.user!.id) {
          coordinatorRecipients.add(coordinatorId);
        }
      });

      if (coordinatorRecipients.size > 0) {
        await dispatchNotification(coordinatorRecipients, {
          title: 'Document Approved',
          message: `${existing.student.user?.name ?? 'A student'}'s ${existing.type
            .toLowerCase()
            .replace(/_/g, ' ')} was approved by ${req.user?.name ?? 'an instructor'}.`,
          link: `/documents/${id}`,
          type: NotificationType.DOCUMENT,
        });
      }
    }

    const postApproved = await prisma.document.findMany({
      where: { studentId: existing.studentId, status: 'APPROVED' },
      select: { type: true },
    });
    const postApprovedTypes = new Set(postApproved.map((d) => d.type));
    const nowPreDeploymentComplete = isAllPreDeploymentSlotsApproved(postApprovedTypes);

    if (
      studentUserId &&
      !wasPreDeploymentComplete &&
      nowPreDeploymentComplete
    ) {
      await dispatchNotification(new Set([studentUserId]), {
        title: "You're all set for deployment",
        message:
          'All required pre-deployment documents have been approved. Good luck with your internship.',
        link: '/student/documents',
        type: NotificationType.DOCUMENT,
      });
    }

    res.json({ document });
  } catch (error) {
    console.error('Approve document error:', error);
    res.status(500).json({ message: 'Approval failed', error });
  }
};

export const rejectDocument = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;

    const existing = await prisma.document.findUnique({
      where: { id },
      include: {
        student: {
          include: {
            user: { select: { id: true, name: true } },
            instructor: { select: { id: true } },
          },
        },
        uploadedBy: { select: { id: true } },
      },
    });

    if (!existing) {
      return res.status(404).json({ message: 'Document not found' });
    }

    if (!(await ensureDocumentAccess(req, existing.studentId))) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const rejectionMessage = remarks || 'Document rejected';

    const document = await prisma.document.update({
      where: { id },
      data: {
        status: 'REJECTED',
        remarks: rejectionMessage,
        reviewedAt: new Date(),
      },
    });

    await prisma.documentFeedback.create({
      data: {
        documentId: id,
        authorId: req.user!.id,
        message: rejectionMessage,
        type: DocumentFeedbackType.REQUEST_CHANGES,
        requiresAction: true,
      },
    });

    await auditLog(req.user!.id, 'DOCUMENT_REJECTED', {
      documentId: id,
      remarks: rejectionMessage,
    }, req);

    // Emit real-time event
    const studentUserId = existing.student.user?.id;
    if (studentUserId) {
      emitDocumentStatusChanged({
        documentId: id,
        studentId: studentUserId,
        status: 'REJECTED',
        reviewedBy: req.user?.name,
        reviewedAt: new Date().toISOString(),
        comments: rejectionMessage,
      });
    }

    const recipients = new Set<string>();
    if (studentUserId && studentUserId !== req.user!.id) {
      recipients.add(studentUserId);
    }
    if (existing.uploadedBy?.id && existing.uploadedBy.id !== req.user!.id) {
      recipients.add(existing.uploadedBy.id);
    }

    if (recipients.size > 0) {
      await dispatchNotification(recipients, {
        title: 'Document Rejected',
        message: `Updates are required for your ${existing.type.toLowerCase().replace(/_/g, ' ')}.`,
        link: `/documents/${id}`,
        type: NotificationType.DOCUMENT,
      });
    }

    res.json({ document });
  } catch (error) {
    console.error('Reject document error:', error);
    res.status(500).json({ message: 'Rejection failed', error });
  }
};

export const getDocumentFeedback = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const document = await prisma.document.findUnique({
      where: { id },
      select: {
        id: true,
        studentId: true,
      },
    });

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    if (!(await ensureDocumentAccess(req, document.studentId))) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const feedback = await prisma.documentFeedback.findMany({
      where: { documentId: id },
      include: {
        author: {
          select: { id: true, name: true, role: true, profilePhoto: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json({ feedback });
  } catch (error) {
    console.error('Get document feedback error:', error);
    res.status(500).json({ message: 'Failed to fetch document feedback' });
  }
};

const resolveFeedbackType = (value?: string): DocumentFeedbackType => {
  if (!value) {
    return DocumentFeedbackType.COMMENT;
  }
  const normalized = value.toUpperCase();
  return (Object.values(DocumentFeedbackType) as string[]).includes(normalized)
    ? (normalized as DocumentFeedbackType)
    : DocumentFeedbackType.COMMENT;
};

export const addDocumentFeedback = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { message, type, requiresAction } = req.body as {
      message?: string;
      type?: string;
      requiresAction?: boolean;
    };

    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Feedback message is required' });
    }

    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        student: {
          include: {
            user: { select: { id: true } },
            instructor: { select: { id: true } },
          },
        },
        uploadedBy: { select: { id: true } },
      },
    });

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    if (!(await ensureDocumentAccess(req, document.studentId))) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const feedbackType = resolveFeedbackType(type);

    const feedback = await prisma.documentFeedback.create({
      data: {
        documentId: id,
        authorId: req.user!.id,
        message: message.trim(),
        type: feedbackType,
        requiresAction:
          typeof requiresAction === 'boolean'
            ? requiresAction
            : feedbackType === DocumentFeedbackType.REQUEST_CHANGES,
      },
      include: {
        author: { select: { id: true, name: true, role: true, profilePhoto: true } },
      },
    });

    if (feedback.requiresAction) {
      await prisma.document.update({
        where: { id },
        data: {
          status: 'RESUBMISSION_REQUESTED',
          remarks: message.trim(),
        },
      });
    }

    const recipients = new Set<string>();
    const studentUserId = document.student.user?.id;
    if (studentUserId && studentUserId !== req.user!.id) {
      recipients.add(studentUserId);
    }
    if (document.uploadedBy?.id && document.uploadedBy.id !== req.user!.id) {
      recipients.add(document.uploadedBy.id);
    }
    if (document.student.instructor?.id && document.student.instructor.id !== req.user!.id) {
      recipients.add(document.student.instructor.id);
    }

    if (recipients.size > 0) {
      const isRequestChanges = feedback.type === DocumentFeedbackType.REQUEST_CHANGES;
      await dispatchNotification(recipients, {
        title: isRequestChanges ? 'Document Needs Updates' : 'New Document Feedback',
        message: isRequestChanges
          ? `Changes were requested for ${document.type.toLowerCase().replace(/_/g, ' ')}.`
          : `A new comment was added to ${document.type.toLowerCase().replace(/_/g, ' ')}.`,
        link: `/documents/${id}`,
        type: NotificationType.DOCUMENT,
      });
    }

    res.status(201).json({ feedback });
  } catch (error) {
    console.error('Add document feedback error:', error);
    res.status(500).json({ message: 'Failed to add document feedback' });
  }
};

export const downloadDocument = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const document = await prisma.document.findUnique({
      where: { id }
    });

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Check permissions
    if (req.user!.role === 'STUDENT') {
      const student = await prisma.student.findUnique({
        where: { userId: req.user!.id }
      });
      if (student?.id !== document.studentId) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    // Block download for documents still awaiting PDF generation
    if (document.filepath === 'PENDING_PDF_GENERATION') {
      return res.status(400).json({
        message: 'This document is still waiting for all students to accept. The PDF has not been generated yet.',
      });
    }

    // Resolve filepath - checks both NAS and local storage
    const filepath = resolveFilePath(document.filepath);

    if (!filepath || !fs.existsSync(filepath)) {
      console.error('Document file not found. Document ID:', id);
      console.error('Stored filepath:', document.filepath);
      console.error('Resolved filepath:', filepath);
      return res.status(404).json({
        message: FILE_UNAVAILABLE_TRY_AGAIN_MESSAGE,
        code: 'FILE_NOT_AVAILABLE',
        details: process.env.NODE_ENV === 'development' ? {
          storedPath: document.filepath,
          resolvedPath: filepath
        } : undefined
      });
    }

    res.download(filepath, document.filename);
  } catch (error) {
    res.status(500).json({ message: 'Download failed', error });
  }
};

export const getDocumentById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        student: {
          include: {
            user: { select: { name: true } }
          }
        },
        uploadedBy: {
          select: { name: true, email: true, role: true }
        }
      }
    });

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    res.json({ document });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch document', error });
  }
};

export const deleteDocument = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const document = await prisma.document.findUnique({
      where: { id }
    });

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Check permissions
    if (req.user!.role === 'STUDENT') {
      const student = await prisma.student.findUnique({
        where: { userId: req.user!.id }
      });
      if (student?.id !== document.studentId) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    // If this is a parent document (submitter's record), cascade-delete all child records too
    const childDocs = await prisma.document.findMany({
      where: { parentDocumentId: id },
    });
    if (childDocs.length > 0) {
      await prisma.document.deleteMany({ where: { parentDocumentId: id } });
    }

    // Only delete the physical file if no other document records share the same filepath
    // (multi-student endorsement letters share a single PDF across multiple students)
    // Don't try to delete placeholder filepath
    const realFilepath = document.filepath !== 'PENDING_PDF_GENERATION' ? document.filepath : null;
    const otherRefsCount = realFilepath ? await prisma.document.count({
      where: { filepath: realFilepath, id: { not: id } }
    }) : 0;

    await prisma.document.delete({ where: { id } });

    if (realFilepath && otherRefsCount === 0) {
      const resolved = resolveFilePath(realFilepath);
      if (resolved) {
        try { await fs.promises.unlink(resolved); } catch {}
      }
    }

    res.json({ message: 'Document deleted successfully' });
  } catch (error: any) {
    if (NAS_IO_ERRORS.includes(error?.code)) invalidateNASCache();
    res.status(500).json({ message: 'Failed to delete document', error });
  }
};

/**
 * POST /documents/:id/accept-shared
 * Student accepts a shared endorsement letter.
 * After acceptance, checks if ALL students have accepted.
 * If so, generates the PDF and updates all linked document records.
 */
export const acceptSharedDocument = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const document = await prisma.document.findUnique({ where: { id } });
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Verify this student owns this document
    const student = await prisma.student.findUnique({
      where: { userId: req.user!.id },
      include: { user: { select: { name: true } } },
    });
    if (!student || student.id !== document.studentId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (document.sharedStatus !== 'PENDING_ACCEPTANCE') {
      return res.status(400).json({ message: 'This document is not pending acceptance' });
    }

    // Mark this student's document as accepted
    await prisma.document.update({
      where: { id },
      data: { sharedStatus: 'ACCEPTED' },
    });

    // Check if ALL students in this group have now accepted
    const parentDocId = document.parentDocumentId;
    if (parentDocId) {
      const allChildren = await prisma.document.findMany({
        where: { parentDocumentId: parentDocId },
      });

      const allAccepted = allChildren.every(c =>
        c.id === id ? true : c.sharedStatus === 'ACCEPTED'
      );

      if (allAccepted) {
        // All students accepted - time to generate the PDF!
        console.log(`[Document] All ${allChildren.length} student(s) accepted. Generating PDF...`);

        // Get the parent (submitter's) document with saved form data
        const parentDoc = await prisma.document.findUnique({
          where: { id: parentDocId },
          include: {
            student: { include: { user: { select: { id: true, name: true } } } },
          },
        });

        if (!parentDoc || !parentDoc.formData) {
          console.error('Parent document or formData not found for PDF generation');
          return res.json({ message: 'Endorsement letter accepted successfully', allAccepted: true, pdfGenerated: false });
        }

        // Rebuild the student list from the actual accepted students
        const acceptedChildren = await prisma.document.findMany({
          where: { parentDocumentId: parentDocId, sharedStatus: 'ACCEPTED' },
          include: { student: { include: { user: { select: { name: true } } } } },
        });

        const submitterName = parentDoc.student.user.name || 'Unknown';
        const allNames = [submitterName, ...acceptedChildren.map(c => c.student.user.name || 'Unknown')];

        // Rebuild template data from saved form data
        let templateData = { ...(parentDoc.formData as Record<string, any>) };
        templateData.selected_students = JSON.stringify(allNames);
        templateData.student_list_html = buildStudentListHtml(JSON.stringify(allNames));

        // Format date fields
        templateData = formatDateFieldsForDisplay(parentDoc.type, templateData);

        // Get form definition
        const definition = formDefinitions[parentDoc.type];
        if (!definition) {
          console.error('Form definition not found for', parentDoc.type);
          return res.json({ message: 'Endorsement letter accepted successfully', allAccepted: true, pdfGenerated: false });
        }

        // Generate the PDF
        const { filepath, filename, buffer } = await generatePdf(
          definition.templateFile,
          templateData,
          parentDoc.type,
          parentDoc.studentId
        );

        // Update ALL document records (parent + children) with the real PDF filepath
        await prisma.document.update({
          where: { id: parentDocId },
          data: {
            filepath,
            fileSize: buffer.length,
            sharedStatus: null, // No longer waiting
          },
        });

        await prisma.document.updateMany({
          where: { parentDocumentId: parentDocId },
          data: {
            filepath,
            fileSize: buffer.length,
            sharedStatus: null, // No longer pending
          },
        });

        // Notify the submitter that all students accepted and the PDF is ready
        await notificationService.createNotification({
          userId: parentDoc.student.user.id,
          title: 'Endorsement Letter - PDF Generated!',
          message: `All students have accepted your multi-student endorsement letter. The PDF has been generated and submitted for review.`,
          type: 'DOCUMENT',
          link: '/documents',
        });

        // Emit real-time events for all students
        emitDocumentUploaded({
          documentId: parentDocId,
          studentId: parentDoc.student.user.id,
          studentName: submitterName,
          documentType: 'ENDORSEMENT_LETTER_MULTI',
          fileName: filename,
          createdAt: new Date().toISOString(),
        });

        console.log(`[Document] PDF generated and all ${allChildren.length + 1} document records updated.`);

        return res.json({ message: 'Endorsement letter accepted! All students have accepted - PDF generated.', allAccepted: true, pdfGenerated: true });
      }
    }

    res.json({ message: 'Endorsement letter accepted successfully', allAccepted: false });
  } catch (error) {
    console.error('Error accepting shared document:', error);
    res.status(500).json({ message: 'Failed to accept document' });
  }
};

/**
 * POST /documents/:id/decline-shared
 * Student declines a shared endorsement letter - removes the document record.
 * Notifies the submitter about the decline. Then checks if remaining students
 * have all accepted (if so, generates the PDF without the declined student).
 */
export const declineSharedDocument = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const document = await prisma.document.findUnique({
      where: { id },
      include: { student: { include: { user: { select: { name: true } } } } },
    });
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Verify this student owns this document
    const student = await prisma.student.findUnique({ where: { userId: req.user!.id } });
    if (!student || student.id !== document.studentId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (document.sharedStatus !== 'PENDING_ACCEPTANCE') {
      return res.status(400).json({ message: 'This document is not pending acceptance' });
    }

    const parentDocId = document.parentDocumentId;
    const declinedStudentName = document.student.user.name || 'A student';

    // Delete this child document record
    await prisma.document.delete({ where: { id } });

    // Notify the submitter about the decline
    if (parentDocId) {
      const parentDoc = await prisma.document.findUnique({
        where: { id: parentDocId },
        include: { student: { include: { user: { select: { id: true, name: true } } } } },
      });

      if (parentDoc) {
        await notificationService.createNotification({
          userId: parentDoc.student.user.id,
          title: 'Endorsement Letter - Student Declined',
          message: `${declinedStudentName} has declined the multi-student endorsement letter. They will not be included in the final document.`,
          type: 'DOCUMENT',
          link: '/documents',
        });

        // Check if remaining children have ALL accepted
        const remainingChildren = await prisma.document.findMany({
          where: { parentDocumentId: parentDocId },
        });

        if (remainingChildren.length === 0) {
          // No more children - cancel the whole endorsement letter
          // Delete the parent doc since there are no other students
          await prisma.document.delete({ where: { id: parentDocId } });
          console.log('[Document] All students declined. Parent endorsement letter deleted.');
        } else {
          const allAccepted = remainingChildren.every(c => c.sharedStatus === 'ACCEPTED');
          if (allAccepted) {
            // All remaining students accepted - generate PDF without declined student
            console.log(`[Document] Remaining ${remainingChildren.length} student(s) have all accepted after decline. Generating PDF...`);

            const acceptedChildren = await prisma.document.findMany({
              where: { parentDocumentId: parentDocId, sharedStatus: 'ACCEPTED' },
              include: { student: { include: { user: { select: { name: true } } } } },
            });

            const submitterName = parentDoc.student.user.name || 'Unknown';
            const allNames = [submitterName, ...acceptedChildren.map(c => c.student.user.name || 'Unknown')];

            let templateData = { ...(parentDoc.formData as Record<string, any>) };
            templateData.selected_students = JSON.stringify(allNames);
            templateData.student_list_html = buildStudentListHtml(JSON.stringify(allNames));
            templateData = formatDateFieldsForDisplay(parentDoc.type, templateData);

            const definition = formDefinitions[parentDoc.type];
            if (definition) {
              const { filepath, filename, buffer } = await generatePdf(
                definition.templateFile,
                templateData,
                parentDoc.type,
                parentDoc.studentId
              );

              // Update all records with the real PDF
              await prisma.document.update({
                where: { id: parentDocId },
                data: { filepath, fileSize: buffer.length, sharedStatus: null },
              });

              await prisma.document.updateMany({
                where: { parentDocumentId: parentDocId },
                data: { filepath, fileSize: buffer.length, sharedStatus: null },
              });

              await notificationService.createNotification({
                userId: parentDoc.student.user.id,
                title: 'Endorsement Letter - PDF Generated!',
                message: `All remaining students have accepted. The PDF has been generated and submitted for review (without ${declinedStudentName}).`,
                type: 'DOCUMENT',
                link: '/documents',
              });

              console.log(`[Document] PDF generated after decline - ${allNames.length} students included.`);
            }
          }
        }
      }
    }

    res.json({ message: 'Endorsement letter declined' });
  } catch (error) {
    console.error('Error declining shared document:', error);
    res.status(500).json({ message: 'Failed to decline document' });
  }
};

// ========== MULTI-STUDENT ENDORSEMENT LETTER HELPERS ==========

/**
 * Build the HTML for a numbered student list (vertical two-column layout) from a JSON array of student names.
 * Items 1-5 go in the left column, 6-10 in the right column (top-to-bottom, then next column).
 * Used by ENDORSEMENT_LETTER_MULTI template.
 */
const buildStudentListHtml = (selectedStudentsJson: string): string => {
  let names: string[] = [];
  try {
    names = JSON.parse(selectedStudentsJson);
    if (!Array.isArray(names)) names = [];
  } catch {
    // If it's not JSON, treat it as a comma-separated list
    names = selectedStudentsJson.split(',').map(n => n.trim()).filter(Boolean);
  }

  if (names.length === 0) {
    return '<p style="font-style: italic; color: #999;">No students selected</p>';
  }

  const ROWS_PER_COL = 5; // 1-5 left column, 6-10 right column
  const leftCol = names.slice(0, ROWS_PER_COL);
  const rightCol = names.slice(ROWS_PER_COL, ROWS_PER_COL * 2);

  let html = '<div class="student-list-container"><div class="student-list-grid">';

  // Left column (items 1-5)
  html += '<div class="student-col">';
  leftCol.forEach((name, i) => {
    html += `<div class="student-item"><span class="student-num">${i + 1}.</span><span class="student-name">${name}</span></div>`;
  });
  html += '</div>';

  // Right column (items 6-10) - only render if there are more than 5
  if (rightCol.length > 0) {
    html += '<div class="student-col">';
    rightCol.forEach((name, i) => {
      html += `<div class="student-item"><span class="student-num">${ROWS_PER_COL + i + 1}.</span><span class="student-name">${name}</span></div>`;
    });
    html += '</div>';
  }

  html += '</div></div>';
  return html;
};

// ========== FORM-BASED DOCUMENT GENERATION ==========

/**
 * GET /documents/student-picker
 * Returns a lightweight list of all students for the multi-student endorsement letter picker.
 * Query: ?search=... (optional search term)
 */
export const getStudentPickerList = async (req: AuthRequest, res: Response) => {
  try {
    const { search } = req.query;

    const where: any = {};

    // Exclude the current logged-in student so they can't add themselves twice
    if (req.user?.id) {
      where.NOT = { userId: req.user.id };
    }

    if (search && typeof search === 'string' && search.trim()) {
      where.OR = [
        { studentNumber: { contains: search.trim() } },
        { user: { name: { contains: search.trim(), mode: 'insensitive' } } },
      ];
    }

    const students = await prisma.student.findMany({
      where,
      select: {
        id: true,
        studentNumber: true,
        program: true,
        year: true,
        section: true,
        user: { select: { name: true } },
        company: { select: { name: true } },
      },
      orderBy: { user: { name: 'asc' } },
      take: 50,
    });

    res.json({
      students: students.map((s) => ({
        id: s.id,
        name: s.user?.name || 'Unknown',
        studentNumber: s.studentNumber,
        program: s.program,
        year: s.year,
        section: s.section,
        company: s.company?.name || null,
      })),
    });
  } catch (error) {
    console.error('Error fetching student picker list:', error);
    res.status(500).json({ message: 'Failed to fetch students' });
  }
};

/**
 * GET /documents/form-definition/:type
 * Returns form field definitions and auto-filled values for a document type.
 */
export const getFormDefinition = async (req: AuthRequest, res: Response) => {
  try {
    const { type } = req.params;

    if (!hasFormTemplate(type)) {
      return res.status(404).json({ message: 'No form template available for this document type' });
    }

    const definition = formDefinitions[type];
    if (!definition) {
      return res.status(404).json({ message: 'Form definition not found' });
    }

    // Get student data for auto-fill
    const student = await prisma.student.findUnique({
      where: { userId: req.user!.id },
      include: {
        user: { select: { name: true, email: true } },
        company: { select: { name: true, address: true } },
        instructor: { select: { name: true } },
      },
    });

    if (!student) {
      return res.status(404).json({ message: 'Student record not found' });
    }

    // Parse name into parts
    const nameParts = (student.user.name || '').split(' ');
    const surname = nameParts.length > 1 ? nameParts[nameParts.length - 1] : nameParts[0] || '';
    const givenName = nameParts.length > 1 ? nameParts[0] : '';
    const middleName = nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : '';

    // Build auto-fill values
    const autoFillValues: Record<string, string> = {
      student_name: student.user.name || '',
      surname,
      given_name: givenName,
      middle_name: middleName,
      campus: 'Urdaneta City',
      course: student.program || '',
      total_hours: String(student.totalHours || 240),
      company_name: student.company?.name || '',
      company_address: student.company?.address || '',
      email: student.user.email || '',
      student_number: student.studentNumber || '',
      year_level: String(student.year || ''),
      section: student.section || '',
      year_section: `${student.year || ''}-${student.section || ''}`,
      supervisor_name: student.supervisorName || '',
      date: new Date().toISOString().split('T')[0],
      start_date: student.startDate ? new Date(student.startDate).toISOString().split('T')[0] : '',
      end_date: student.endDate ? new Date(student.endDate).toISOString().split('T')[0] : '',
      start_month: student.startDate ? new Date(student.startDate).toLocaleDateString('en-US', { month: 'long' }) : '',
      start_year: student.startDate ? new Date(student.startDate).getFullYear().toString() : '',
      end_month: student.endDate ? new Date(student.endDate).toLocaleDateString('en-US', { month: 'long' }) : '',
      end_year: student.endDate ? new Date(student.endDate).getFullYear().toString() : '',
      instructor_name: student.instructor?.name || '',
    };

    // Auto-fill coordinator name (find active coordinator)
    const coordinator = await prisma.user.findFirst({
      where: { role: 'COORDINATOR', active: true },
      select: { name: true },
    });
    if (coordinator) {
      autoFillValues.coordinator_name = coordinator.name || '';
    }

    // Try to find parent/guardian info from APPLICATION_INTERNSHIP form
    const internshipApp = await prisma.document.findFirst({
      where: {
        studentId: student.id,
        type: 'APPLICATION_INTERNSHIP',
      },
      orderBy: { createdAt: 'desc' },
    });

    if (internshipApp && internshipApp.formData) {
      const formData = internshipApp.formData as any;
      autoFillValues.parent_guardian = formData.parent_guardian || '';
      autoFillValues.parent_contact = formData.parent_contact || '';
      autoFillValues.parent_address = formData.parent_address || '';
      autoFillValues.home_address = formData.home_address || '';
      autoFillValues.company_contact = formData.company_contact || '';
      autoFillValues.company_head = formData.company_head || '';
      autoFillValues.company_head_title = formData.company_head_title || '';
      autoFillValues.campus_exec_director = formData.campus_exec_director || '';
    }

    // Special logic for RECORD_FILE: Auto-fill checklist statuses
    if (type === 'RECORD_FILE') {
      const statuses = await computeRecordFileStatuses(student.id);
      Object.assign(autoFillValues, statuses);
    }

    res.json({
      definition,
      autoFillValues,
    });
  } catch (error) {
    console.error('Error getting form definition:', error);
    res.status(500).json({ message: 'Failed to get form definition' });
  }
};

/**
 * Convert YYYY-MM-DD date values to display format (e.g., "11 February 2026") for PDF templates.
 * Only converts fields defined as type 'date' in the form definition.
 */
const formatDateFieldsForDisplay = (type: string, data: Record<string, string>): Record<string, string> => {
  const definition = formDefinitions[type];
  if (!definition) return data;

  const formatted = { ...data };
  for (const field of definition.fields) {
    if (field.type === 'date' && formatted[field.name]) {
      const d = new Date(formatted[field.name] + 'T00:00:00');
      if (!isNaN(d.getTime())) {
        formatted[field.name] = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

        // For signed_date, also split into signed_day, signed_month, signed_year for templates
        if (field.name === 'signed_date') {
          formatted['signed_day'] = d.toLocaleDateString('en-GB', { day: 'numeric' });
          formatted['signed_month'] = d.toLocaleDateString('en-GB', { month: 'long' });
          formatted['signed_year'] = d.getFullYear().toString().slice(-2); // last 2 digits for "20__" format
        }
      }
    }
  }
  return formatted;
};

/**
 * Build rows for APPLICATION_INTERNSHIP academic table from repeatable form fields.
 * Expected keys: acad_sem_{i}, acad_sy_{i}, acad_subject_{i}
 */
const buildApplicationInternshipAcademicRows = (formData: Record<string, string>): { html: string; count: number } => {
  const rows: Array<{ sem: string; sy: string; subject: string }> = [];
  for (let i = 1; i <= 15; i++) {
    const sem = (formData[`acad_sem_${i}`] || '').trim();
    const sy = (formData[`acad_sy_${i}`] || '').trim();
    const subject = (formData[`acad_subject_${i}`] || '').trim();

    // Skip fully empty rows; keep partially-filled rows so user sees what was entered.
    if (!sem && !sy && !subject) continue;
    rows.push({ sem, sy, subject });
  }

  if (rows.length === 0) {
    return {
      html: '<tr><td>&nbsp;</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>',
      count: 0,
    };
  }

  const escapeHtml = (value: string) =>
    value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  return {
    html: rows
      .map(
        (row) =>
          `<tr><td>${escapeHtml(row.sem)}</td><td>${escapeHtml(row.sy)}</td><td>${escapeHtml(row.subject)}</td><td></td><td></td><td></td><td></td><td></td></tr>`,
      )
      .join(''),
    count: rows.length,
  };
};

/**
 * For STUDENT_FEEDBACK forms, expand criteria_N (value 1-5) into individual
 * cell variables c{N}_{rating} with checkmarks for the selected rating.
 */
const expandLikertScaleData = (formData: Record<string, string>): Record<string, string> => {
  const expanded: Record<string, string> = { ...formData };
  for (let c = 1; c <= 7; c++) {
    const selectedValue = formData[`criteria_${c}`] || '';
    for (let r = 1; r <= 5; r++) {
      expanded[`c${c}_${r}`] = selectedValue === String(r) ? '✓' : '';
    }
  }
  return expanded;
};

/**
 * POST /documents/preview
 * Returns rendered HTML string for preview.
 * Body: { type, formData }
 */
export const previewDocument = async (req: AuthRequest, res: Response) => {
  try {
    const { type, formData } = req.body;

    if (!type || !formData) {
      return res.status(400).json({ message: 'Type and formData are required' });
    }

    if (!hasFormTemplate(type)) {
      return res.status(404).json({ message: 'No form template for this document type' });
    }

    const definition = formDefinitions[type];
    if (!definition) {
      return res.status(404).json({ message: 'Form definition not found' });
    }

    // For RECORD_FILE, inject checklist statuses into the template data
    let templateData = { ...formData };
    if (type === 'RECORD_FILE') {
      const student = await prisma.student.findUnique({
        where: { userId: req.user!.id },
        select: { id: true },
      });
      if (student) {
        const statuses = await computeRecordFileStatuses(student.id);
        templateData = { ...templateData, ...statuses };
      }
    }

    // For STUDENT_FEEDBACK, expand Likert scale criteria into checkmark variables
    if (type === 'STUDENT_FEEDBACK') {
      templateData = expandLikertScaleData(templateData);
    }

    if (type === 'APPLICATION_INTERNSHIP') {
      const academicRows = buildApplicationInternshipAcademicRows(templateData);
      templateData.academic_rows_html = academicRows.html;
    }

    // For ENDORSEMENT_LETTER_MULTI, build the student list HTML
    if (type === 'ENDORSEMENT_LETTER_MULTI' && templateData.selected_students) {
      templateData.student_list_html = buildStudentListHtml(templateData.selected_students);
    }

    // Format date fields (YYYY-MM-DD to display format) for the template
    templateData = formatDateFieldsForDisplay(type, templateData);

    const html = generatePreviewHtml(definition.templateFile, templateData);

    res.json({ html });
  } catch (error) {
    console.error('Error generating preview:', error);
    res.status(500).json({ message: 'Failed to generate preview' });
  }
};

/**
 * POST /documents/finalize
 * Generates PDF from form data and creates Document record.
 * Body: { type, formData }
 */
export const finalizeDocument = async (req: AuthRequest, res: Response) => {
  try {
    const { type, formData } = req.body;

    if (!type || !formData) {
      return res.status(400).json({ message: 'Type and formData are required' });
    }

    if (!hasFormTemplate(type)) {
      return res.status(404).json({ message: 'No form template for this document type' });
    }

    const definition = formDefinitions[type];
    if (!definition) {
      return res.status(404).json({ message: 'Form definition not found' });
    }

    // Get student
    const student = await prisma.student.findUnique({
      where: { userId: req.user!.id },
      include: {
        user: { select: { name: true } },
      },
    });

    if (!student) {
      return res.status(404).json({ message: 'Student record not found' });
    }

    // For RECORD_FILE, inject checklist statuses into the template data
    let templateData = { ...formData };
    if (type === 'RECORD_FILE') {
      const statuses = await computeRecordFileStatuses(student.id);
      templateData = { ...templateData, ...statuses };
    }

    // For STUDENT_FEEDBACK, expand Likert scale criteria into checkmark variables
    if (type === 'STUDENT_FEEDBACK') {
      templateData = expandLikertScaleData(templateData);
    }

    if (type === 'APPLICATION_INTERNSHIP') {
      const academicRows = buildApplicationInternshipAcademicRows(templateData);
      templateData.academic_rows_html = academicRows.html;
    }

    // ====== ENDORSEMENT_LETTER_MULTI: Deferred PDF generation ======
    // For multi-student endorsement letters, we do NOT generate the PDF now.
    // Instead, we save the form data and wait for ALL included students to accept.
    // The PDF is generated only after every student has accepted.
    if (type === 'ENDORSEMENT_LETTER_MULTI') {
      // Save the raw form data (before student_list_html injection) for later PDF generation
      const savedFormData = { ...templateData };

      const document = await prisma.document.create({
        data: {
          studentId: student.id,
          type,
          filename: `${definition.title.replace(/\s+/g, '_')}_Multi.pdf`,
          filepath: 'PENDING_PDF_GENERATION', // No PDF yet
          mimeType: 'application/pdf',
          uploadedById: req.user!.id,
          status: 'PENDING',
          fileSize: 0,
          sharedStatus: 'WAITING_FOR_ACCEPTANCE',
          formData: savedFormData, // Store form data for later PDF generation
        },
      });

      await auditLog(req.user!.id, 'DOCUMENT_UPLOADED', {
        documentId: document.id,
        type,
        studentId: student.id,
        method: 'form_generated_deferred',
      }, req);

      // Create records for other included students
      if (templateData.selected_student_ids) {
        try {
          let otherStudentIds: string[] = [];
          try {
            otherStudentIds = JSON.parse(templateData.selected_student_ids);
            if (!Array.isArray(otherStudentIds)) otherStudentIds = [];
          } catch { otherStudentIds = []; }

          otherStudentIds = otherStudentIds.filter((id: string) => id !== student.id);

          if (otherStudentIds.length > 0) {
            const otherStudents = await prisma.student.findMany({
              where: { id: { in: otherStudentIds } },
              include: { user: { select: { id: true, name: true } } },
            });

            for (const otherStudent of otherStudents) {
              const sharedDoc = await prisma.document.create({
                data: {
                  studentId: otherStudent.id,
                  type: 'ENDORSEMENT_LETTER_MULTI',
                  filename: `${definition.title.replace(/\s+/g, '_')}_${otherStudent.user.name?.replace(/\s+/g, '_')}.pdf`,
                  filepath: 'PENDING_PDF_GENERATION', // No PDF yet
                  mimeType: 'application/pdf',
                  uploadedById: req.user!.id,
                  status: 'PENDING',
                  fileSize: 0,
                  sharedStatus: 'PENDING_ACCEPTANCE',
                  parentDocumentId: document.id, // Link to the submitter's document
                },
              });

              // Notify the included student
              await notificationService.createNotification({
                userId: otherStudent.user.id,
                title: 'Endorsement Letter - Action Required',
                message: `${student.user.name} has included you in a multi-student endorsement letter. Please review and accept or decline it in your Documents tab.`,
                type: 'DOCUMENT',
                link: '/documents',
              });

              // Emit real-time event
              emitDocumentUploaded({
                documentId: sharedDoc.id,
                studentId: otherStudent.user.id,
                studentName: otherStudent.user?.name || 'Student',
                documentType: 'ENDORSEMENT_LETTER_MULTI',
                fileName: document.filename,
                createdAt: sharedDoc.createdAt.toISOString(),
              });
            }

            console.log(`[Document] Created pending endorsement letter records for ${otherStudents.length} student(s). Waiting for acceptance.`);
          }
        } catch (err) {
          console.error('Warning: Failed to create shared endorsement letter records:', err);
        }
      }

      return res.status(201).json({
        document: {
          ...document,
          fileSizeMB: '0 MB',
          waitingForAcceptance: true,
        },
      });
    }

    // ====== Normal document flow (non-multi-endorsement) ======

    // For ENDORSEMENT_LETTER_MULTI is handled above; this handles all other types
    // For regular types, build student list HTML if needed (shouldn't happen but safety)
    if (templateData.selected_students) {
      templateData.student_list_html = buildStudentListHtml(templateData.selected_students);
    }

    // Format date fields (YYYY-MM-DD to display format) for the template
    templateData = formatDateFieldsForDisplay(type, templateData);

    // Generate PDF
    const { filepath, filename, buffer } = await generatePdf(
      definition.templateFile,
      templateData,
      type,
      student.id
    );

    // Create Document record for the submitting student
    const document = await prisma.document.create({
      data: {
        studentId: student.id,
        type,
        filename: `${definition.title.replace(/\s+/g, '_')}_${student.user.name?.replace(/\s+/g, '_')}.pdf`,
        filepath,
        mimeType: 'application/pdf',
        uploadedById: req.user!.id,
        status: 'PENDING',
        fileSize: buffer.length,
      },
    });

    await auditLog(req.user!.id, 'DOCUMENT_UPLOADED', {
      documentId: document.id,
      type,
      studentId: student.id,
      filename,
      method: 'form_generated',
    }, req);

    // Emit real-time event
    emitDocumentUploaded({
      documentId: document.id,
      studentId: student.userId,
      studentName: student.user?.name || 'Student',
      documentType: type,
      fileName: filename,
      createdAt: document.createdAt.toISOString(),
    });

    res.status(201).json({
      document: {
        ...document,
        fileSizeMB: (buffer.length / (1024 * 1024)).toFixed(2) + ' MB',
      },
    });
  } catch (error) {
    console.error('Error finalizing document:', error);
    res.status(500).json({
      message: 'Failed to generate document',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

/**
 * Document types that can be auto-generated from existing system data.
 */
const AUTO_GENERATE_TYPES = ['TIME_FRAMES', 'WEEKLY_REPORTS'] as const;

export const canAutoGenerate = (type: string): boolean => {
  return (AUTO_GENERATE_TYPES as readonly string[]).includes(type);
};

/**
 * POST /documents/generate-auto
 * Auto-generates a document from existing system data (e.g. attendance to Time Frames PDF).
 * Body: { type }
 */
export const autoGenerateDocument = async (req: AuthRequest, res: Response) => {
  try {
    const { type } = req.body;

    if (!type) {
      return res.status(400).json({ message: 'Document type is required' });
    }

    if (!canAutoGenerate(type)) {
      return res.status(400).json({ message: `Document type "${type}" does not support auto-generation` });
    }

    // Get student with full data needed for template
    const student = await prisma.student.findUnique({
      where: { userId: req.user!.id },
      include: {
        user: { select: { name: true } },
        company: { select: { name: true, address: true } },
        instructor: { select: { name: true } },
      },
    });

    if (!student) {
      return res.status(404).json({ message: 'Student record not found' });
    }

    let templateFile: string;
    let templateData: Record<string, string>;
    let docTitle: string;

    if (type === 'TIME_FRAMES') {
      // Fetch ALL attendance logs for this student (not just one month)
      const logs = await prisma.attendanceLog.findMany({
        where: { studentId: student.id },
        orderBy: { date: 'asc' },
      });

      // Round to official time (30-minute increments)
      const roundToOfficialTime = (minutes: number): number => {
        if (minutes < 30) return 0;
        return Math.floor(minutes / 30) * 30;
      };

      // Group logs by date and sum hours for same-day entries
      const groupedByDate = new Map<string, { date: Date; totalMinutes: number }>();
      logs.forEach(log => {
        const logDate = log.date instanceof Date ? log.date : new Date(log.date);
        const dateKey = logDate.toISOString().split('T')[0];
        if (groupedByDate.has(dateKey)) {
          const existing = groupedByDate.get(dateKey)!;
          existing.totalMinutes += roundToOfficialTime(log.durationMinutes || 0);
        } else {
          groupedByDate.set(dateKey, {
            date: logDate,
            totalMinutes: roundToOfficialTime(log.durationMinutes || 0),
          });
        }
      });

      // Build attendance row HTML
      const sortedEntries = Array.from(groupedByDate.values())
        .sort((a, b) => a.date.getTime() - b.date.getTime());

      const formatDateStr = (d: Date) => d.toLocaleDateString('en-US', {
        month: 'long', day: 'numeric', year: 'numeric',
      }).toUpperCase();
      const getDayOfWeek = (d: Date) => {
        const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
        return days[d.getDay()];
      };
      const formatHoursStr = (hoursDecimal: number) => {
        const totalMins = Math.round(hoursDecimal * 60);
        const hrs = Math.floor(totalMins / 60);
        const mins = totalMins % 60;
        return mins === 0 ? `${hrs} HOURS` : `${hrs} HOURS ${mins} MINUTES`;
      };

      let attendanceRowsHtml = sortedEntries.map(({ date, totalMinutes }) => {
        const hoursDecimal = totalMinutes / 60;
        return `<tr>
          <td class="date-col">${formatDateStr(date)}</td>
          <td class="day-col">${getDayOfWeek(date)}</td>
          <td class="hours-col">${formatHoursStr(hoursDecimal)}</td>
        </tr>`;
      }).join('\n');

      // Add empty rows to fill table (27 rows to match original form)
      const minRows = 27;
      const emptyRowsNeeded = Math.max(0, minRows - sortedEntries.length);
      for (let i = 0; i < emptyRowsNeeded; i++) {
        attendanceRowsHtml += `<tr><td class="date-col">&nbsp;</td><td class="day-col">&nbsp;</td><td class="hours-col">&nbsp;</td></tr>\n`;
      }

      // Calculate total hours
      const totalMinutes = sortedEntries.reduce((sum, e) => sum + e.totalMinutes, 0);
      const totalHours = totalMinutes / 60;

      // Year suffix
      const getOrdinalSuffix = (num: number): string => {
        const j = num % 10; const k = num % 100;
        if (j === 1 && k !== 11) return 'st';
        if (j === 2 && k !== 12) return 'nd';
        if (j === 3 && k !== 13) return 'rd';
        return 'th';
      };
      const yearSuffix = getOrdinalSuffix(student.year || 1);

      templateFile = 'internship_timeframe.html';
      docTitle = 'Internship_Time_Frames';
      templateData = {
        campus: 'Urdaneta',
        student_name: (student.user.name || 'N/A').toUpperCase(),
        year_and_course: `${(student.program || 'N/A').toUpperCase()} – ${student.year || 1}${yearSuffix} YEAR`,
        company_name: (student.company?.name || 'N/A').toUpperCase(),
        company_address: (student.company?.address || 'N/A').toUpperCase(),
        number_of_hours: `${Math.round(totalHours)} HOURS`,
        attendance_rows: attendanceRowsHtml,
        total_hours: formatHoursStr(totalHours),
        instructor_name: (student.instructor?.name || '').toUpperCase(),
      };
    } else if (type === 'WEEKLY_REPORTS') {
      // Weekly report data is stored as JSON in student.weeklyReportData (saved from Reports tab)
      interface WeekEntry {
        weekNumber: number;
        dateRange: string;
        tasksAccomplished: string;
        knowledgeSkillsValues: string;
      }

      const weeks: WeekEntry[] = (student as any).weeklyReportData
        ? (((student as any).weeklyReportData as any).weeks || [])
        : [];

      if (weeks.length === 0) {
        return res.status(400).json({
          message: 'No weekly report data found. Please fill out the weekly report in the Reports tab first.',
        });
      }

      // Format date helper
      const formatDateValue = (value?: Date | string | null): string => {
        if (!value) return 'N/A';
        const date = typeof value === 'string' ? new Date(value) : value;
        if (Number.isNaN(date.getTime())) return 'N/A';
        return date.toLocaleDateString('en-US', {
          month: 'long', day: 'numeric', year: 'numeric',
        }).toUpperCase();
      };

      // Helper: convert newline-separated text into bullet HTML list
      const toBulletHtml = (text: string): string => {
        if (!text || !text.trim()) return '';
        const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
        if (lines.length === 0) return '';
        return '<ul>' + lines.map(l => `<li>${l}</li>`).join('') + '</ul>';
      };

      // Build 3-column table rows for each week (DATE | TASKS | KNOWLEDGE)
      const weekRowsHtml = weeks
        .sort((a, b) => a.weekNumber - b.weekNumber)
        .map((week) => {
          const dateLabel = `Week ${week.weekNumber}${week.dateRange ? '<br>(' + week.dateRange + ')' : ''}`;
          const tasksHtml = toBulletHtml(week.tasksAccomplished);
          const knowledgeHtml = toBulletHtml(week.knowledgeSkillsValues);
          return `<tr>
            <td class="date-col">${dateLabel}</td>
            <td class="tasks-col">${tasksHtml}</td>
            <td class="knowledge-col">${knowledgeHtml}</td>
          </tr>`;
        })
        .join('\n');

      templateFile = 'weekly_report.html';
      docTitle = 'Weekly_Reports';
      templateData = {
        campus: 'Urdaneta',
        student_name: (student.user.name || 'N/A').toUpperCase(),
        instructor_name: (student.instructor?.name || 'N/A').toUpperCase(),
        company_name: (student.company?.name || 'N/A').toUpperCase(),
        job_description: ((student as any).jobDescription || 'N/A').toUpperCase(),
        start_date: formatDateValue((student as any).startDate),
        end_date: formatDateValue((student as any).endDate),
        total_hours: `${(student as any).totalHours || 240} HOURS`,
        week_rows: weekRowsHtml,
      };
    } else {
      return res.status(400).json({ message: `Unsupported auto-generate type: ${type}` });
    }

    // Generate PDF via Puppeteer (same pipeline as all other forms)
    const { filepath, filename, buffer } = await generatePdf(
      templateFile,
      templateData,
      type,
      student.id,
    );

    // Create Document record
    const document = await prisma.document.create({
      data: {
        studentId: student.id,
        type,
        filename: `${docTitle}_${student.user.name?.replace(/\s+/g, '_')}.pdf`,
        filepath,
        mimeType: 'application/pdf',
        uploadedById: req.user!.id,
        status: 'PENDING',
        fileSize: buffer.length,
      },
    });

    await auditLog(req.user!.id, 'DOCUMENT_UPLOADED', {
      documentId: document.id,
      type,
      filename,
      method: 'auto_generated',
    }, req);

    // Emit real-time event
    emitDocumentUploaded({
      documentId: document.id,
      studentId: student.userId,
      studentName: student.user?.name || 'Student',
      documentType: type,
      fileName: filename,
      createdAt: document.createdAt.toISOString(),
    });

    res.status(201).json({
      document: {
        ...document,
        fileSizeMB: (buffer.length / (1024 * 1024)).toFixed(2) + ' MB',
      },
    });
  } catch (error) {
    console.error('Error auto-generating document:', error);
    res.status(500).json({
      message: 'Failed to auto-generate document',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};