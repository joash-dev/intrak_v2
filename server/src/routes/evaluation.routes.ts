import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import {
  exportEvaluationDocx,
  submitEvaluation,
  getEvaluations,
} from '../controllers/evaluation.controller';

const router = Router();

router.use(authenticate);

router.get('/', getEvaluations);

router.post(
  '/',
  authorize(['INDUSTRY_PARTNER', 'ADMIN', 'COORDINATOR']),
  submitEvaluation
);

router.post(
  '/export',
  authorize(['INDUSTRY_PARTNER', 'ADMIN', 'COORDINATOR', 'STUDENT']),
  exportEvaluationDocx
);

export default router;