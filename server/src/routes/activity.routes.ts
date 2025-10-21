import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import * as activityController from '../controllers/activity.controller';

const router = Router();

// All activity routes require authentication and admin role
router.use(authenticate);
router.use(authorize(['ADMIN']));

// Get recent activities
router.get('/', activityController.getRecentActivities);

// Create activity (typically called by system, not manually)
router.post('/', activityController.createActivity);

export default router;
