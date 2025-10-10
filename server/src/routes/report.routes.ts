import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import { getAttendanceReport, getComplianceReport } from '../controllers/report.controller';

const router = Router();

router.use(authenticate);

router.get('/attendance', authorize(['COORDINATOR', 'INSTRUCTOR', 'ADMIN', 'STUDENT']), getAttendanceReport);
router.get('/compliance', authorize(['COORDINATOR', 'ADMIN']), getComplianceReport);

export default router;