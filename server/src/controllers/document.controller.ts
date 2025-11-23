import { Response } from 'express';
import { PrismaClient, DocumentFeedbackType, NotificationType } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { auditLog } from '../services/audit.service';
import { validateNASConnection, getStoragePath, ensureNASDirectoryExists } from '../config/nas';
import path from 'path';
import fs from 'fs';
import { notificationService } from '../services/notification.service';
import { emitDocumentUploaded, emitDocumentStatusChanged } from '../utils/socketEmitters';

const prisma = new PrismaClient();
const uploadPath = getStoragePath();

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
    // Validate NAS connection if enabled
    const nasValid = await validateNASConnection();
    if (!nasValid) {
      return res.status(503).json({ 
        message: 'Storage system unavailable. Please try again later.' 
      });
    }

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
        message: `Selected student is not assigned to the chosen company${
          student.company?.name ? ` (${student.company.name})` : ''
        }.`,
      });
    }

    // Calculate file size in MB
    const fileSizeMB = (req.file.size / (1024 * 1024)).toFixed(2);

    // Move file to student-specific directory
    const studentDir = path.join(uploadPath, 'documents', targetStudentId);
    await ensureNASDirectoryExists(studentDir);
    
    const finalFilename = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(req.file.originalname)}`;
    const finalPath = path.join(studentDir, finalFilename);
    
    // Move file from temp location to final location
    try {
      fs.renameSync(req.file.path, finalPath);
    } catch (moveError) {
      console.error('Error moving file:', moveError);
      // Clean up temp file if move fails
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
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
        status: 'PENDING'
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
        uploadedAt: document.uploadedAt.toISOString(),
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
    const { studentId, status, type, page = 1, limit = 20 } = req.query;

    const where: any = {};
    
    // If user is a student, only show their own documents
    if (req.user!.role === 'STUDENT') {
      const student = await prisma.student.findUnique({
        where: { userId: req.user!.id }
      });
      if (student) {
        where.studentId = student.id;
      } else {
        return res.status(404).json({ message: 'Student record not found' });
      }
    } else if (req.user!.role === 'INSTRUCTOR') {
      // For instructors, only show documents from their assigned students
      const assignedStudents = await prisma.student.findMany({
        where: { instructorId: req.user!.id },
        select: { id: true }
      });
      
      if (assignedStudents.length > 0) {
        const assignedStudentIds = assignedStudents.map(s => s.id);
        where.studentId = { in: assignedStudentIds };
      } else {
        // If instructor has no assigned students, return empty array
        return res.status(200).json({ 
          documents: [], 
          total: 0, 
          page: Number(page), 
          limit: Number(limit) 
        });
      }
    } else if (studentId) {
      where.studentId = studentId;
    }
    
    if (status) where.status = status;
    if (type) where.type = type;

    const skip = (Number(page) - 1) * Number(limit);

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        include: {
          student: {
            select: {
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
        orderBy: { uploadedAt: 'desc' }
      }),
      prisma.document.count({ where })
    ]);

    // Format documents
    const formattedDocuments = documents.map(doc => ({
      ...doc,
      fileSizeMB: null // File size not stored in database
    }));

    res.json({
      documents: formattedDocuments,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch documents', 
      error: process.env.NODE_ENV === 'development' ? error : undefined 
    });
  }
};

export const getStudentDocuments = async (req: AuthRequest, res: Response) => {
  try {
    console.log(`📄 Getting documents for user: ${req.user?.id}, role: ${req.user?.role}`);
    
    // Check if user is authenticated
    if (!req.user) {
      console.log(`📄 No authenticated user found`);
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // Check if user is a student
    if (req.user.role !== 'STUDENT') {
      console.log(`📄 User is not a student, role: ${req.user.role}`);
      return res.status(403).json({ message: 'Access denied. Student role required.' });
    }
    
    // Get current student
    const student = await prisma.student.findUnique({
      where: { userId: req.user.id },
      include: {
        user: { select: { name: true } }
      }
    });

    console.log(`📄 Student found:`, student ? 'Yes' : 'No');

    if (!student) {
      console.log(`📄 Student record not found for user: ${req.user.id}`);
      return res.status(404).json({ 
        message: 'Student record not found',
        debug: {
          userId: req.user.id,
          userRole: req.user.role,
          userEmail: req.user.email
        }
      });
    }

    const documents = await prisma.document.findMany({
      where: { studentId: student.id },
      orderBy: { uploadedAt: 'desc' }
    });

    console.log(`📄 Found ${documents.length} documents for student ${student.id}`);

    // Format documents for client
    const formattedDocuments = documents.map(doc => ({
      id: doc.id,
      type: doc.type,
      filename: doc.filename,
      status: doc.status,
      uploadedAt: doc.uploadedAt?.toISOString().split('T')[0] || null,
      reviewedAt: doc.reviewedAt?.toISOString().split('T')[0] || null,
      remarks: doc.remarks,
      fileSize: null // File size not stored in database
    }));

    res.json({ documents: formattedDocuments });
  } catch (error) {
    console.error('Get student documents error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch documents', 
      error: process.env.NODE_ENV === 'development' ? error : undefined 
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

    const filepath = path.resolve(document.filepath);
    
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ message: 'File not found' });
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

    // Delete file from filesystem
    const fs = require('fs');
    if (fs.existsSync(document.filepath)) {
      fs.unlinkSync(document.filepath);
    }

    await prisma.document.delete({ where: { id } });

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete document', error });
  }
};