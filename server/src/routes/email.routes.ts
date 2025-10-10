import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import * as emailController from '../controllers/email.controller';

const router = Router();

router.use(authenticate);

// Send welcome email to student
router.post('/welcome', authorize(['ADMIN', 'COORDINATOR']), emailController.sendStudentWelcomeEmail);

// Test email connection (for debugging)
router.get('/test', authorize(['ADMIN']), emailController.testEmailConnection);

export default router;
