/**
 * Development-only logger utility
 * In production, these logs will be silently ignored
 */

const isDev = import.meta.env.DEV || import.meta.env.MODE === 'development';

export const devLog = {
    log: (...args: unknown[]): void => {
        if (isDev) console.log(...args);
    },
    warn: (...args: unknown[]): void => {
        if (isDev) console.warn(...args);
    },
    error: (...args: unknown[]): void => {
        // Always log errors, even in production (but could be sent to error tracking service)
        console.error(...args);
    },
    info: (...args: unknown[]): void => {
        if (isDev) console.info(...args);
    },
    debug: (...args: unknown[]): void => {
        if (isDev) console.debug(...args);
    },
};

export default devLog;
