import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import * as emailController from '../controllers/email.controller';

const router = Router();

router.use(authenticate);

// Send welcome email to any user (general)
router.post('/welcome-user', authorize(['ADMIN', 'COORDINATOR', 'INSTRUCTOR']), emailController.sendUserWelcomeEmail);

// Send welcome email to student (legacy)
router.post('/welcome', authorize(['ADMIN', 'COORDINATOR', 'INSTRUCTOR']), emailController.sendStudentWelcomeEmail);

// Test email connection (for debugging)
router.get('/test', authorize(['ADMIN']), emailController.testEmailConnection);

// Send test email (for debugging)
router.post('/test-send', authorize(['ADMIN']), emailController.sendTestEmail);

export default router;
