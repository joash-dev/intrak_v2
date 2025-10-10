import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

export const getStudents = async (req: AuthRequest, res: Response) => {
  try {
    const { companyId, userId, search, page = 1, limit = 20 } = req.query;

    const where: any = {};
    if (companyId) where.companyId = companyId;
    if (userId) where.userId = userId;
    if (search) {
      where.OR = [
        { studentNumber: { contains: search as string } },
        { user: { name: { contains: search as string, mode: 'insensitive' } } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        include: {
          user: { select: { name: true, email: true } },
          company: { select: { name: true } }
        },
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.student.count({ where })
    ]);

    res.json({
      students,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch students', error });
  }
};

export const getStudentProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const student = await prisma.student.findFirst({
      where: { userId },
      include: {
        user: { 
          select: { 
            id: true,
            name: true, 
            email: true,
            role: true
          } 
        },
        company: { 
          select: { 
            id: true,
            name: true,
            address: true
          } 
        }
      }
    });

    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    // Calculate completed hours from attendance logs
    const attendanceLogs = await prisma.attendanceLog.findMany({
      where: { studentId: student.id, verified: true },
      select: { durationMinutes: true }
    });

    const completedHours = Math.round(attendanceLogs.reduce((sum, log) => sum + log.durationMinutes, 0) / 60);

    res.json({
      id: student.id,
      name: student.user.name,
      email: student.user.email,
      studentNumber: student.studentNumber,
      program: student.program,
      year: student.year,
      section: student.section,
      company: student.company?.name || '',
      supervisor: student.supervisorName || '',
      totalHours: student.totalHours,
      completedHours: completedHours,
      startDate: student.startDate,
      endDate: student.endDate
    });
  } catch (error) {
    console.error('Error fetching student profile:', error);
    res.status(500).json({ message: 'Failed to fetch student profile', error });
  }
};

export const getStudentById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, email: true } },
        company: true,
        documents: { orderBy: { uploadedAt: 'desc' }, take: 10 },
        attendanceLogs: { orderBy: { date: 'desc' }, take: 10 },
        evaluations: { include: { evaluator: { select: { name: true } } } }
      }
    });

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.json({ student });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch student', error });
  }
};

export const createStudent = async (req: AuthRequest, res: Response) => {
  try {
    const {
      userId,
      studentNumber,
      program,
      year,
      section,
      companyId,
      supervisorName,
      startDate,
      endDate,
      totalHours
    } = req.body;

    const student = await prisma.student.create({
      data: {
        userId,
        studentNumber,
        program,
        year: parseInt(year),
        section,
        companyId,
        supervisorName,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        totalHours: totalHours ? parseInt(totalHours) : 500
      },
      include: {
        user: { select: { name: true, email: true } }
      }
    });

    res.status(201).json({ student });
  } catch (error: any) {
    console.error('Error creating student:', error);
    
    // Provide more specific error messages
    if (error.code === 'P2002') {
      // Unique constraint violation
      const field = error.meta?.target?.[0] || 'field';
      res.status(400).json({ 
        message: `Student with this ${field} already exists`,
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    } else if (error.code === 'P2003') {
      // Foreign key constraint violation
      res.status(400).json({ 
        message: 'Invalid user ID provided',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    } else {
      res.status(500).json({ 
        message: 'Failed to create student', 
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }
};

export const updateStudent = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    if (updateData.startDate) updateData.startDate = new Date(updateData.startDate);
    if (updateData.endDate) updateData.endDate = new Date(updateData.endDate);
    if (updateData.year) updateData.year = parseInt(updateData.year);
    if (updateData.totalHours) updateData.totalHours = parseInt(updateData.totalHours);

    const student = await prisma.student.update({
      where: { id },
      data: updateData,
      include: {
        user: { select: { name: true, email: true } }
      }
    });

    res.json({ student });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update student', error });
  }
};

export const deleteStudent = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.student.delete({ where: { id } });

    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete student', error });
  }
};