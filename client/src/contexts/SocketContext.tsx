import React, { createContext, useContext, useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import { socketService } from '../services/socketService';

interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
    connect: () => void;
    disconnect: () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocketContext = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocketContext must be used within SocketProvider');
    }
    return context;
};

interface SocketProviderProps {
    children: React.ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    const connect = () => {
        const token = localStorage.getItem('token');
        if (!token) {
            console.warn('No authentication token found. Cannot connect to socket.');
            return;
        }

        const newSocket = socketService.connect(token);
        setSocket(newSocket);

        newSocket.on('connect', () => {
            setIsConnected(true);
        });

        newSocket.on('disconnect', () => {
            setIsConnected(false);
        });
    };

    const disconnect = () => {
        socketService.disconnect();
        setSocket(null);
        setIsConnected(false);
    };

    // Auto-connect when token is available
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token && !socket) {
            connect();
        }

        // Cleanup on unmount
        return () => {
            disconnect();
        };
    }, []);

    const value: SocketContextType = {
        socket,
        isConnected,
        connect,
        disconnect,
    };

    return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};
