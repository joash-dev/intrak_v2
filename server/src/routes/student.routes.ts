import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import * as studentController from '../controllers/student.controller';
import * as weeklyReportController from '../controllers/weeklyReport.controller';

const router = Router();

router.use(authenticate);

router.get('/', studentController.getStudents);
router.get('/profile', studentController.getStudentProfile);
router.get('/my-assigned', studentController.getMyAssignedStudents);
router.get('/instructor/:instructorId', studentController.getStudentsByInstructor);
// Partnership routes - must come before /:id route
router.get('/partnership-messages', authorize(['STUDENT', 'INSTRUCTOR', 'COORDINATOR']), studentController.getPartnershipMessages);
router.post('/partnership-messages', authorize(['STUDENT', 'INSTRUCTOR', 'COORDINATOR']), studentController.sendPartnershipMessage);
router.get('/partnership-checklist', authorize(['STUDENT']), studentController.getPartnershipChecklist);
router.put('/partnership-checklist', authorize(['STUDENT']), studentController.updatePartnershipChecklist);
router.post('/apply-company', authorize(['STUDENT']), studentController.applyToCompany);
router.post('/request-company-partnership', authorize(['STUDENT']), studentController.requestCompanyPartnership);
// Weekly report routes
router.get('/weekly-reports/me', authorize(['STUDENT']), weeklyReportController.getWeeklyReport);
router.post('/weekly-reports/me', authorize(['STUDENT']), weeklyReportController.saveWeeklyReport);
router.get('/weekly-reports/export/me', authorize(['STUDENT']), weeklyReportController.exportWeeklyReport);
// Parameterized routes - must come after specific routes
router.get('/:id', studentController.getStudentById);
router.post('/', authorize(['ADMIN', 'INSTRUCTOR']), studentController.createStudent);
router.put('/:id', authorize(['ADMIN', 'INSTRUCTOR', 'STUDENT', 'COORDINATOR']), studentController.updateStudent);
router.patch('/:studentId/instructor', authorize(['ADMIN', 'COORDINATOR']), studentController.assignInstructor);
router.patch('/bulk-assign-instructor', authorize(['ADMIN', 'COORDINATOR']), studentController.bulkAssignInstructor);
router.delete('/:id', authorize(['ADMIN', 'INSTRUCTOR']), studentController.deleteStudent);

export default router;