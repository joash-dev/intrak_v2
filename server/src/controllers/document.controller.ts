import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { auditLog } from '../services/audit.service';
import { validateNASConnection } from '../config/nas';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();

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

    const { studentId, type } = req.body;

    // Validate required fields
    if (!studentId || !type) {
      return res.status(400).json({ 
        message: 'Student ID and document type are required' 
      });
    }

    // Verify student exists and user has permission
    const student = await prisma.student.findUnique({
      where: { id: studentId }
    });

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Check if user is the student or has permission
    if (req.user!.role === 'STUDENT') {
      const currentStudent = await prisma.student.findUnique({
        where: { userId: req.user!.id }
      });
      if (currentStudent?.id !== studentId) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    // Calculate file size in MB
    const fileSizeMB = (req.file.size / (1024 * 1024)).toFixed(2);

    const document = await prisma.document.create({
      data: {
        studentId,
        type,
        filename: req.file.originalname,
        filepath: req.file.path,
        mimeType: req.file.mimetype,
        uploadedById: req.user!.id,
        status: 'PENDING'
      }
    });

    await auditLog(req.user!.id, 'DOCUMENT_UPLOADED', {
      documentId: document.id,
      type,
      studentId,
      filename: req.file.originalname,
      fileSize: fileSizeMB + ' MB'
    }, req);

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
              user: { select: { name: true } }
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

    const document = await prisma.document.update({
      where: { id },
      data: {
        status: 'APPROVED',
        remarks,
        reviewedAt: new Date()
      }
    });

    await auditLog(req.user!.id, 'DOCUMENT_APPROVED', {
      documentId: id,
      remarks
    }, req);

    res.json({ document });
  } catch (error) {
    res.status(500).json({ message: 'Approval failed', error });
  }
};

export const rejectDocument = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;

    const document = await prisma.document.update({
      where: { id },
      data: {
        status: 'REJECTED',
        remarks: remarks || 'Document rejected',
        reviewedAt: new Date()
      }
    });

    await auditLog(req.user!.id, 'DOCUMENT_REJECTED', {
      documentId: id,
      remarks
    }, req);

    res.json({ document });
  } catch (error) {
    res.status(500).json({ message: 'Rejection failed', error });
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