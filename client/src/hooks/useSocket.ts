import { useEffect, useRef } from 'react';
import { socketService, SOCKET_EVENTS } from '../services/socketService';

interface UseSocketOptions {
    event: string;
    callback: (...args: any[]) => void;
    enabled?: boolean;
}

/**
 * React hook for subscribing to Socket.IO events
 * Automatically handles cleanup on unmount
 */
export const useSocket = ({ event, callback, enabled = true }: UseSocketOptions) => {
    const callbackRef = useRef(callback);

    // Update callback ref when it changes
    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    useEffect(() => {
        if (!enabled) return;

        const socket = socketService.getSocket();
        if (!socket) {
            console.warn('Socket not connected. Call socketService.connect() first.');
            return;
        }

        // Wrapper function to use the latest callback
        const eventHandler = (...args: any[]) => {
            callbackRef.current(...args);
        };

        socket.on(event, eventHandler);

        return () => {
            socket.off(event, eventHandler);
        };
    }, [event, enabled]);
};

/**
 * Hook for subscribing to multiple socket events
 */
export const useSocketEvents = (
    events: Array<{ event: string; callback: (...args: any[]) => void }>,
    enabled = true
) => {
    useEffect(() => {
        if (!enabled) return;

        const socket = socketService.getSocket();
        if (!socket) {
            console.warn('Socket not connected. Call socketService.connect() first.');
            return;
        }

        // Subscribe to all events
        events.forEach(({ event, callback }) => {
            socket.on(event, callback);
        });

        // Cleanup
        return () => {
            events.forEach(({ event, callback }) => {
                socket.off(event, callback);
            });
        };
    }, [events, enabled]);
};

/**
 * Hook to get socket connection status
 */
export const useSocketConnection = () => {
    return {
        isConnected: socketService.isConnected(),
        socket: socketService.getSocket(),
    };
};

export { SOCKET_EVENTS };
