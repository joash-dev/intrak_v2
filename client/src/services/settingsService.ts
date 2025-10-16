import api from './api';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  emergencyContact?: string;
  emergencyName?: string;
}

export interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface NotificationPreferences {
  emailDocuments: boolean;
  emailAttendance: boolean;
  emailAnnouncements: boolean;
  pushNotifications: boolean;
  smsAlerts: boolean;
}

export interface AppPreferences {
  language: string;
  dateFormat: string;
  timeFormat: string;
  theme: 'light' | 'dark' | 'auto';
}

class SettingsService {
  // Get current user profile
  async getCurrentUserProfile(): Promise<UserProfile> {
    try {
      // Try to get from localStorage first (for coordinators)
      const userString = localStorage.getItem('user');
      if (userString) {
        const user = JSON.parse(userString);
        return {
          id: user.id || "",
          name: user.name || "Dr. Cruz",
          email: user.email || "coordinator@intrak.edu",
          phone: user.phone || "",
          emergencyContact: user.emergencyContact || "",
          emergencyName: user.emergencyName || "",
        };
      }
      
      // Fallback: try API endpoint for students
      const response = await api.get('/students/profile');
      return {
        id: response.data.id,
        name: response.data.name,
        email: response.data.email,
        phone: response.data.phone || "",
        emergencyContact: response.data.emergencyContact || "",
        emergencyName: response.data.emergencyName || "",
      };
    } catch (error) {
      // If API fails, return default coordinator profile
      return {
        id: "coordinator-1",
        name: "Dr. Cruz",
        email: "coordinator@intrak.edu",
        phone: "",
        emergencyContact: "",
        emergencyName: "",
      };
    }
  }

  // Update user profile
  async updateProfile(data: Partial<UserProfile>): Promise<UserProfile> {
    const userId = await this.getCurrentUserId();
    const response = await api.put(`/users/${userId}`, data);
    return response.data.user;
  }

  // Change password
  async changePassword(passwordData: PasswordChangeData): Promise<void> {
    try {
      console.log('🔐 SettingsService: Attempting password change...');
      console.log('🔐 SettingsService: Current token exists:', !!localStorage.getItem('accessToken'));
      
      const response = await api.put('/users/password/change', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      console.log('✅ SettingsService: Password change successful:', response.data);
    } catch (error: any) {
      console.error('❌ SettingsService: Error changing password:', error);
      console.error('❌ SettingsService: Error response:', error.response);
      console.error('❌ SettingsService: Error response data:', error.response?.data);
      console.error('❌ SettingsService: Error response status:', error.response?.status);
      
      // Extract the specific error message from the API response
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Failed to change password';
      
      console.error('❌ SettingsService: Final error message:', errorMessage);
      throw new Error(errorMessage);
    }
  }

  // Save notification preferences to localStorage (could be extended to save to server)
  saveNotificationPreferences(preferences: NotificationPreferences): void {
    localStorage.setItem('notificationPreferences', JSON.stringify(preferences));
  }

  // Load notification preferences from localStorage
  loadNotificationPreferences(): NotificationPreferences {
    const stored = localStorage.getItem('notificationPreferences');
    return stored ? JSON.parse(stored) : {
      emailDocuments: true,
      emailAttendance: true,
      emailAnnouncements: true,
      pushNotifications: true,
      smsAlerts: false,
    };
  }

  // Save app preferences to localStorage
  saveAppPreferences(preferences: AppPreferences): void {
    localStorage.setItem('appPreferences', JSON.stringify(preferences));
  }

  // Load app preferences from localStorage
  loadAppPreferences(): AppPreferences {
    const stored = localStorage.getItem('appPreferences');
    return stored ? JSON.parse(stored) : {
      language: 'en',
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12hr',
      theme: 'auto',
    };
  }

  // Apply theme to document
  applyTheme(theme: 'light' | 'dark' | 'auto'): void {
    const root = document.documentElement;
    
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      // Auto theme based on system preference
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }

  // Get current user ID from localStorage
  private async getCurrentUserId(): Promise<string> {
    const userString = localStorage.getItem('user');
    if (!userString) {
      throw new Error('User not found in localStorage');
    }
    const user = JSON.parse(userString);
    return user.id;
  }

  // Validate password strength
  validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Validate email format
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Validate phone number format (basic validation)
  validatePhone(phone: string): boolean {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  }

  // Upload profile photo to server
  async uploadProfilePhoto(file: File): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('photo', file);

      const response = await api.post('/users/profile-photo/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data.profilePhoto;
    } catch (error) {
      console.error('Error uploading profile photo:', error);
      throw error;
    }
  }

  // Get profile photo URL from server
  async getProfilePhoto(): Promise<string | null> {
    try {
      const response = await api.get('/users/profile-photo');
      return response.data.profilePhoto;
    } catch (error) {
      console.error('Error getting profile photo:', error);
      return null;
    }
  }

  // Remove profile photo from server
  async removeProfilePhoto(): Promise<void> {
    try {
      await api.delete('/users/profile-photo');
    } catch (error) {
      console.error('Error removing profile photo:', error);
      throw error;
    }
  }

  // Legacy methods for backward compatibility (now deprecated)
  saveProfilePhoto(photoDataUrl: string): void {
    console.warn('saveProfilePhoto with localStorage is deprecated. Use uploadProfilePhoto instead.');
    localStorage.setItem('profilePhoto', photoDataUrl);
  }

  loadProfilePhoto(): string | null {
    console.warn('loadProfilePhoto with localStorage is deprecated. Use getProfilePhoto instead.');
    return localStorage.getItem('profilePhoto');
  }

  removeProfilePhotoLocal(): void {
    localStorage.removeItem('profilePhoto');
  }
}

export const settingsService = new SettingsService();
