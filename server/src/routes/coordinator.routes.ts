import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import {
  getCoordinatorSettings,
  updateCoordinatorSettings,
} from '../controllers/coordinatorSettings.controller';

const router = Router();

router.get(
  '/settings',
  authenticate,
  authorize(['ADMIN', 'COORDINATOR']),
  getCoordinatorSettings,
);

router.put(
  '/settings',
  authenticate,
  authorize(['ADMIN', 'COORDINATOR']),
  updateCoordinatorSettings,
);

export default router;
