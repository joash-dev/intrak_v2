import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

export const getAttendanceReport = async (req: AuthRequest, res: Response) => {
  try {
    const { studentId, from, to, format = 'pdf' } = req.query;
    
    const where: any = { studentId: studentId as string };
    
    if (from && to) {
      where.date = {
        gte: new Date(from as string),
        lte: new Date(to as string)
      };
    }

    const logs = await prisma.attendanceLog.findMany({
      where,
      include: {
        student: {
          include: {
            user: { select: { name: true } }
          }
        }
      },
      orderBy: { date: 'asc' }
    });

    // For now, return JSON. PDF/Excel generation can be added later
    res.json({ 
      logs,
      summary: {
        totalLogs: logs.length,
        totalHours: logs.reduce((sum, log) => sum + log.durationMinutes, 0) / 60
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Report generation failed', error });
  }
};

export const getComplianceReport = async (req: AuthRequest, res: Response) => {
  try {
    const { companyId, format = 'pdf' } = req.query;

    const students = await prisma.student.findMany({
      where: companyId ? { companyId: companyId as string } : {},
      include: {
        user: { select: { name: true, email: true } },
        documents: true,
        attendanceLogs: true,
        evaluations: true
      }
    });

    const reportData = students.map((student) => ({
      name: student.user.name,
      studentNumber: student.studentNumber,
      completedHours: student.completedHours,
      totalHours: student.totalHours,
      progress: ((student.completedHours / student.totalHours) * 100).toFixed(1),
      documentsSubmitted: student.documents.length,
      documentsApproved: student.documents.filter(d => d.status === 'APPROVED').length,
      averageRating: student.evaluations.length > 0
        ? (student.evaluations.reduce((sum, e) => sum + e.rating, 0) / student.evaluations.length).toFixed(1)
        : 'N/A'
    }));

    res.json({ reportData });
  } catch (error) {
    res.status(500).json({ message: 'Report generation failed', error });
  }
};