import { Response } from 'express';
import { PrismaClient, Role, NotificationType } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { notificationService } from '../services/notification.service';

const prisma = new PrismaClient();

export const getAnnouncements = async (req: AuthRequest, res: Response) => {
  try {
    const { audience } = req.query;

    const where: any = {};
    if (audience) {
      where.OR = [{ audience: audience }, { audience: 'ALL' }];
    }

    const announcements = await prisma.announcement.findMany({
      where,
      include: {
        createdBy: { select: { name: true, role: true } },
        _count: { select: { announcementViews: true } },
      },
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }]
    });

    // Map to include unique view count from AnnouncementView
    const mapped = announcements.map((a) => ({
      ...a,
      views: a._count.announcementViews,
      _count: undefined,
    }));

    res.json({ announcements: mapped });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch announcements', error });
  }
};

export const getAnnouncementById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const announcement = await prisma.announcement.findUnique({
      where: { id },
      include: {
        createdBy: { select: { name: true, role: true } },
        _count: { select: { announcementViews: true } },
      }
    });

    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    res.json({
      announcement: {
        ...announcement,
        views: announcement._count.announcementViews,
        _count: undefined,
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch announcement', error });
  }
};

export const createAnnouncement = async (req: AuthRequest, res: Response) => {
  try {
    const { title, content, audience, isPinned, type } = req.body;

    // Backward compatibility: older clients may send INDUSTRY_PARTNERS, but DB enum is PARTNERS.
    const normalizedAudience =
      audience === 'INDUSTRY_PARTNERS' ? 'PARTNERS' : (audience || 'ALL');

    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        audience: normalizedAudience,
        type: type || 'info',
        isPinned: isPinned || false,
        createdById: req.user!.id
      },
      include: { createdBy: { select: { name: true, role: true } } }
    });

    const audienceRoleMap: Record<string, Role[]> = {
      ALL: [Role.ADMIN, Role.COORDINATOR, Role.INSTRUCTOR, Role.STUDENT, Role.INDUSTRY_PARTNER],
      STUDENTS: [Role.STUDENT],
      COORDINATORS: [Role.COORDINATOR],
      INSTRUCTORS: [Role.INSTRUCTOR],
      PARTNERS: [Role.INDUSTRY_PARTNER],
    };

    const targetRoles =
      audienceRoleMap[normalizedAudience] || audienceRoleMap.ALL;

    if (targetRoles.length > 0) {
      const usersToNotify = await prisma.user.findMany({
        where: { role: { in: targetRoles } },
        select: { id: true },
      });

      if (usersToNotify.length > 0) {
        await Promise.all(
          usersToNotify.map((user) =>
            notificationService.createNotification({
              userId: user.id,
              title,
              message: content,
              type: NotificationType.SYSTEM,
              link: null,
            })
          )
        );
      }
    }

    res.status(201).json({ announcement });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create announcement', error });
  }
};

export const updateAnnouncement = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, content, audience, isPinned, type } = req.body;

    const data: any = {};
    if (title !== undefined) data.title = title;
    if (content !== undefined) data.content = content;
    if (audience !== undefined) data.audience = audience;
    if (isPinned !== undefined) data.isPinned = isPinned;
    if (type !== undefined) data.type = type;

    const announcement = await prisma.announcement.update({
      where: { id },
      data,
      include: { createdBy: { select: { name: true, role: true } } }
    });

    res.json({ announcement });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update announcement', error });
  }
};

export const deleteAnnouncement = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.announcement.delete({ where: { id } });
    res.json({ message: 'Announcement deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete announcement', error });
  }
};

export const trackAnnouncementView = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Upsert — only one view per user per announcement
    await prisma.announcementView.upsert({
      where: {
        announcementId_userId: { announcementId: id, userId },
      },
      update: { viewedAt: new Date() },
      create: { announcementId: id, userId },
    });

    res.json({ message: 'View tracked successfully' });
  } catch (error) {
    console.error('Error tracking announcement view:', error);
    res.status(500).json({ message: 'Failed to track announcement view', error });
  }
};
