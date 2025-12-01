import { NotificationType } from '@prisma/client';
import { prisma } from '../config/database';

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

    return prisma.notification.create({
      data: {
        userId,
        title,
        message,
        link,
        type,
      },
    });
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
