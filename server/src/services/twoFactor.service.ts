import { prisma } from '../config/database';
import { emailService } from './email.service';
import crypto from 'crypto';

class TwoFactorService {
    private readonly OTP_LENGTH = 6;
    private readonly OTP_EXPIRY_MINUTES = 10;

    /**
     * Generate a random 6-digit OTP code
     */
    generateOTP(): string {
        // Generate a cryptographically secure random 6-digit number
        const buffer = crypto.randomBytes(4);
        const num = buffer.readUInt32BE(0);
        const otp = (num % 900000 + 100000).toString(); // Ensures 6 digits (100000-999999)
        return otp;
    }

    /**
     * Send OTP code to user's email for 2FA verification
     */
    async sendOTPEmail(userId: string): Promise<{ success: boolean; error?: string }> {
        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { id: true, email: true, name: true, role: true, twoFactorEnabled: true }
            });

            if (!user) {
                return { success: false, error: 'User not found' };
            }

            // Only admins can have 2FA
            if (user.role !== 'ADMIN') {
                return { success: false, error: 'Two-factor authentication is only available for administrators' };
            }

            // Generate OTP and expiration time
            const otpCode = this.generateOTP();
            const expiresAt = new Date(Date.now() + this.OTP_EXPIRY_MINUTES * 60 * 1000);

            // Save OTP to database
            await prisma.user.update({
                where: { id: userId },
                data: {
                    twoFactorCode: otpCode,
                    twoFactorExpires: expiresAt
                }
            });

            // Send OTP via email using the same template design
            const result = await this.sendOTPEmailTemplate(user.email, user.name, otpCode);

            if (!result.success) {
                console.error('Failed to send 2FA OTP email:', result.error);
                return { success: false, error: result.error };
            }

            console.log(`2FA OTP sent to ${user.email} (expires in ${this.OTP_EXPIRY_MINUTES} minutes)`);
            return { success: true };
        } catch (error: any) {
            console.error('Error sending 2FA OTP:', error);
            return { success: false, error: error.message || 'Failed to send OTP' };
        }
    }

    /**
     * Send OTP email using the same template as account credentials
     */
    private async sendOTPEmailTemplate(
        email: string,
        name: string,
        otpCode: string
    ): Promise<{ success: boolean; error?: string }> {
        const subject = 'Your INTRAK Login Verification Code';

        const content = `
      <p>Hello ${name},</p>
      <p>You are attempting to log in to your INTRAK Administrator account. Use the verification code below to complete your login:</p>
      
      <div class="credentials-box" style="text-align: center;">
        <p style="font-size: 13px; margin-bottom: 15px;"><strong>Your Verification Code:</strong></p>
        <p style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #002C76; margin: 15px 0;">${otpCode}</p>
        <p class="note">This code expires in ${this.OTP_EXPIRY_MINUTES} minutes.</p>
      </div>

      <p><strong>Security Notice:</strong> If you did not attempt to log in, please change your password immediately and contact your system administrator.</p>
      
      <p><br><strong>– INTRAK System</strong></p>
    `;

        const html = emailService.generateEmailTemplate(
            content,
            'Login Verification Code',
            'https://img.icons8.com/ios-filled/50/ffffff/lock.png'
        );

        const text = `
INTRAK Login Verification Code

Hello ${name},

You are attempting to log in to your INTRAK Administrator account.

Your Verification Code: ${otpCode}

This code expires in ${this.OTP_EXPIRY_MINUTES} minutes.

If you did not attempt to log in, please change your password immediately.

– INTRAK System
    `;

        return emailService.sendEmail({
            to: email,
            subject,
            html,
            text
        });
    }

    /**
     * Verify the OTP code entered by user
     */
    async verifyOTP(userId: string, code: string): Promise<{ success: boolean; error?: string }> {
        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    twoFactorCode: true,
                    twoFactorExpires: true,
                    twoFactorEnabled: true
                }
            });

            if (!user) {
                return { success: false, error: 'User not found' };
            }

            if (!user.twoFactorCode || !user.twoFactorExpires) {
                return { success: false, error: 'No verification code found. Please request a new code.' };
            }

            // Check if code has expired
            if (new Date() > user.twoFactorExpires) {
                // Clear expired code
                await prisma.user.update({
                    where: { id: userId },
                    data: {
                        twoFactorCode: null,
                        twoFactorExpires: null
                    }
                });
                return { success: false, error: 'Verification code has expired. Please request a new code.' };
            }

            // Verify the code (constant-time comparison to prevent timing attacks)
            const isValid = crypto.timingSafeEqual(
                Buffer.from(code.padEnd(6, '0')),
                Buffer.from(user.twoFactorCode.padEnd(6, '0'))
            );

            if (!isValid) {
                return { success: false, error: 'Invalid verification code' };
            }

            // Clear the OTP after successful verification
            await prisma.user.update({
                where: { id: userId },
                data: {
                    twoFactorCode: null,
                    twoFactorExpires: null
                }
            });

            console.log(`2FA verification successful for user ${userId}`);
            return { success: true };
        } catch (error: any) {
            console.error('Error verifying 2FA OTP:', error);
            return { success: false, error: error.message || 'Verification failed' };
        }
    }

    /**
     * Enable 2FA for an admin user
     */
    async enable2FA(userId: string): Promise<{ success: boolean; error?: string }> {
        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { id: true, role: true, twoFactorEnabled: true }
            });

            if (!user) {
                return { success: false, error: 'User not found' };
            }

            if (user.role !== 'ADMIN') {
                return { success: false, error: 'Two-factor authentication is only available for administrators' };
            }

            if (user.twoFactorEnabled) {
                return { success: false, error: 'Two-factor authentication is already enabled' };
            }

            await prisma.user.update({
                where: { id: userId },
                data: { twoFactorEnabled: true }
            });

            console.log(`2FA enabled for admin user ${userId}`);
            return { success: true };
        } catch (error: any) {
            console.error('Error enabling 2FA:', error);
            return { success: false, error: error.message || 'Failed to enable 2FA' };
        }
    }

    /**
     * Disable 2FA for an admin user
     */
    async disable2FA(userId: string): Promise<{ success: boolean; error?: string }> {
        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { id: true, twoFactorEnabled: true }
            });

            if (!user) {
                return { success: false, error: 'User not found' };
            }

            if (!user.twoFactorEnabled) {
                return { success: false, error: 'Two-factor authentication is not enabled' };
            }

            await prisma.user.update({
                where: { id: userId },
                data: {
                    twoFactorEnabled: false,
                    twoFactorCode: null,
                    twoFactorExpires: null
                }
            });

            console.log(`2FA disabled for user ${userId}`);
            return { success: true };
        } catch (error: any) {
            console.error('Error disabling 2FA:', error);
            return { success: false, error: error.message || 'Failed to disable 2FA' };
        }
    }

    /**
     * Check if user has 2FA enabled
     */
    async is2FAEnabled(userId: string): Promise<boolean> {
        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { twoFactorEnabled: true, role: true }
            });

            // Only admins can have 2FA enabled
            return user?.role === 'ADMIN' && user?.twoFactorEnabled === true;
        } catch (error) {
            console.error('Error checking 2FA status:', error);
            return false;
        }
    }
}

export const twoFactorService = new TwoFactorService();
