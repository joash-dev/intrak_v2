import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import * as attendanceController from '../controllers/attendance.controller';
import * as attendanceNoWorkController from '../controllers/attendanceNoWork.controller';

const router = Router();

router.use(authenticate);

router.post('/log', attendanceController.logAttendance);
router.post(
  '/no-work-notices',
  authorize(['STUDENT']),
  attendanceNoWorkController.createNoWorkNotice
);
router.get(
  '/no-work-notices/me',
  authorize(['STUDENT']),
  attendanceNoWorkController.listMyNoWorkNotices
);
router.get(
  '/no-work-notices/supervisor',
  authorize(['INDUSTRY_PARTNER']),
  attendanceNoWorkController.listSupervisorNoWorkNotices
);
router.put(
  '/no-work-notices/:id/review',
  authorize(['INDUSTRY_PARTNER']),
  attendanceNoWorkController.reviewNoWorkNotice
);
router.get('/', attendanceController.getAttendance);
router.get('/qr/:studentId', attendanceController.generateQR);
router.post('/qr/verify', attendanceController.verifyQR);
router.post('/gps', attendanceController.verifyGPS);
router.put(
  '/:id/verify',
  authorize(['INDUSTRY_PARTNER', 'COORDINATOR']),
  attendanceController.verifyAttendance
);
router.get('/export-dtr/:studentId', attendanceController.exportDTR);
router.get('/export-dtr-docx/:studentId', attendanceController.exportDTRDocx);

export default router;