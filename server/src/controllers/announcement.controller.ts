import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

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
      include: { createdBy: { select: { name: true, role: true } } },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ announcements });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch announcements', error });
  }
};

export const getAnnouncementById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const announcement = await prisma.announcement.findUnique({
      where: { id },
      include: { createdBy: { select: { name: true, role: true } } }
    });

    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    res.json({ announcement });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch announcement', error });
  }
};

export const createAnnouncement = async (req: AuthRequest, res: Response) => {
  try {
    const { title, content, audience } = req.body;

    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        audience: audience || 'ALL',
        createdById: req.user!.id
      },
      include: { createdBy: { select: { name: true, role: true } } }
    });

    res.status(201).json({ announcement });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create announcement', error });
  }
};

export const updateAnnouncement = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, content, audience } = req.body;

    const announcement = await prisma.announcement.update({
      where: { id },
      data: { title, content, audience }
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
    
    // Increment the view count for the announcement
    const announcement = await prisma.announcement.update({
      where: { id },
      data: {
        views: {
          increment: 1
        }
      },
      select: {
        id: true,
        title: true,
        views: true
      }
    });

    res.json({ message: 'View tracked successfully', announcement });
  } catch (error) {
    console.error('Error tracking announcement view:', error);
    res.status(500).json({ message: 'Failed to track announcement view', error });
  }
};