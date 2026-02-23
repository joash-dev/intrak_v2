import { Response } from 'express';
import crypto from 'crypto';
import { prisma } from '../config/database';
import { emailService } from '../services/email.service';
import { AuthRequest } from '../middleware/auth';

const VERIFICATION_EXPIRY_HOURS = 24;

/**
 * Send email verification link to user
 */
export const sendVerificationEmail = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, email: true, name: true, emailVerified: true }
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.emailVerified) {
            return res.status(400).json({ message: 'Email is already verified' });
        }

        // Generate verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + VERIFICATION_EXPIRY_HOURS * 60 * 60 * 1000);

        // Save token to database
        await prisma.user.update({
            where: { id: userId },
            data: {
                emailVerificationToken: verificationToken,
                emailVerificationExpires: expiresAt
            }
        });

        // Generate verification URL
        const clientUrl = process.env.CLIENT_URL || 'https://intrak.site';
        const verificationUrl = `${clientUrl}/verify-email?token=${verificationToken}`;

        // Send verification email
        const emailResult = await emailService.sendVerificationEmail(
            user.email,
            user.name,
            verificationUrl
        );

        if (!emailResult.success) {
            console.error('Failed to send verification email:', emailResult.error);
            return res.status(500).json({ message: 'Failed to send verification email' });
        }

        res.json({
            message: 'Verification email sent successfully',
            email: user.email
        });
    } catch (error) {
        console.error('Send verification email error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * Verify email with token
 */
export const verifyEmail = async (req: AuthRequest, res: Response) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({ message: 'Verification token is required' });
        }

        // Find user with this token
        const user = await prisma.user.findFirst({
            where: {
                emailVerificationToken: token,
                emailVerificationExpires: {
                    gt: new Date() // Token not expired
                }
            }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired verification token' });
        }

        // Mark email as verified and clear token
        await prisma.user.update({
            where: { id: user.id },
            data: {
                emailVerified: true,
                emailVerificationToken: null,
                emailVerificationExpires: null
            }
        });

        res.json({
            message: 'Email verified successfully',
            emailVerified: true
        });
    } catch (error) {
        console.error('Verify email error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * Check email verification status
 */
export const getVerificationStatus = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { emailVerified: true, email: true }
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            emailVerified: user.emailVerified,
            email: user.email
        });
    } catch (error) {
        console.error('Get verification status error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * Resend verification email (with rate limiting)
 */
export const resendVerificationEmail = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                emailVerified: true,
                emailVerificationExpires: true
            }
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.emailVerified) {
            return res.status(400).json({ message: 'Email is already verified' });
        }

        // Rate limit: Only allow resend if previous token expired or after 2 minutes
        if (user.emailVerificationExpires) {
            const tokenAge = Date.now() - (user.emailVerificationExpires.getTime() - VERIFICATION_EXPIRY_HOURS * 60 * 60 * 1000);
            const twoMinutes = 2 * 60 * 1000;

            if (tokenAge < twoMinutes) {
                const waitSeconds = Math.ceil((twoMinutes - tokenAge) / 1000);
                return res.status(429).json({
                    message: `Please wait ${waitSeconds} seconds before requesting another verification email`,
                    waitSeconds
                });
            }
        }

        // Generate new verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + VERIFICATION_EXPIRY_HOURS * 60 * 60 * 1000);

        await prisma.user.update({
            where: { id: userId },
            data: {
                emailVerificationToken: verificationToken,
                emailVerificationExpires: expiresAt
            }
        });

        const clientUrl = process.env.CLIENT_URL || 'https://intrak.site';
        const verificationUrl = `${clientUrl}/verify-email?token=${verificationToken}`;

        const emailResult = await emailService.sendVerificationEmail(
            user.email,
            user.name,
            verificationUrl
        );

        if (!emailResult.success) {
            return res.status(500).json({ message: 'Failed to send verification email' });
        }

        res.json({
            message: 'Verification email resent successfully',
            email: user.email
        });
    } catch (error) {
        console.error('Resend verification email error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
