import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { SOCKET_EVENTS, SocketUser, getRoomName } from './events';

interface AuthenticatedSocket extends Socket {
    user?: SocketUser;
}

export class SocketServer {
    private io: Server;

    constructor(httpServer: HTTPServer) {
        const envOrigins = (process.env.CORS_ORIGIN || '')
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);

        const allowedOrigins = new Set<string>([
            ...envOrigins,
            'http://localhost:5173',
            'http://127.0.0.1:5173',
            'https://intrak.site',
            'https://www.intrak.site',
        ]);

        this.io = new Server(httpServer, {
            cors: {
                // Allow known origins plus env-configured origins for Socket.IO handshake.
                origin: (origin, callback) => {
                    if (!origin) return callback(null, true);
                    if (allowedOrigins.has(origin)) return callback(null, true);
                    return callback(new Error(`Socket CORS blocked for origin: ${origin}`));
                },
                credentials: true,
            },
            pingTimeout: 60000,
            pingInterval: 25000,
        });

        this.setupMiddleware();
        this.setupEventHandlers();
    }

    private setupMiddleware() {
        // Authentication middleware
        this.io.use(async (socket: AuthenticatedSocket, next) => {
            try {
                const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

                if (!token) {
                    return next(new Error('Authentication token required'));
                }

                const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

                socket.user = {
                    id: decoded.userId,
                    role: decoded.role,
                    name: decoded.name || 'Unknown',
                };

                next();
            } catch (error) {
                console.error('Socket authentication error:', error);
                next(new Error('Invalid authentication token'));
            }
        });
    }

    private setupEventHandlers() {
        this.io.on(SOCKET_EVENTS.CONNECTION, (socket: AuthenticatedSocket) => {
            if (!socket.user) return;

            console.log(`[Socket] Connected: ${socket.user.name} (${socket.user.role}) - ${socket.id}`);

            // Auto-join user to their personal room
            socket.join(getRoomName.user(socket.user.id));

            // Auto-join user to their role room
            socket.join(getRoomName.role(socket.user.role));

            // Handle manual room joining
            socket.on(SOCKET_EVENTS.JOIN_ROOM, (roomName: string) => {
                socket.join(roomName);
                console.log(`User ${socket.user?.name} joined room: ${roomName}`);
            });

            // Handle room leaving
            socket.on(SOCKET_EVENTS.LEAVE_ROOM, (roomName: string) => {
                socket.leave(roomName);
                console.log(`User ${socket.user?.name} left room: ${roomName}`);
            });

            // Handle disconnection
            socket.on(SOCKET_EVENTS.DISCONNECT, () => {
                console.log(`[Socket] Disconnected: ${socket.user?.name} - ${socket.id}`);
            });
        });
    }

    // Emit to specific user
    public emitToUser(userId: string, event: string, data: any) {
        this.io.to(getRoomName.user(userId)).emit(event, data);
    }

    // Emit to all users with specific role
    public emitToRole(role: string, event: string, data: any) {
        this.io.to(getRoomName.role(role)).emit(event, data);
    }

    // Emit to specific room
    public emitToRoom(roomName: string, event: string, data: any) {
        this.io.to(roomName).emit(event, data);
    }

    // Emit to all connected clients
    public emitToAll(event: string, data: any) {
        this.io.emit(event, data);
    }

    // Get Socket.IO instance for direct access if needed
    public getIO(): Server {
        return this.io;
    }
}

// Singleton instance
let socketServer: SocketServer | null = null;

export const initializeSocketServer = (httpServer: HTTPServer): SocketServer => {
    if (!socketServer) {
        socketServer = new SocketServer(httpServer);
        console.log('[Socket] Socket.IO server initialized');
    }
    return socketServer;
};

export const getSocketServer = (): SocketServer => {
    if (!socketServer) {
        throw new Error('Socket server not initialized. Call initializeSocketServer first.');
    }
    return socketServer;
};
