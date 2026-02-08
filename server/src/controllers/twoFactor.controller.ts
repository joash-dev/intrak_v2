import { Request, Response } from 'express';
import { twoFactorService } from '../services/twoFactor.service';
import { prisma } from '../config/database';
import bcrypt from 'bcrypt';

interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: string;
        name: string;
    };
}

/**
 * Enable 2FA for the authenticated user
 */
export const enable2FA = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const result = await twoFactorService.enable2FA(userId);

        if (!result.success) {
            return res.status(400).json({ message: result.error });
        }

        // Return backup codes for user to save
        res.json({
            message: 'Two-factor authentication enabled successfully',
            backupCodes: result.backupCodes
        });
    } catch (error) {
        console.error('Error enabling 2FA:', error);
        res.status(500).json({ message: 'Failed to enable 2FA', error: (error instanceof Error ? error.message : String(error)) });
    }
};

/**
 * Disable 2FA for the authenticated admin user (requires password verification)
 */
export const disable2FA = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const { password } = req.body;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        if (!password) {
            return res.status(400).json({ message: 'Password is required to disable 2FA' });
        }

        // Verify password before disabling 2FA
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { passwordHash: true }
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isValidPassword = await bcrypt.compare(password, user.passwordHash);
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Invalid password' });
        }

        const result = await twoFactorService.disable2FA(userId);

        if (!result.success) {
            return res.status(400).json({ message: result.error });
        }

        res.json({ message: 'Two-factor authentication disabled successfully' });
    } catch (error) {
        console.error('Error disabling 2FA:', error);
        res.status(500).json({ message: 'Failed to disable 2FA', error: (error instanceof Error ? error.message : String(error)) });
    }
};

/**
 * Get 2FA status for the authenticated user
 */
export const get2FAStatus = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { twoFactorEnabled: true, role: true }
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Available for all users
        const isAvailable = true;
        const isEnabled = user.twoFactorEnabled;

        res.json({
            available: isAvailable,
            enabled: isEnabled
        });
    } catch (error) {
        console.error('Error getting 2FA status:', error);
        res.status(500).json({ message: 'Failed to get 2FA status', error: (error instanceof Error ? error.message : String(error)) });
    }
};

/**
 * Request 2FA OTP code during login (called when password is valid but 2FA is required)
 */
export const request2FACode = async (req: Request, res: Response) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        const result = await twoFactorService.sendOTPEmail(userId);

        if (!result.success) {
            return res.status(500).json({ message: result.error || 'Failed to send verification code' });
        }

        res.json({ message: 'Verification code sent to your email' });
    } catch (error) {
        console.error('Error requesting 2FA code:', error);
        res.status(500).json({ message: 'Failed to send verification code', error: (error instanceof Error ? error.message : String(error)) });
    }
};

/**
 * Verify 2FA OTP code during login and complete the login process
 */
export const verify2FACode = async (req: Request, res: Response) => {
    try {
        const { userId, code } = req.body;

        if (!userId || !code) {
            return res.status(400).json({ message: 'User ID and verification code are required' });
        }

        const result = await twoFactorService.verifyOTP(userId, code);

        if (!result.success) {
            return res.status(401).json({ message: result.error || 'Invalid verification code' });
        }

        // OTP verified successfully - now complete the login by issuing tokens
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true
            }
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Generate tokens
        const { generateTokens } = await import('../utils/jwt');
        const { accessToken, refreshToken } = generateTokens(user);

        // Save refresh token to database
        await prisma.refreshToken.create({
            data: {
                token: refreshToken,
                userId: user.id,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            }
        });

        // Handle Trusted Device
        if (req.body.trustDevice) {
            try {
                const crypto = await import('crypto');
                const token = crypto.randomBytes(32).toString('hex');

                await prisma.trustedDevice.create({
                    data: {
                        userId: user.id,
                        token,
                        userAgent: req.headers['user-agent'] || 'Unknown',
                        ipAddress: req.ip,
                        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
                    }
                });

                // Set secure cookie
                res.cookie('device_token', token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax', // Use lax for better compatibility
                    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
                });
                console.log('Device trusted successfully');
            } catch (error) {
                console.error('Failed to trust device:', error);
                // Don't fail the login if trusting fails
            }
        }

        // Log login activity
        const { auditLog } = await import('../services/audit.service');
        const { logActivity } = await import('./activity.controller');

        await auditLog(user.id, 'USER_LOGIN', { email: user.email, twoFactorVerified: true }, req);
        await logActivity({
            type: 'LOGIN',
            description: `${user.name} logged in with 2FA verification`,
            userId: user.id,
            userName: user.name,
            ipAddress: req.ip
        });

        console.log('2FA login completed successfully for:', user.email);

        res.json({
            verified: true,
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        console.error('Error verifying 2FA code:', error);
        res.status(500).json({ message: 'Verification failed', error: (error instanceof Error ? error.message : String(error)) });
    }
};

/**
 * Regenerate backup codes for the authenticated user
 */
export const regenerateBackupCodes = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const { password } = req.body;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        if (!password) {
            return res.status(400).json({ message: 'Password is required' });
        }

        // Verify password before regenerating codes
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { passwordHash: true }
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isValidPassword = await bcrypt.compare(password, user.passwordHash);
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Invalid password' });
        }

        const result = await twoFactorService.regenerateBackupCodes(userId);

        if (!result.success) {
            return res.status(400).json({ message: result.error });
        }

        res.json({
            message: 'Backup codes regenerated successfully',
            backupCodes: result.backupCodes
        });
    } catch (error) {
        console.error('Error regenerating backup codes:', error);
        res.status(500).json({ message: 'Failed to regenerate codes', error: (error instanceof Error ? error.message : String(error)) });
    }
};

/**
 * Verify backup code during login
 */
export const verifyBackupCode = async (req: Request, res: Response) => {
    try {
        const { userId, code } = req.body;

        if (!userId || !code) {
            return res.status(400).json({ message: 'User ID and backup code are required' });
        }

        const result = await twoFactorService.verifyBackupCode(userId, code);

        if (!result.success) {
            return res.status(401).json({ message: result.error || 'Invalid backup code' });
        }

        // Backup code verified - complete login
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true
            }
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Generate tokens
        const { generateTokens } = await import('../utils/jwt');
        const { accessToken, refreshToken } = generateTokens(user);

        // Save refresh token
        await prisma.refreshToken.create({
            data: {
                token: refreshToken,
                userId: user.id,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            }
        });

        // Log login activity
        const { auditLog } = await import('../services/audit.service');
        const { logActivity } = await import('./activity.controller');

        await auditLog(user.id, 'USER_LOGIN', { email: user.email, backupCodeUsed: true }, req);
        await logActivity({
            type: 'LOGIN',
            description: `${user.name} logged in using backup code`,
            userId: user.id,
            userName: user.name,
            ipAddress: req.ip
        });

        res.json({
            verified: true,
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        console.error('Error verifying backup code:', error);
        res.status(500).json({ message: 'Verification failed', error: (error instanceof Error ? error.message : String(error)) });
    }
};
