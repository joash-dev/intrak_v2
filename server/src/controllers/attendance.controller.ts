// ===== src/controllers/attendance.controller.ts =====

import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { generateQRToken, verifyQRToken } from '../services/qr.service';
import { auditLog } from '../services/audit.service';
import { generateDTRPDF } from '../services/dtr.service';

const prisma = new PrismaClient();

// Log Attendance (manual time-in/time-out)
export const logAttendance = async (req: AuthRequest, res: Response) => {
  try {
    let { studentId, date, timeIn, timeOut, action } = req.body;
    
    // If studentId is "me", get the student ID from the authenticated user
    if (studentId === 'me' || !studentId) {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const student = await prisma.student.findFirst({
        where: { userId },
        select: { id: true }
      });

      if (!student) {
        return res.status(404).json({ message: 'Student profile not found' });
      }

      studentId = student.id;
    }
    
    let log;

    if (action === 'time-in') {
      log = await prisma.attendanceLog.create({
        data: {
          studentId,
          date: new Date(date),
          timeIn: new Date(timeIn),
          verificationMethod: 'MANUAL'
        }
      });
    } else if (action === 'time-out') {
      const existingLog = await prisma.attendanceLog.findFirst({
        where: {
          studentId,
          date: new Date(date),
          timeOut: null
        }
      });

      if (!existingLog) {
        return res.status(400).json({ message: 'No time-in record found for today' });
      }

      const timeOutDate = new Date(timeOut);
      const durationMinutes = Math.floor(
        (timeOutDate.getTime() - existingLog.timeIn!.getTime()) / 60000
      );

      log = await prisma.attendanceLog.update({
        where: { id: existingLog.id },
        data: {
          timeOut: timeOutDate,
          durationMinutes
        }
      });

      await prisma.student.update({
        where: { id: studentId },
        data: {
          completedHours: {
            increment: Math.floor(durationMinutes / 60)
          }
        }
      });
    }

    await auditLog(req.user!.id, 'ATTENDANCE_LOGGED', { studentId, action, date }, req);

    res.status(201).json({ log });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to log attendance' });
  }
};

// Fetch Attendance
export const getAttendance = async (req: AuthRequest, res: Response) => {
  try {
    let { studentId, dateFrom, dateTo } = req.query;
    const where: any = {};

    const role = req.user?.role;
    const userId = req.user?.id;

    if (role === 'COORDINATOR' || role === 'INSTRUCTOR') {
      if (studentId && studentId !== 'all') {
        where.studentId = studentId as string;
      }
    } else if (role === 'INDUSTRY_PARTNER') {
      const supervisedCompanies = await prisma.company.findMany({
        where: { supervisorId: userId || '' },
        select: { id: true },
      });

      if (supervisedCompanies.length === 0) {
        return res.json({ logs: [] });
      }

      const companyIds = supervisedCompanies.map((company) => company.id);

      where.student = {
        companyId: { in: companyIds },
      };

      if (studentId && studentId !== 'all') {
        where.studentId = studentId as string;
      }
    } else {
      // For students, only show their own attendance logs
      if (studentId === 'me' || !studentId) {
        if (!userId) {
          return res.status(401).json({ message: 'User not authenticated' });
        }

        const student = await prisma.student.findFirst({
          where: { userId },
          select: { id: true }
        });

        if (!student) {
          return res.status(404).json({ message: 'Student profile not found' });
        }

        studentId = student.id;
      }

      if (studentId) where.studentId = studentId as string;
    }

    // Add date filtering
    if (dateFrom && dateTo) {
      where.date = {
        gte: new Date(dateFrom as string),
        lte: new Date(dateTo as string)
      };
    }

    const logs = await prisma.attendanceLog.findMany({
      where,
      include: {
        student: {
          select: {
            studentNumber: true,
            user: { select: { name: true } },
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    res.json({ logs });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch attendance' });
  }
};

// Generate QR
export const generateQR = async (req: AuthRequest, res: Response) => {
  try {
    let studentId = req.params.studentId;
    
    // If studentId is "me", get the student ID from the authenticated user
    if (studentId === 'me') {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const student = await prisma.student.findFirst({
        where: { userId },
        select: { id: true }
      });

      if (!student) {
        return res.status(404).json({ message: 'Student profile not found' });
      }

      studentId = student.id;
    }

    const qrData = await generateQRToken(studentId);
    res.json(qrData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to generate QR' });
  }
};

// Verify QR Attendance
export const verifyQR = async (req: AuthRequest, res: Response) => {
  try {
    const { token, latitude, longitude } = req.body;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ message: 'QR token is required' });
    }
    const qrToken = await verifyQRToken(token);

    if (!qrToken) {
      return res.status(400).json({ message: 'Invalid or expired QR token' });
    }

    const student = await prisma.student.findUnique({
      where: { id: qrToken.studentId },
      include: { company: true }
    });

    let distanceMeters = null;
    if (latitude && longitude && student?.company?.latitude && student?.company?.longitude) {
      distanceMeters = calculateDistance(
        latitude, longitude,
        student.company.latitude,
        student.company.longitude
      );
    }

    const log = await prisma.attendanceLog.create({
      data: {
        studentId: qrToken.studentId,
        date: new Date(),
        timeIn: new Date(),
        verified: true,
        verificationMethod: 'QR',
        verificationMetadata: {
          token,
          latitude,
          longitude,
          distanceMeters
        }
      }
    });

    await prisma.qRToken.update({
      where: { id: qrToken.id },
      data: { used: true, usedAt: new Date() }
    });

    await auditLog(req.user!.id, 'ATTENDANCE_QR_VERIFIED', {
      studentId: qrToken.studentId, token
    }, req);

    res.json({ log });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'QR verification failed' });
  }
};

// Manual Verification by Admin
export const verifyAttendance = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { verified, remarks } = req.body;

    const log = await prisma.attendanceLog.update({
      where: { id: id as string }, // ensure schema matches
      data: { verified, remarks }
    });

    await auditLog(req.user!.id, 'ATTENDANCE_VERIFIED', { logId: id, verified }, req);

    res.json({ log });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Verification failed' });
  }
};

// GPS Verification
export const verifyGPS = async (req: AuthRequest, res: Response) => {
  try {
    const { studentId, latitude, longitude } = req.body;

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { company: true }
    });

    if (!student || !student.company) {
      return res.status(404).json({ message: 'Student or company not found' });
    }

    if (!student.company.latitude || !student.company.longitude) {
      return res.status(400).json({ message: 'Company location not configured' });
    }

    const distanceMeters = calculateDistance(
      latitude, longitude,
      student.company.latitude,
      student.company.longitude
    );

    const withinRange = distanceMeters <= student.company.radiusMeters;

    const log = await prisma.attendanceLog.create({
      data: {
        studentId,
        date: new Date(),
        timeIn: new Date(),
        verified: withinRange,
        verificationMethod: 'GPS',
        verificationMetadata: {
          latitude, longitude, distanceMeters,
          allowedRadius: student.company.radiusMeters,
          withinRange
        }
      }
    });

    await auditLog(req.user!.id, 'ATTENDANCE_GPS_VERIFIED', { studentId, distanceMeters, withinRange }, req);

    res.json({
      log,
      distanceMeters,
      withinRange,
      message: withinRange
        ? 'Location verified successfully'
        : `Outside allowed range (${distanceMeters.toFixed(0)}m from company)`
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'GPS verification failed' });
  }
};

// Export DTR as PDF
export const exportDTR = async (req: AuthRequest, res: Response) => {
  try {
    let studentId = req.params.studentId;
    const { month, year, startDate, endDate } = req.query;

    // If studentId is "me", get the student ID from the authenticated user
    if (studentId === 'me' || !studentId) {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const student = await prisma.student.findFirst({
        where: { userId },
        select: { id: true, user: { select: { name: true } } }
      });

      if (!student) {
        return res.status(404).json({ message: 'Student profile not found' });
      }

      studentId = student.id;
    }

    // Permission check: Students can only export their own DTR
    if (req.user?.role === 'STUDENT') {
      const student = await prisma.student.findFirst({
        where: { userId: req.user.id, id: studentId },
      });

      if (!student) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    // Generate PDF
    const pdfBuffer = await generateDTRPDF({
      studentId,
      month: month ? parseInt(month as string) : undefined,
      year: year ? parseInt(year as string) : undefined,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    });

    // Get student name for filename
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { user: { select: { name: true } }, studentNumber: true }
    });

    const fileName = `Internship_TimeFrame_${student?.studentNumber || studentId}_${new Date().toISOString().split('T')[0]}.pdf`;

    await auditLog(req.user!.id, 'DOCUMENT_UPLOADED', {
      action: 'DTR_EXPORTED',
      studentId,
      fileName
    }, req);

    // Send PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);

  } catch (error) {
    console.error('DTR Export error:', error);
    res.status(500).json({ 
      message: 'Failed to export DTR',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

// SINGLE helper fn
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
