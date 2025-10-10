import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import * as attendanceController from '../controllers/attendance.controller';

const router = Router();

router.use(authenticate);

router.post('/log', attendanceController.logAttendance);
router.get('/', attendanceController.getAttendance);
router.get('/qr/:studentId', attendanceController.generateQR);
router.post('/qr/verify', attendanceController.verifyQR);
router.post('/gps', attendanceController.verifyGPS);
router.put('/:id/verify', authorize(['COORDINATOR', 'INSTRUCTOR']), attendanceController.verifyAttendance);

export default router;