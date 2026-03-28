import { NotificationType } from '@prisma/client';
import { prisma } from '../config/database';
import { emailService } from './email.service';

export interface CreateNotificationInput {
  userId: string;
  title: string;
  message: string;
  type?: NotificationType;
  link?: string | null;
}

export const notificationService = {
  async createNotification(input: CreateNotificationInput) {
    const { userId, title, message, link = null, type = NotificationType.OTHER } = input;
    const looksLikeMessageNotification =
      title.toLowerCase().includes('new message') ||
      (link || '').toLowerCase().includes('/messages');
    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        link,
        type,
      },
    });

    // Best-effort email mirror for in-app notifications.
    // Message notifications are throttled to once per recipient per day.
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true, active: true },
      });

      if (user?.active && user.email) {
        let shouldSendEmail = true;

        if (looksLikeMessageNotification) {
          const dayStart = new Date();
          dayStart.setHours(0, 0, 0, 0);

          const sentEarlierToday = await prisma.notification.findFirst({
            where: {
              userId,
              id: { not: notification.id },
              createdAt: { gte: dayStart },
              OR: [
                { title: { contains: 'New Message', mode: 'insensitive' } },
                { link: { contains: '/messages', mode: 'insensitive' } },
              ],
            },
            select: { id: true },
          });

          shouldSendEmail = !sentEarlierToday;
        }

        if (shouldSendEmail) {
          await emailService.sendTypedNotificationEmail(user.email, {
            recipientName: user.name || 'User',
            title,
            message,
            linkPath: link,
            notificationType: type,
          });
        }
      }
    } catch (error) {
      console.error('[NotificationEmail] Failed to send notification email:', error);
    }

    return notification;
  },

  async markAsRead(notificationId: string, userId: string) {
    return prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId,
        read: false,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });
  },

  async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: {
        userId,
        read: false,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });
  },

  async getNotifications(userId: string, options?: { limit?: number; unreadOnly?: boolean }) {
    const { limit = 20, unreadOnly = false } = options || {};

    return prisma.notification.findMany({
      where: {
        userId,
        ...(unreadOnly ? { read: false } : {}),
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });
  },

  async deleteNotification(notificationId: string, userId: string) {
    return prisma.notification.deleteMany({
      where: {
        id: notificationId,
        userId, // Ensure user can only delete their own notifications
      },
    });
  },

  async deleteAllNotifications(userId: string) {
    return prisma.notification.deleteMany({
      where: {
        userId,
      },
    });
  },
};
