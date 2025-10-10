import api from './api';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  audience: 'ALL' | 'STUDENTS' | 'COORDINATORS' | 'INSTRUCTORS' | 'INDUSTRY_PARTNERS';
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    name: string;
    role: string;
  };
  // Additional fields for display
  type?: 'info' | 'warning' | 'success' | 'urgent';
  isPinned?: boolean;
  views?: number;
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

  // Transform API data to match display format
  transformAnnouncement(announcement: any): Announcement {
    return {
      ...announcement,
      message: announcement.content,
      createdDate: announcement.createdAt,
      type: this.determineTypeFromContent(announcement.content, announcement.title),
      isPinned: false, // This would need to be added to the backend schema
      views: announcement.views || 0, // Real views count from database
    };
  }

  // Track a view for an announcement
  async trackView(announcementId: string): Promise<void> {
    try {
      await api.post(`/announcements/${announcementId}/view`);
    } catch (error) {
      // Don't throw error for view tracking failures to avoid disrupting user experience
      console.warn('Failed to track announcement view:', error);
    }
  }

  // Determine announcement type based on content and title
  private determineTypeFromContent(content: string, title: string): 'info' | 'warning' | 'success' | 'urgent' {
    const text = (title + ' ' + content).toLowerCase();
    
    if (text.includes('urgent') || text.includes('emergency') || text.includes('immediate')) {
      return 'urgent';
    }
    if (text.includes('warning') || text.includes('deadline') || text.includes('late')) {
      return 'warning';
    }
    if (text.includes('congratulations') || text.includes('success') || text.includes('completed')) {
      return 'success';
    }
    return 'info';
  }

  // Calculate announcement stats
  calculateStats(announcements: Announcement[]): AnnouncementStats {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
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

  // Format date for display
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  // Format date and time for display
  formatDateTime(dateString: string): string {
    return new Date(dateString).toLocaleString();
  }
}

export const announcementService = new AnnouncementService();
