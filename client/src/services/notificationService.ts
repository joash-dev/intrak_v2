import api from "./api";

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: "DOCUMENT" | "ATTENDANCE" | "SYSTEM" | "ALERT" | "OTHER" | string;
  link?: string | null;
  read: boolean;
  createdAt: string;
}

class NotificationService {
  async getNotifications(params?: {
    limit?: number;
    unreadOnly?: boolean;
  }): Promise<NotificationItem[]> {
    const response = await api.get("/notifications", {
      params: {
        limit: params?.limit,
        unreadOnly: params?.unreadOnly,
      },
    });

    return response.data.notifications ?? [];
  }

  async markAsRead(notificationId: string): Promise<void> {
    await api.patch(`/notifications/${notificationId}/read`);
  }

  async markAllAsRead(): Promise<void> {
    await api.patch("/notifications/mark-all/read");
  }
}

export const notificationService = new NotificationService();
