import api from './api';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  audience: 'ALL' | 'STUDENTS' | 'COORDINATORS' | 'INSTRUCTORS' | 'INDUSTRY_PARTNERS';
  type: 'info' | 'warning' | 'success' | 'urgent';
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    name: string;
    role: string;
  };
  isPinned: boolean;
  views: number;
  // Compat aliases
  createdDate?: string;
  message?: string;
}

export interface CreateAnnouncementRequest {
  title: string;
  content: string;
  audience: 'ALL' | 'STUDENTS' | 'COORDINATORS' | 'INSTRUCTORS' | 'INDUSTRY_PARTNERS';
  type?: 'info' | 'warning' | 'success' | 'urgent';
  isPinned?: boolean;
}

export interface AnnouncementStats {
  total: number;
  pinned: number;
  thisWeek: number;
  avgViews: number;
}

class AnnouncementService {
  // Get all announcements
  async getAnnouncements(): Promise<{ announcements: Announcement[] }> {
    const response = await api.get('/announcements');
    return response.data;
  }

  // Get announcement by ID
  async getAnnouncementById(id: string): Promise<{ announcement: Announcement }> {
    const response = await api.get(`/announcements/${id}`);
    return response.data;
  }

  // Create a new announcement
  async createAnnouncement(data: CreateAnnouncementRequest): Promise<{ announcement: Announcement }> {
    const response = await api.post('/announcements', data);
    return response.data;
  }

  // Update an announcement
  async updateAnnouncement(id: string, data: Partial<CreateAnnouncementRequest>): Promise<{ announcement: Announcement }> {
    const response = await api.put(`/announcements/${id}`, data);
    return response.data;
  }

  // Delete an announcement
  async deleteAnnouncement(id: string): Promise<void> {
    await api.delete(`/announcements/${id}`);
  }

  // Transform API data to match display format (type now from DB)
  transformAnnouncement(announcement: any): Announcement {
    return {
      ...announcement,
      message: announcement.content,
      createdDate: announcement.createdAt,
      type: announcement.type || 'info',
      isPinned: announcement.isPinned || false,
      views: announcement.views ?? 0,
    };
  }

  // Track a view for an announcement
  async trackView(announcementId: string): Promise<void> {
    try {
      await api.post(`/announcements/${announcementId}/view`);
    } catch (error) {
      // Don't throw for view tracking failures
      console.warn('Failed to track announcement view:', error);
    }
  }

  // Calculate announcement stats
  calculateStats(announcements: Announcement[]): AnnouncementStats {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 1000);

    const thisWeek = announcements.filter(a =>
      new Date(a.createdAt) >= weekAgo
    ).length;

    const avgViews = announcements.length > 0
      ? Math.round(announcements.reduce((sum, a) => sum + (a.views || 0), 0) / announcements.length)
      : 0;

    return {
      total: announcements.length,
      pinned: announcements.filter(a => a.isPinned).length,
      thisWeek,
      avgViews,
    };
  }

  // Format date for display — e.g. "Feb 23, 2026"
  formatDate(dateString: string): string {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  // Format date and time for display
  formatDateTime(dateString: string): string {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }
}

export const announcementService = new AnnouncementService();
