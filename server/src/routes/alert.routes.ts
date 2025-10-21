import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import * as alertController from '../controllers/alert.controller';

const router = Router();

// All alert routes require authentication and admin role
router.use(authenticate);
router.use(authorize(['ADMIN']));

// Get system alerts
router.get('/', alertController.getSystemAlerts);

// Create alert
router.post('/', alertController.createAlert);

// Resolve alert
router.patch('/:id/resolve', alertController.resolveAlert);

// Delete alert
router.delete('/:id', alertController.deleteAlert);

export default router;
