import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import * as companyApplicationController from '../controllers/companyApplication.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Student routes
router.get('/my-applications', companyApplicationController.getMyApplications);
router.post('/apply', companyApplicationController.applyToCompany);
router.post('/resign-placement', companyApplicationController.resignFromPlacement);
router.patch('/:id/withdraw', companyApplicationController.withdrawApplication);

// Instructor/Coordinator/Admin routes
router.get(
  '/',
  authorize(['INSTRUCTOR', 'COORDINATOR', 'ADMIN']),
  companyApplicationController.getAllApplications
);

router.patch(
  '/:id/approve',
  authorize(['INSTRUCTOR', 'COORDINATOR', 'ADMIN']),
  companyApplicationController.approveApplication
);

router.patch(
  '/:id/reject',
  authorize(['INSTRUCTOR', 'COORDINATOR', 'ADMIN']),
  companyApplicationController.rejectApplication
);

export default router;

