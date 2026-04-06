import { Response } from 'express';
import type { AttendanceNoWorkReason, AttendanceNoWorkStatus } from '@prisma/client';
import { NotificationType, Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { notificationService } from '../services/notification.service';

/** Must match `enum AttendanceNoWorkReason` in schema.prisma */
const REASON_VALUES = new Set<string>([
  'TYPHOON',
  'NATURAL_DISASTER',
  'POWER_OUTAGE',
  'TRANSPORT_INTERRUPTED',
  'COMPANY_SUSPENDED',
  'OTHER',
]);
const MAX_BACK_DAYS = 14;

const manilaDateKey = (d: Date): string =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);

const parseDateKeyManila = (dateKey: string): Date | null => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return null;
  const start = new Date(`${dateKey}T12:00:00.000+08:00`);
  return Number.isNaN(start.getTime()) ? null : start;
};

const daysBetweenManila = (earlierKey: string, laterKey: string): number => {
  const a = parseDateKeyManila(earlierKey);
  const b = parseDateKeyManila(laterKey);
  if (!a || !b) return Infinity;
  return Math.round((b.getTime() - a.getTime()) / 86400000);
};

export const createNoWorkNotice = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { dateKey, reason, details } = req.body as {
      dateKey?: string;
      reason?: string;
      details?: string;
    };

    if (!dateKey || typeof dateKey !== 'string') {
      return res.status(400).json({ message: 'dateKey (YYYY-MM-DD) is required' });
    }
    if (!parseDateKeyManila(dateKey)) {
      return res.status(400).json({ message: 'Invalid dateKey' });
    }
    if (!reason || !REASON_VALUES.has(reason as AttendanceNoWorkReason)) {
      return res.status(400).json({ message: 'Invalid reason' });
    }

    const detailsTrimmed =
      typeof details === 'string' ? details.trim().slice(0, 2000) : undefined;
    if (reason === 'OTHER' && (!detailsTrimmed || detailsTrimmed.length < 3)) {
      return res
        .status(400)
        .json({ message: 'Please describe the situation when reason is “Other”' });
    }

    const todayKey = manilaDateKey(new Date());
    if (daysBetweenManila(dateKey, todayKey) < 0) {
      return res.status(400).json({
        message: 'You cannot report a no-work day in the future.',
      });
    }
    if (daysBetweenManila(dateKey, todayKey) > MAX_BACK_DAYS) {
      return res.status(400).json({
        message: `Reports are limited to the last ${MAX_BACK_DAYS} days (Manila time).`,
      });
    }

    const student = await prisma.student.findUnique({
      where: { userId },
      select: {
        id: true,
        companyId: true,
        user: { select: { name: true } },
      },
    });

    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }
    if (!student.companyId) {
      return res.status(400).json({
        message: 'You must be assigned to a company before reporting a no-work day.',
      });
    }

    const existing = await prisma.attendanceNoWorkNotice.findUnique({
      where: {
        studentId_dateKey: { studentId: student.id, dateKey },
      },
    });

    if (existing?.status === 'PENDING') {
      return res.status(409).json({
        message: 'You already have a pending notice for this date.',
        notice: existing,
      });
    }
    if (existing?.status === 'APPROVED') {
      return res.status(409).json({
        message: 'This date already has an approved no-work notice.',
        notice: existing,
      });
    }

    const company = await prisma.company.findUnique({
      where: { id: student.companyId },
      select: { id: true, name: true, supervisorId: true },
    });

    const notice = existing
      ? await prisma.attendanceNoWorkNotice.update({
          where: { id: existing.id },
          data: {
            reason: reason as AttendanceNoWorkReason,
            details: detailsTrimmed || null,
            status: 'PENDING',
            reviewedById: null,
            reviewedAt: null,
            supervisorRemarks: null,
          },
          include: {
            student: {
              select: {
                user: { select: { name: true, email: true } },
                studentNumber: true,
              },
            },
          },
        })
      : await prisma.attendanceNoWorkNotice.create({
          data: {
            studentId: student.id,
            dateKey,
            reason: reason as AttendanceNoWorkReason,
            details: detailsTrimmed || null,
          },
          include: {
            student: {
              select: {
                user: { select: { name: true, email: true } },
                studentNumber: true,
              },
            },
          },
        });

    if (company?.supervisorId && company.supervisorId !== userId) {
      try {
        await notificationService.createNotification({
          userId: company.supervisorId,
          title: 'No-work day reported',
          message: `${student.user.name} reported no OJT work on ${dateKey} (${
            reason as string
          }). Please review in Attendance → No-work reports.`,
          type: NotificationType.ATTENDANCE,
          link: '/industry-partner/attendance',
        });
      } catch (e) {
        console.warn('[NoWorkNotice] notification failed', e);
      }
    }

    res.status(201).json({ notice });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return res.status(409).json({ message: 'A notice for this date already exists.' });
    }
    console.error('createNoWorkNotice', error);
    res.status(500).json({ message: 'Failed to create notice' });
  }
};

export const listMyNoWorkNotices = async (req: AuthRequest, res: Response) => {
  try {
    const student = await prisma.student.findUnique({
      where: { userId: req.user!.id },
      select: { id: true },
    });
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    const notices = await prisma.attendanceNoWorkNotice.findMany({
      where: { studentId: student.id },
      orderBy: { dateKey: 'desc' },
    });

    res.json({ notices });
  } catch (error) {
    console.error('listMyNoWorkNotices', error);
    res.status(500).json({ message: 'Failed to load notices' });
  }
};

export const listSupervisorNoWorkNotices = async (req: AuthRequest, res: Response) => {
  try {
    const statusQuery = req.query.status as string | undefined;
    const statusFilter =
      statusQuery && ['PENDING', 'APPROVED', 'REJECTED'].includes(statusQuery)
        ? (statusQuery as AttendanceNoWorkStatus)
        : undefined;

    const companies = await prisma.company.findMany({
      where: { supervisorId: req.user!.id },
      select: { id: true },
    });
    const companyIds = companies.map((c) => c.id);
    if (companyIds.length === 0) {
      return res.json({ notices: [] });
    }

    const notices = await prisma.attendanceNoWorkNotice.findMany({
      where: {
        student: { companyId: { in: companyIds } },
        ...(statusFilter ? { status: statusFilter } : {}),
      },
      include: {
        student: {
          select: {
            id: true,
            studentNumber: true,
            user: { select: { name: true, email: true } },
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }],
    });

    res.json({ notices });
  } catch (error) {
    console.error('listSupervisorNoWorkNotices', error);
    res.status(500).json({ message: 'Failed to load notices' });
  }
};

export const reviewNoWorkNotice = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, supervisorRemarks } = req.body as {
      status?: string;
      supervisorRemarks?: string;
    };

    if (status !== 'APPROVED' && status !== 'REJECTED') {
      return res.status(400).json({ message: 'status must be APPROVED or REJECTED' });
    }
    if (status === 'REJECTED') {
      const r =
        typeof supervisorRemarks === 'string' ? supervisorRemarks.trim() : '';
      if (!r) {
        return res
          .status(400)
          .json({ message: 'Please provide a reason when rejecting' });
      }
    }

    const companies = await prisma.company.findMany({
      where: { supervisorId: req.user!.id },
      select: { id: true },
    });
    const companyIds = companies.map((c) => c.id);

    const notice = await prisma.attendanceNoWorkNotice.findFirst({
      where: {
        id,
        student: { companyId: { in: companyIds } },
      },
      include: {
        student: {
          select: {
            userId: true,
            user: { select: { name: true } },
          },
        },
      },
    });

    if (!notice) {
      return res.status(404).json({ message: 'Notice not found' });
    }
    if (notice.status !== 'PENDING') {
      return res.status(400).json({ message: 'This notice has already been reviewed' });
    }

    const updated = await prisma.attendanceNoWorkNotice.update({
      where: { id },
      data: {
        status: status as AttendanceNoWorkStatus,
        reviewedById: req.user!.id,
        reviewedAt: new Date(),
        supervisorRemarks:
          typeof supervisorRemarks === 'string'
            ? supervisorRemarks.trim().slice(0, 2000) || null
            : null,
      },
      include: {
        student: {
          select: {
            userId: true,
            user: { select: { name: true } },
          },
        },
      },
    });

    try {
      await notificationService.createNotification({
        userId: notice.student.userId,
        title:
          status === 'APPROVED'
            ? 'No-work day approved'
            : 'No-work day not approved',
        message:
          status === 'APPROVED'
            ? `Your supervisor approved your no-work report for ${notice.dateKey}.`
            : `Your supervisor did not approve your no-work report for ${notice.dateKey}. Check remarks in Attendance.`,
        type: NotificationType.ATTENDANCE,
        link: '/student/attendance',
      });
    } catch (e) {
      console.warn('[NoWorkNotice] student notification failed', e);
    }

    res.json({ notice: updated });
  } catch (error) {
    console.error('reviewNoWorkNotice', error);
    res.status(500).json({ message: 'Failed to update notice' });
  }
};
