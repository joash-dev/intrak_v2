/**
 * Error handling utilities for controllers
 * Provides type-safe error handling to replace `catch (error: any)` patterns
 */

import { Response } from 'express';

/**
 * Extracts error message from unknown error type
 * @param error - The caught error (unknown type)
 * @returns A safe error message string
 */
export function getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        return error.message;
    }
    if (typeof error === 'string') {
        return error;
    }
    return 'An unexpected error occurred';
}

/**
 * Handles controller errors with consistent response format
 * @param res - Express response object
 * @param error - The caught error
 * @param statusCode - HTTP status code (default: 500)
 * @param logPrefix - Optional prefix for console logging
 */
export function handleControllerError(
    res: Response,
    error: unknown,
    statusCode: number = 500,
    logPrefix?: string
): void {
    const message = getErrorMessage(error);

    if (logPrefix) {
        console.error(`${logPrefix}:`, error);
    } else {
        console.error('Controller error:', error);
    }

    res.status(statusCode).json({ message });
}

/**
 * Type guard to check if error has a specific property
 */
export function isErrorWithCode(error: unknown): error is Error & { code: string } {
    return error instanceof Error && 'code' in error;
}

/**
 * Type guard for Prisma errors
 */
export function isPrismaError(error: unknown): error is Error & { code: string; meta?: unknown } {
    return error instanceof Error && 'code' in error && typeof (error as any).code === 'string';
}
