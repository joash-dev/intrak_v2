import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

export const getAuditLogs = async (req: AuthRequest, res: Response) => {
  try {
    const { userId, action, page = 1, limit = 50 } = req.query;
    const currentUser = req.user!;

    const where: any = {};
    if (userId) where.userId = userId;
    if (action) where.action = { contains: action as string };

    // If user is instructor, filter to only show their actions or actions related to their students
    if (currentUser.role === 'INSTRUCTOR') {
      // Get students assigned to this instructor
      const assignedStudents = await prisma.student.findMany({
        where: { instructorId: currentUser.id },
        select: { userId: true }
      });
      
      const assignedStudentIds = assignedStudents.map(s => s.userId);
      
      // Filter to show only instructor's own actions or actions related to their students
      where.OR = [
        { userId: currentUser.id }, // Instructor's own actions
        { userId: { in: assignedStudentIds } } // Actions by assigned students
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: { select: { name: true, email: true, role: true } }
        },
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.auditLog.count({ where })
    ]);

    res.json({
      logs,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch audit logs', error });
  }
};

export const getAuditLogById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const currentUser = req.user!;

    const log = await prisma.auditLog.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, email: true, role: true } }
      }
    });

    if (!log) {
      return res.status(404).json({ message: 'Audit log not found' });
    }

    // If user is instructor, check if they have permission to view this log
    if (currentUser.role === 'INSTRUCTOR') {
      // Check if this is the instructor's own action
      if (log.userId === currentUser.id) {
        return res.json({ log });
      }
      
      // Check if this is an action by one of their assigned students
      const assignedStudents = await prisma.student.findMany({
        where: { instructorId: currentUser.id },
        select: { userId: true }
      });
      
      const assignedStudentIds = assignedStudents.map(s => s.userId);
      
      if (!assignedStudentIds.includes(log.userId)) {
        return res.status(403).json({ message: 'Access denied to this audit log' });
      }
    }

    res.json({ log });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch audit log', error });
  }
};