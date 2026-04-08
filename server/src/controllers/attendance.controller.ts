// ===== src/controllers/attendance.controller.ts =====

import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { generateQRToken, verifyQRToken } from '../services/qr.service';
import { auditLog } from '../services/audit.service';
import { generateDTRPDF } from '../services/dtr.service';
import { ensureStudentStartDate } from '../utils/student.utils';
import { resolveTemplatePath } from '../utils/template.utils';
import path from 'path';
import fs from 'fs';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { prisma } from '../config/database';

// Resolve template path - works in both development and production
const templateName = '14 INTERNSHIP TIMEFRAME_2024.docx';
const DTR_TEMPLATE_FILE = resolveTemplatePath(templateName);

const formatDate = (value?: Date | string | null): string => {
  if (!value) return 'N/A';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).toUpperCase();
};

const getDayOfWeek = (value: Date | string): string => {
  const date = typeof value === 'string' ? new Date(value) : value;
  const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  return days[date.getDay()];
};

/**
 * Round minutes to the nearest 30-minute increment (official time standard)
 * - If minutes >= 30, round to 30 minutes
 * - If minutes < 30, round to 0 minutes (don't count)
 */
const roundToOfficialTime = (minutes: number): number => {
  // Round DOWN to nearest 30-minute interval
  // Anything less than 30 minutes rounds to 0
  if (minutes < 30) {
    return 0;
  }
  // Round down to nearest 30-minute interval (30, 60, 90, 120, etc.)
  return Math.floor(minutes / 30) * 30;
};

/**
 * Floors a timestamp to the nearest 30-minute block.
 * Examples:
 * - 08:19 -> 08:00
 * - 08:30 -> 08:30
 * - 12:20 -> 12:00
 */
const floorTo30MinuteBlock = (value: Date): Date => {
  const d = new Date(value);
  const mins = d.getMinutes();
  d.setSeconds(0, 0);
  d.setMinutes(mins < 30 ? 0 : 30);
  return d;
};

const computeOfficialDurationMinutes = (timeIn: Date, timeOut: Date): number => {
  const roundedIn = floorTo30MinuteBlock(timeIn);
  const roundedOut = floorTo30MinuteBlock(timeOut);
  const diff = roundedOut.getTime() - roundedIn.getTime();
  return Math.max(0, Math.floor(diff / 60000));
};

const getManilaFixedTimeUtc = (date: Date, hours24: number, minutes: number) => {
  const { yyyyMmDd } = getManilaDayRangeUtc(date);
  const hh = String(hours24).padStart(2, '0');
  const mm = String(minutes).padStart(2, '0');
  return new Date(`${yyyyMmDd}T${hh}:${mm}:00.000+08:00`);
};

const formatHours = (hoursDecimal: number): string => {
  const totalMinutes = Math.round(hoursDecimal * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (minutes === 0) {
    return `${hours} HOURS`;
  } else {
    return `${hours} HOURS ${minutes} MINUTES`;
  }
};

const getOrdinalSuffix = (num: number): string => {
  const j = num % 10;
  const k = num % 100;
  if (j === 1 && k !== 11) return 'st';
  if (j === 2 && k !== 12) return 'nd';
  if (j === 3 && k !== 13) return 'rd';
  return 'th';
};

const MAX_SEGMENTS_PER_DAY = 2;

const getManilaDayRangeUtc = (date: Date | string) => {
  // Convert a date (or date string) into the UTC range that corresponds to the
  // Asia/Manila calendar day. This avoids UTC/PHT boundary bugs near midnight.
  const d = typeof date === 'string' ? new Date(date) : date;
  const yyyyMmDd = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d); // YYYY-MM-DD

  const start = new Date(`${yyyyMmDd}T00:00:00.000+08:00`);
  const end = new Date(`${yyyyMmDd}T23:59:59.999+08:00`);
  return { start, end, yyyyMmDd };
};

// Log Attendance (manual time-in/time-out)
export const logAttendance = async (req: AuthRequest, res: Response) => {
  try {
    let { studentId, date, timeIn, timeOut, action } = req.body;
    const isStudentSelfLog = req.user?.role === 'STUDENT';

    // If studentId is "me", get the student ID from the authenticated user
    if (studentId === 'me' || !studentId || isStudentSelfLog) {
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
      // Students must use server-detected time; prevent backdating and inconsistent sequences.
      // Non-students can still backdate via provided timestamps.
      const now = new Date();
      if (isStudentSelfLog) {
        date = now.toISOString();
        timeIn = now.toISOString();
      }

      // Enforce max segments/day (PHT day boundary) before creating a new segment.
      // Use timeIn if provided, else fall back to date.
      const timeInDate = timeIn ? new Date(timeIn) : new Date(date);
      const { start, end, yyyyMmDd } = getManilaDayRangeUtc(timeInDate);

      const segmentsToday = await prisma.attendanceLog.count({
        where: {
          studentId,
          timeIn: {
            gte: start,
            lte: end,
          },
        },
      });

      if (segmentsToday >= MAX_SEGMENTS_PER_DAY) {
        return res.status(400).json({
          message: `You already have ${MAX_SEGMENTS_PER_DAY} attendance session(s) for ${yyyyMmDd}. Additional time-in is not allowed.`,
          code: 'MAX_DAILY_SEGMENTS_REACHED',
          date: yyyyMmDd,
          maxSegments: MAX_SEGMENTS_PER_DAY,
        });
      }

      // Prevent overlapping segments: ensure there's no open log for this student
      const openLog = await prisma.attendanceLog.findFirst({
        where: {
          studentId,
          timeOut: null,
        },
        orderBy: { date: 'desc' },
      });

      if (openLog) {
        // If it's a morning session and it's already past 12:00 PM Manila time,
        // auto time-out at exactly 12:00 PM so the student can start session 2.
        const now = new Date();
        const noon = getManilaFixedTimeUtc(openLog.timeIn || openLog.date, 12, 0);
        const sixPm = getManilaFixedTimeUtc(openLog.timeIn || openLog.date, 18, 0);

        if (openLog.timeIn && openLog.timeIn.getTime() < noon.getTime() && now.getTime() >= noon.getTime()) {
          // Session 1 -> force close at noon
          await prisma.attendanceLog.update({
            where: { id: openLog.id },
            data: {
              timeOut: noon,
              durationMinutes: computeOfficialDurationMinutes(openLog.timeIn, noon),
            },
          });
        } else if (
          openLog.timeIn &&
          openLog.timeIn.getTime() >= noon.getTime() &&
          openLog.timeIn.getTime() < sixPm.getTime() &&
          now.getTime() >= sixPm.getTime()
        ) {
          // Session 2 -> force close at 6:00 PM
          await prisma.attendanceLog.update({
            where: { id: openLog.id },
            data: {
              timeOut: sixPm,
              durationMinutes: computeOfficialDurationMinutes(openLog.timeIn, sixPm),
            },
          });
        } else {
        return res.status(400).json({
          message: 'There is an active time-in without time-out. Time-out first before starting a new segment.',
          openLogId: openLog.id,
          openLogDate: openLog.date,
          openLogTimeIn: openLog.timeIn,
        });
        }
      }

      log = await prisma.attendanceLog.create({
        data: {
          studentId,
          date: new Date(date),
          timeIn: new Date(timeIn),
          verificationMethod: 'MANUAL'
        }
      });

      await ensureStudentStartDate(studentId, new Date(timeIn));
    } else if (action === 'time-out') {
      // Close the most recent open segment for the given date (or any date if not provided)
      const existingLog = await prisma.attendanceLog.findFirst({
        where: {
          studentId,
          timeOut: null
        },
        orderBy: { date: 'desc' }
      });

      if (!existingLog) {
        return res.status(400).json({ message: 'No open time-in record found to close' });
      }

      // Students must use server-detected time for time-out as well.
      const timeOutDate = isStudentSelfLog ? new Date() : new Date(timeOut);
      const durationMinutes = computeOfficialDurationMinutes(existingLog.timeIn!, timeOutDate);

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

    if (role === 'COORDINATOR' || role === 'INSTRUCTOR' || role === 'ADMIN') {
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

    // Toggle logic: if there's an open segment (no timeOut), close it; otherwise start a new one
    const openLog = await prisma.attendanceLog.findFirst({
      where: {
        studentId: qrToken.studentId,
        timeOut: null
      },
      orderBy: { date: 'desc' }
    });

    let log;
    let action: 'login' | 'logout';
    if (openLog) {
      const now = new Date();
      const noon = getManilaFixedTimeUtc(openLog.timeIn || openLog.date, 12, 0);
      const sixPm = getManilaFixedTimeUtc(openLog.timeIn || openLog.date, 18, 0);

      // If they forgot to time-out in the morning session and it's already past noon,
      // close at exactly 12:00 PM and treat this scan as a new login (session 2).
      if (openLog.timeIn && openLog.timeIn.getTime() < noon.getTime() && now.getTime() >= noon.getTime()) {
        await prisma.attendanceLog.update({
          where: { id: openLog.id },
          data: {
            timeOut: noon,
            durationMinutes: computeOfficialDurationMinutes(openLog.timeIn, noon),
            verified: true,
            verificationMethod: 'QR',
            verificationMetadata: {
              ...(openLog.verificationMetadata as any),
              token,
              latitude,
              longitude,
              distanceMeters
            }
          }
        });

        // Continue to create a new log as "login" below.
      } else if (
        openLog.timeIn &&
        openLog.timeIn.getTime() >= noon.getTime() &&
        openLog.timeIn.getTime() < sixPm.getTime() &&
        now.getTime() >= sixPm.getTime()
      ) {
        // If they forgot to time-out in the afternoon session, close at exactly 6:00 PM.
        // Treat this scan as a logout completion (do not start a new session).
        log = await prisma.attendanceLog.update({
          where: { id: openLog.id },
          data: {
            timeOut: sixPm,
            durationMinutes: computeOfficialDurationMinutes(openLog.timeIn, sixPm),
            verified: true,
            verificationMethod: 'QR',
            verificationMetadata: {
              ...(openLog.verificationMetadata as any),
              token,
              latitude,
              longitude,
              distanceMeters
            }
          }
        });
        action = 'logout';
      } else {
        const durationMinutes = computeOfficialDurationMinutes(openLog.timeIn!, now);
        log = await prisma.attendanceLog.update({
          where: { id: openLog.id },
          data: {
            timeOut: now,
            durationMinutes,
            verified: true,
            verificationMethod: 'QR',
            verificationMetadata: {
              ...(openLog.verificationMetadata as any),
              token,
              latitude,
              longitude,
              distanceMeters
            }
          }
        });
        action = 'logout';
      }
    } else {
      // Enforce max segments/day (PHT) for new QR time-in.
      const now = new Date();
      const { start, end, yyyyMmDd } = getManilaDayRangeUtc(now);
      const segmentsToday = await prisma.attendanceLog.count({
        where: {
          studentId: qrToken.studentId,
          timeIn: { gte: start, lte: end },
        },
      });
      if (segmentsToday >= MAX_SEGMENTS_PER_DAY) {
        return res.status(400).json({
          message: `Daily attendance limit reached for ${yyyyMmDd}.`,
          code: 'MAX_DAILY_SEGMENTS_REACHED',
          date: yyyyMmDd,
          maxSegments: MAX_SEGMENTS_PER_DAY,
        });
      }

      log = await prisma.attendanceLog.create({
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
      action = 'login';
    }

    // If we auto-closed the morning openLog at noon, we still need to create a new login now.
    if (!log && openLog) {
      const now = new Date();
      const { start, end, yyyyMmDd } = getManilaDayRangeUtc(now);
      const segmentsToday = await prisma.attendanceLog.count({
        where: {
          studentId: qrToken.studentId,
          timeIn: { gte: start, lte: end },
        },
      });
      if (segmentsToday >= MAX_SEGMENTS_PER_DAY) {
        return res.status(400).json({
          message: `Daily attendance limit reached for ${yyyyMmDd}.`,
          code: 'MAX_DAILY_SEGMENTS_REACHED',
          date: yyyyMmDd,
          maxSegments: MAX_SEGMENTS_PER_DAY,
        });
      }

      log = await prisma.attendanceLog.create({
        data: {
          studentId: qrToken.studentId,
          date: now,
          timeIn: now,
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
      action = 'login';
    }

    // Ensure student start date is initialized from the earliest attendance activity.
    const attendanceReferenceDate = openLog?.timeIn || log.timeIn || new Date();
    await ensureStudentStartDate(qrToken.studentId, attendanceReferenceDate);

    await prisma.qRToken.update({
      where: { id: qrToken.id },
      data: { used: true, usedAt: new Date() }
    });

    await auditLog(req.user!.id, 'ATTENDANCE_QR_VERIFIED', {
      studentId: qrToken.studentId, token
    }, req);

    res.json({ log, action });
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

    // Enforce max segments/day (PHT) for GPS time-in.
    const now = new Date();
    const { start, end, yyyyMmDd } = getManilaDayRangeUtc(now);
    const segmentsToday = await prisma.attendanceLog.count({
      where: {
        studentId,
        timeIn: { gte: start, lte: end },
      },
    });
    if (segmentsToday >= MAX_SEGMENTS_PER_DAY) {
      return res.status(400).json({
        message: `Daily attendance limit reached for ${yyyyMmDd}.`,
        code: 'MAX_DAILY_SEGMENTS_REACHED',
        date: yyyyMmDd,
        maxSegments: MAX_SEGMENTS_PER_DAY,
      });
    }

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

    // GPS time-in should also initialize student start date when missing.
    await ensureStudentStartDate(studentId, log.timeIn || new Date());

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

// Export DTR as Word Document (DOCX)
export const exportDTRDocx = async (req: AuthRequest, res: Response) => {
  try {
    console.log('=== DTR DOCX Export Started ===');
    console.log('Request params:', req.params);
    console.log('Request query:', req.query);
    console.log('User:', req.user?.id, req.user?.role);

    console.log('DTR Template file path:', DTR_TEMPLATE_FILE);
    console.log('Template file exists:', fs.existsSync(DTR_TEMPLATE_FILE));
    console.log('__dirname:', __dirname);
    console.log('process.cwd():', process.cwd());

    if (!fs.existsSync(DTR_TEMPLATE_FILE)) {
      console.error('Template file not found at:', DTR_TEMPLATE_FILE);
      return res.status(500).json({
        message: 'DTR template is missing on the server',
        path: process.env.NODE_ENV === 'development' ? DTR_TEMPLATE_FILE : undefined,
      });
    }

    let studentId = req.params.studentId;
    const { month, year, startDate, endDate } = req.query;
    console.log('Export parameters:', { studentId, month, year, startDate, endDate });

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

    // Determine date range
    let dateFrom: Date;
    let dateTo: Date;

    if (month && year) {
      dateFrom = new Date(Number(year), Number(month) - 1, 1);
      dateTo = new Date(Number(year), Number(month), 0, 23, 59, 59);
    } else if (startDate && endDate) {
      dateFrom = new Date(startDate as string);
      dateTo = new Date(endDate as string);
    } else {
      const now = new Date();
      dateFrom = new Date(now.getFullYear(), now.getMonth(), 1);
      dateTo = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    }

    // Fetch student data
    console.log('Fetching student data for ID:', studentId);
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: { select: { name: true, email: true } },
        company: { select: { name: true, address: true, contactPerson: true } },
        instructor: { select: { name: true, email: true } }
      }
    });

    if (!student) {
      console.error('Student not found:', studentId);
      return res.status(404).json({ message: 'Student not found' });
    }

    console.log('Student found:', {
      id: student.id,
      name: student.user?.name,
      year: student.year,
      program: student.program,
      company: student.company?.name || 'No company'
    });

    // Fetch attendance logs
    console.log('Fetching attendance logs for date range:', { dateFrom, dateTo });
    const logs = await prisma.attendanceLog.findMany({
      where: {
        studentId,
        date: {
          gte: dateFrom,
          lte: dateTo
        }
      },
      orderBy: { date: 'asc' }
    });

    console.log(`Found ${logs.length} attendance logs`);

    // Calculate total hours with official time rounding (30-minute increments)
    const totalMinutes = logs.reduce((sum, log) => {
      const roundedMinutes = roundToOfficialTime(log.durationMinutes || 0);
      return sum + roundedMinutes;
    }, 0);
    const totalHours = totalMinutes / 60;
    console.log('Total hours calculated (with official rounding):', totalHours);

    // Load template
    console.log('Loading template file...');
    const templateBuffer = fs.readFileSync(DTR_TEMPLATE_FILE);
    console.log('Template file size:', templateBuffer.length, 'bytes');

    console.log('Creating Docxtemplater instance...');
    const zip = new PizZip(templateBuffer);

    let doc: Docxtemplater;
    try {
      doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        delimiters: {
          start: '${',
          end: '}',
        },
      });
      console.log('Docxtemplater instance created');
    } catch (templateError: any) {
      console.error('Template compilation error:', templateError);
      // Extract detailed error information
      if (templateError.properties) {
        console.error('Template errors:', templateError.properties.errors);
        const errorMessages = templateError.properties.errors?.map((e: any) => ({
          message: e.message,
          name: e.name,
          properties: e.properties
        }));
        return res.status(500).json({
          message: 'Template syntax error',
          details: {
            message: 'The template file has syntax errors',
            errors: errorMessages,
            hint: 'Check template placeholders - loops should use ${#array} and ${/array} syntax'
          }
        });
      }
      throw templateError;
    }

    // Prepare placeholder values
    try {
      const yearSuffix = getOrdinalSuffix(student.year || 1);
      const program = student.program || 'N/A';
      const studentName = student.user?.name || 'N/A';

      const placeholderValues: Record<string, any> = {
        student_name: studentName.toUpperCase(),
        year_and_course: `${program.toUpperCase()} – ${student.year || 1}${yearSuffix} YEAR`,
        year: `${student.year || 1}${yearSuffix} YEAR`,
        course: program.toUpperCase(),
        company_name: (student.company?.name || 'N/A').toUpperCase(),
        company_address: (student.company?.address || 'N/A').toUpperCase(),
        number_of_hours: `${Math.round(totalHours)} HOURS`,
        instructor_name: (student.instructor?.name || 'N/A').toUpperCase(),
        date_started: formatDate(student.startDate),
        date_ended: formatDate(student.endDate),
        period_from: formatDate(dateFrom),
        period_to: formatDate(dateTo),
        attendance_logs: (() => {
          // Group logs by date and sum hours for same-day entries
          const groupedByDate = new Map<string, { date: Date; totalMinutes: number }>();

          logs.forEach(log => {
            try {
              const logDate = log.date instanceof Date ? log.date : new Date(log.date);
              const dateKey = logDate.toISOString().split('T')[0]; // YYYY-MM-DD format for grouping

              if (groupedByDate.has(dateKey)) {
                // Add to existing entry (apply official time rounding)
                const existing = groupedByDate.get(dateKey)!;
                const roundedMinutes = roundToOfficialTime(log.durationMinutes || 0);
                existing.totalMinutes += roundedMinutes;
              } else {
                // Create new entry (apply official time rounding)
                const roundedMinutes = roundToOfficialTime(log.durationMinutes || 0);
                groupedByDate.set(dateKey, {
                  date: logDate,
                  totalMinutes: roundedMinutes
                });
              }
            } catch (logError) {
              console.error('Error processing attendance log:', logError, log);
            }
          });

          // Convert grouped map to array and format
          return Array.from(groupedByDate.values())
            .sort((a, b) => a.date.getTime() - b.date.getTime()) // Sort by date
            .map(({ date, totalMinutes }) => {
              const hoursDecimal = totalMinutes / 60;
              return {
                date: formatDate(date),
                day: getDayOfWeek(date),
                hours: formatHours(hoursDecimal)
              };
            });
        })()
      };

      console.log('Placeholder values prepared:', {
        student_name: placeholderValues.student_name,
        year_and_course: placeholderValues.year_and_course,
        company_name: placeholderValues.company_name,
        number_of_hours: placeholderValues.number_of_hours,
        logs_count: placeholderValues.attendance_logs.length
      });

      doc.setData(placeholderValues);

    } catch (dataError) {
      console.error('Error preparing placeholder values:', dataError);
      throw new Error(`Failed to prepare template data: ${dataError instanceof Error ? dataError.message : String(dataError)}`);
    }

    try {
      doc.render();
    } catch (error) {
      console.error('DOCX render error:', error);
      const renderError = error as any;
      console.error('Render error details:', {
        message: renderError?.message,
        properties: renderError?.properties,
        name: renderError?.name,
      });
      return res.status(500).json({
        message: 'Failed to generate DTR document',
        details: {
          message: renderError?.message || String(error),
          properties: renderError?.properties,
          name: renderError?.name,
          type: 'Template rendering error'
        }
      });
    }

    const buffer = doc.getZip().generate({
      type: 'nodebuffer',
    });

    const safeStudentName = (student.user?.name || 'student').replace(/[^a-z0-9]/gi, '_');
    const filename = `Internship_TimeFrame_${safeStudentName}_${new Date().toISOString().split('T')[0]}.docx`;

    await auditLog(req.user!.id, 'DOCUMENT_UPLOADED', {
      action: 'DTR_DOCX_EXPORTED',
      studentId,
      fileName: filename
    }, req);

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);

    return res.send(buffer);
  } catch (error) {
    console.error('=== DTR DOCX Export Error ===');
    console.error('Error type:', error?.constructor?.name);
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('Full error object:', error);

    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    return res.status(500).json({
      message: 'Unexpected error while exporting DTR',
      details: {
        message: errorMessage,
        stack: process.env.NODE_ENV === 'development' ? errorStack : undefined,
        type: error?.constructor?.name || 'Unknown',
        error: process.env.NODE_ENV === 'development' ? String(error) : undefined
      }
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
