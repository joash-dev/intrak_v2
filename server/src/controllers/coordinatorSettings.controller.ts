import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

const DEFAULT_SETTINGS = {
  autoApproveDocuments: false,
  requireDocumentReview: true,
  attendanceReminderTime: '09:00',
  defaultAnnouncementAudience: 'ALL',
  enableBulkOperations: true,
  showAdvancedMetrics: false,
  notificationFrequency: 'immediate',
};

export const getCoordinatorSettings = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user || (user.role !== 'COORDINATOR' && user.role !== 'ADMIN')) {
      return res.status(403).json({ message: 'Access denied' });
    }

    let settings = await prisma.coordinatorSettings.findUnique({
      where: { userId },
    });

    if (!settings) {
      settings = await prisma.coordinatorSettings.create({
        data: {
          userId,
          ...DEFAULT_SETTINGS,
        },
      });
    }

    res.json({ settings });
  } catch (error: any) {
    console.error('Error fetching coordinator settings:', error);
    res.status(500).json({
      message: 'Failed to fetch coordinator settings',
      error: error.message,
    });
  }
};

export const updateCoordinatorSettings = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user || (user.role !== 'COORDINATOR' && user.role !== 'ADMIN')) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const {
      autoApproveDocuments,
      requireDocumentReview,
      attendanceReminderTime,
      defaultAnnouncementAudience,
      enableBulkOperations,
      showAdvancedMetrics,
      notificationFrequency,
    } = req.body;

    if (typeof autoApproveDocuments !== 'boolean') {
      return res.status(400).json({ message: 'autoApproveDocuments must be a boolean' });
    }

    if (typeof requireDocumentReview !== 'boolean') {
      return res.status(400).json({ message: 'requireDocumentReview must be a boolean' });
    }

    if (
      typeof attendanceReminderTime !== 'string' ||
      !/^\d{2}:\d{2}$/.test(attendanceReminderTime)
    ) {
      return res.status(400).json({ message: 'attendanceReminderTime must be in HH:MM format' });
    }

    if (
      defaultAnnouncementAudience &&
      !['ALL', 'STUDENTS', 'COORDINATORS', 'INSTRUCTORS', 'INDUSTRY_PARTNERS'].includes(defaultAnnouncementAudience)
    ) {
      return res.status(400).json({ message: 'defaultAnnouncementAudience is invalid' });
    }

    if (
      notificationFrequency &&
      !['immediate', 'daily', 'weekly'].includes(notificationFrequency)
    ) {
      return res.status(400).json({ message: 'notificationFrequency is invalid' });
    }

    if (
      enableBulkOperations !== undefined &&
      typeof enableBulkOperations !== 'boolean'
    ) {
      return res.status(400).json({ message: 'enableBulkOperations must be a boolean' });
    }

    if (
      showAdvancedMetrics !== undefined &&
      typeof showAdvancedMetrics !== 'boolean'
    ) {
      return res.status(400).json({ message: 'showAdvancedMetrics must be a boolean' });
    }

    const payload = {
      autoApproveDocuments,
      requireDocumentReview: autoApproveDocuments ? false : requireDocumentReview,
      attendanceReminderTime,
      defaultAnnouncementAudience:
        defaultAnnouncementAudience || DEFAULT_SETTINGS.defaultAnnouncementAudience,
      enableBulkOperations:
        enableBulkOperations ?? DEFAULT_SETTINGS.enableBulkOperations,
      showAdvancedMetrics:
        showAdvancedMetrics ?? DEFAULT_SETTINGS.showAdvancedMetrics,
      notificationFrequency:
        notificationFrequency || DEFAULT_SETTINGS.notificationFrequency,
    };

    const settings = await prisma.coordinatorSettings.upsert({
      where: { userId },
      update: payload,
      create: {
        userId,
        ...DEFAULT_SETTINGS,
        ...payload,
      },
    });

    res.json({ settings });
  } catch (error: any) {
    console.error('Error updating coordinator settings:', error);
    res.status(500).json({
      message: 'Failed to update coordinator settings',
      error: error.message,
    });
  }
};
