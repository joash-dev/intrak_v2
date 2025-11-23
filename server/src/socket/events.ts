// Socket.IO Event Types and Interfaces

export interface SocketUser {
    id: string;
    role: 'STUDENT' | 'COORDINATOR' | 'SUPERVISOR' | 'INSTRUCTOR' | 'ADMIN';
    name: string;
}

// Document Events
export interface DocumentUploadedPayload {
    documentId: string;
    studentId: string;
    studentName: string;
    documentType: string;
    fileName: string;
    uploadedAt: string;
}

export interface DocumentStatusChangedPayload {
    documentId: string;
    studentId: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    reviewedBy?: string;
    reviewedAt?: string;
    comments?: string;
}

// Profile Events
export interface ProfileUpdatedPayload {
    userId: string;
    name?: string;
    email?: string;
    phone?: string;
    updatedAt: string;
}

export interface ProfilePhotoChangedPayload {
    userId: string;
    photoUrl: string;
    updatedAt: string;
}

// Attendance Events
export interface AttendanceLoggedPayload {
    attendanceId: string;
    studentId: string;
    studentName: string;
    date: string;
    timeIn: string;
    timeOut?: string;
    hoursRendered?: number;
    supervisorId?: string;
}

export interface AttendanceUpdatedPayload {
    attendanceId: string;
    studentId: string;
    timeOut?: string;
    hoursRendered?: number;
    updatedAt: string;
}

// Announcement Events
export interface AnnouncementCreatedPayload {
    announcementId: string;
    title: string;
    content: string;
    createdBy: string;
    createdByName: string;
    targetRoles: string[];
    createdAt: string;
}

// Notification Events
export interface NotificationPayload {
    notificationId: string;
    userId: string;
    type: string;
    title: string;
    message: string;
    link?: string;
    createdAt: string;
}

// Socket Event Names
export const SOCKET_EVENTS = {
    // Connection
    CONNECTION: 'connection',
    DISCONNECT: 'disconnect',
    JOIN_ROOM: 'join:room',
    LEAVE_ROOM: 'leave:room',

    // Documents
    DOCUMENT_UPLOADED: 'document:uploaded',
    DOCUMENT_STATUS_CHANGED: 'document:status:changed',

    // Profile
    PROFILE_UPDATED: 'profile:updated',
    PROFILE_PHOTO_CHANGED: 'profile:photo:changed',

    // Attendance
    ATTENDANCE_LOGGED: 'attendance:logged',
    ATTENDANCE_UPDATED: 'attendance:updated',

    // Announcements
    ANNOUNCEMENT_CREATED: 'announcement:created',

    // Notifications
    NOTIFICATION_NEW: 'notification:new',

    // Errors
    ERROR: 'error',
} as const;

// Room naming conventions
export const getRoomName = {
    user: (userId: string) => `user:${userId}`,
    role: (role: string) => `role:${role.toLowerCase()}`,
    supervisor: (supervisorId: string) => `supervisor:${supervisorId}:students`,
    company: (companyId: string) => `company:${companyId}`,
};
