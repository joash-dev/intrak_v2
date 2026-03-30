// Helper functions for emitting Socket.IO events from controllers
import { getSocketServer } from '../socket';
import { SOCKET_EVENTS } from '../socket/events';
import type {
    DocumentUploadedPayload,
    DocumentStatusChangedPayload,
    ProfileUpdatedPayload,
    ProfilePhotoChangedPayload,
    AttendanceLoggedPayload,
    AttendanceUpdatedPayload,
    AnnouncementCreatedPayload,
    NotificationPayload,
} from '../socket/events';

// Helper to safely get socket server (returns null if not initialized)
const getSocket = () => {
    try {
        return getSocketServer();
    } catch {
        return null;
    }
};

// Document Events
export const emitDocumentUploaded = (payload: DocumentUploadedPayload) => {
    const socket = getSocket();
    if (!socket) return;

    // Emit to coordinators
    socket.emitToRole('COORDINATOR', SOCKET_EVENTS.DOCUMENT_UPLOADED, payload);

    // Emit to the student
    socket.emitToUser(payload.studentId, SOCKET_EVENTS.DOCUMENT_UPLOADED, payload);
};

export const emitDocumentStatusChanged = (payload: DocumentStatusChangedPayload) => {
    const socket = getSocket();
    if (!socket) return;

    // Emit to the student
    socket.emitToUser(payload.studentId, SOCKET_EVENTS.DOCUMENT_STATUS_CHANGED, payload);

    // Emit to coordinators
    socket.emitToRole('COORDINATOR', SOCKET_EVENTS.DOCUMENT_STATUS_CHANGED, payload);
};

// Profile Events
export const emitProfileUpdated = (payload: ProfileUpdatedPayload) => {
    const socket = getSocket();
    if (!socket) return;

    // Emit to the user whose profile was updated
    socket.emitToUser(payload.userId, SOCKET_EVENTS.PROFILE_UPDATED, payload);
};

export const emitProfilePhotoChanged = (payload: ProfilePhotoChangedPayload) => {
    const socket = getSocket();
    if (!socket) return;

    // Emit to the user whose photo was changed
    socket.emitToUser(payload.userId, SOCKET_EVENTS.PROFILE_PHOTO_CHANGED, payload);

    // Also emit to coordinators so they see updated photos in student lists
    socket.emitToRole('COORDINATOR', SOCKET_EVENTS.PROFILE_PHOTO_CHANGED, payload);
};

// Attendance Events
export const emitAttendanceLogged = (payload: AttendanceLoggedPayload) => {
    const socket = getSocket();
    if (!socket) return;

    // Emit to the student
    socket.emitToUser(payload.studentId, SOCKET_EVENTS.ATTENDANCE_LOGGED, payload);

    // Emit to supervisor if assigned
    if (payload.supervisorId) {
        socket.emitToUser(payload.supervisorId, SOCKET_EVENTS.ATTENDANCE_LOGGED, payload);
    }

    // Emit to coordinators
    socket.emitToRole('COORDINATOR', SOCKET_EVENTS.ATTENDANCE_LOGGED, payload);
};

export const emitAttendanceUpdated = (payload: AttendanceUpdatedPayload) => {
    const socket = getSocket();
    if (!socket) return;

    // Emit to the student
    socket.emitToUser(payload.studentId, SOCKET_EVENTS.ATTENDANCE_UPDATED, payload);
};

// Announcement Events
export const emitAnnouncementCreated = (payload: AnnouncementCreatedPayload) => {
    const socket = getSocket();
    if (!socket) return;

    // Emit to all target roles
    payload.targetRoles.forEach((role) => {
        socket.emitToRole(role, SOCKET_EVENTS.ANNOUNCEMENT_CREATED, payload);
    });
};

// Notification Events
export const emitNotification = (payload: NotificationPayload) => {
    const socket = getSocket();
    if (!socket) return;

    // Emit to the specific user
    socket.emitToUser(payload.userId, SOCKET_EVENTS.NOTIFICATION_NEW, payload);
};

/** Push student clients to refetch dashboard, applications, proposals without full reload */
export const emitStudentPortalSync = (userId: string, data?: { reason?: string }) => {
    const socket = getSocket();
    if (!socket) return;
    socket.emitToUser(userId, SOCKET_EVENTS.STUDENT_PORTAL_SYNC, data ?? {});
};
