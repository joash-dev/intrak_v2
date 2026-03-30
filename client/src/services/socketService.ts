import { io, Socket } from 'socket.io-client';
import { devLog } from '../utils/devLog';

// Event types matching backend
export const SOCKET_EVENTS = {
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

    STUDENT_PORTAL_SYNC: 'student:portal:sync',

    ERROR: 'error',
} as const;

class SocketService {
    private socket: Socket | null = null;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;

    connect(token: string): Socket {
        if (this.socket?.connected) {
            devLog.log('Socket already connected');
            return this.socket;
        }

        // Resolve server URL (same logic as API client)
        let serverUrl = import.meta.env.VITE_API_URL || '';

        // Remove /api suffix if present (Socket.IO doesn't need it)
        if (serverUrl.endsWith('/api')) {
            serverUrl = serverUrl.replace('/api', '');
        }

        // Runtime detection for production
        if (!serverUrl && typeof window !== 'undefined') {
            const hostname = window.location.hostname;
            if (hostname === 'intrak.site' || hostname === 'www.intrak.site' || hostname === 'intrak.onrender.com') {
                serverUrl = window.location.origin;
            } else if (hostname !== 'localhost' && hostname !== '127.0.0.1' && !hostname.includes('192.168')) {
                serverUrl = window.location.origin;
            } else {
                serverUrl = 'http://localhost:5000';
            }
        }

        if (!serverUrl) {
            serverUrl = 'http://localhost:5000';
        }

        this.socket = io(serverUrl, {
            auth: { token },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: this.maxReconnectAttempts,
        });

        this.setupEventListeners();

        return this.socket;
    }

    private setupEventListeners() {
        if (!this.socket) return;

        this.socket.on('connect', () => {
            devLog.log('✅ Socket connected:', this.socket?.id);
            this.reconnectAttempts = 0;
        });

        this.socket.on('disconnect', (reason) => {
            devLog.log('❌ Socket disconnected:', reason);
        });

        this.socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error.message);
            this.reconnectAttempts++;

            if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                console.error('Max reconnection attempts reached');
            }
        });

        this.socket.on('reconnect', (attemptNumber) => {
            devLog.log(`🔄 Socket reconnected after ${attemptNumber} attempts`);
            this.reconnectAttempts = 0;
        });

        this.socket.on(SOCKET_EVENTS.ERROR, (error) => {
            console.error('Socket error:', error);
        });
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            devLog.log('Socket disconnected manually');
        }
    }

    getSocket(): Socket | null {
        return this.socket;
    }

    isConnected(): boolean {
        return this.socket?.connected || false;
    }

    // Subscribe to an event
    on(event: string, callback: (...args: any[]) => void) {
        this.socket?.on(event, callback);
    }

    // Unsubscribe from an event
    off(event: string, callback?: (...args: any[]) => void) {
        if (callback) {
            this.socket?.off(event, callback);
        } else {
            this.socket?.off(event);
        }
    }

    // Emit an event
    emit(event: string, data?: any) {
        this.socket?.emit(event, data);
    }

    // Join a room
    joinRoom(roomName: string) {
        this.socket?.emit(SOCKET_EVENTS.JOIN_ROOM, roomName);
    }

    // Leave a room
    leaveRoom(roomName: string) {
        this.socket?.emit(SOCKET_EVENTS.LEAVE_ROOM, roomName);
    }
}

// Export singleton instance
export const socketService = new SocketService();
