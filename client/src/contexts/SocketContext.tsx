import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { socketService } from '../services/socketService';

const getStoredAuthToken = (): string | null =>
    localStorage.getItem('accessToken') || localStorage.getItem('token');

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

    const connect = useCallback(() => {
        const token = getStoredAuthToken();
        if (!token) {
            return;
        }

        if (socketService.getSocket()?.connected) {
            setSocket(socketService.getSocket());
            setIsConnected(true);
            return;
        }

        socketService.disconnect();
        const newSocket = socketService.connect(token);
        setSocket(newSocket);

        newSocket.off('connect');
        newSocket.off('disconnect');
        newSocket.on('connect', () => {
            setIsConnected(true);
        });
        newSocket.on('disconnect', () => {
            setIsConnected(false);
        });
    }, []);

    const disconnect = () => {
        socketService.disconnect();
        setSocket(null);
        setIsConnected(false);
    };

    useEffect(() => {
        connect();

        const onTokenChanged = () => {
            connect();
        };
        window.addEventListener('intrak:auth-token-changed', onTokenChanged);

        return () => {
            window.removeEventListener('intrak:auth-token-changed', onTokenChanged);
            disconnect();
        };
    }, [connect]);

    const value: SocketContextType = {
        socket,
        isConnected,
        connect,
        disconnect,
    };

    return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};
