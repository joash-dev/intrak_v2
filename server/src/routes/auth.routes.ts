import { Router } from 'express';
import { register, login, refresh, logout, testEndpoint, forgotPassword, resetPassword } from '../controllers/auth.controller';
import { enable2FA, disable2FA, get2FAStatus, request2FACode, verify2FACode, regenerateBackupCodes, verifyBackupCode } from '../controllers/twoFactor.controller';
import { body } from 'express-validator';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post(
  '/register',
  [
    body('email').isEmail(),
    body('password').isLength({ min: 8 }),
    body('name').notEmpty(),
    validate
  ],
  register
);

router.post(
  '/login',
  [
    body('email').isEmail(),
    body('password').notEmpty(),
    validate
  ],
  login
);

router.post('/refresh', refresh);
router.post('/logout', logout);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/test', testEndpoint);

// Two-Factor Authentication routes
router.get('/2fa/status', authenticate, get2FAStatus);
router.post('/2fa/enable', authenticate, enable2FA);
router.post('/2fa/disable', authenticate, disable2FA);
router.post('/2fa/request-code', request2FACode); // No auth - used during login
router.post('/2fa/verify', verify2FACode); // No auth - used during login
router.post('/2fa/backup-codes/regenerate', authenticate, regenerateBackupCodes);
router.post('/2fa/backup-codes/verify', verifyBackupCode); // No auth - used during login

// Email Verification routes
import { sendVerificationEmail, verifyEmail, getVerificationStatus, resendVerificationEmail } from '../controllers/emailVerification.controller';
router.post('/email/send-verification', authenticate, sendVerificationEmail);
router.post('/email/verify', verifyEmail); // No auth - uses token
router.get('/email/status', authenticate, getVerificationStatus);
router.post('/email/resend-verification', authenticate, resendVerificationEmail);

export default router;

