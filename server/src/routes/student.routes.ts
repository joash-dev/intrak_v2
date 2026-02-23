import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import * as studentController from '../controllers/student.controller';
import * as weeklyReportController from '../controllers/weeklyReport.controller';
import * as supervisorFeedbackController from '../controllers/supervisorFeedback.controller';
import * as agencySelfEvaluationController from '../controllers/agencySelfEvaluation.controller';

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
router.put('/:id/saturday-preference', authorize(['STUDENT']), studentController.updateSaturdayPreference);
router.post('/apply-company', authorize(['STUDENT']), studentController.applyToCompany);
router.post('/request-company-partnership', authorize(['STUDENT']), studentController.requestCompanyPartnership);

// Instructor assignment routes - specific routes before generic :id
router.patch('/bulk-assign-instructor', authorize(['ADMIN', 'COORDINATOR']), studentController.bulkAssignInstructor);
router.patch('/:studentId/instructor', authorize(['ADMIN', 'COORDINATOR']), studentController.assignInstructor);

// Weekly report routes
router.get('/weekly-reports/me', authorize(['STUDENT']), weeklyReportController.getWeeklyReport);
router.post('/weekly-reports/me', authorize(['STUDENT']), weeklyReportController.saveWeeklyReport);
router.get('/weekly-reports/export/me', authorize(['STUDENT']), weeklyReportController.exportWeeklyReport);
// Supervisor feedback routes
router.post('/supervisor-feedback', authorize(['INDUSTRY_PARTNER']), supervisorFeedbackController.submitFeedback);
router.get('/supervisor-feedback/:studentId', authorize(['INDUSTRY_PARTNER', 'INSTRUCTOR', 'COORDINATOR', 'STUDENT']), supervisorFeedbackController.getFeedback);
router.get('/supervisor-feedback/export/:studentId', authorize(['INDUSTRY_PARTNER', 'STUDENT']), supervisorFeedbackController.exportFeedback);
// Agency self-evaluation routes (Form 19b)
router.post('/agency-self-evaluation', authorize(['INDUSTRY_PARTNER']), agencySelfEvaluationController.submitAgencySelfEvaluation);
router.get('/agency-self-evaluation', authorize(['INDUSTRY_PARTNER', 'STUDENT']), agencySelfEvaluationController.getAgencySelfEvaluation);
router.get('/agency-self-evaluation/export', authorize(['INDUSTRY_PARTNER', 'STUDENT']), agencySelfEvaluationController.exportAgencySelfEvaluation);
// Attendance reminder & activity timeline (must come before /:id)
router.post('/:studentId/send-reminder', authorize(['INSTRUCTOR']), studentController.sendAttendanceReminder);
router.get('/:studentId/timeline', authorize(['INSTRUCTOR', 'COORDINATOR', 'ADMIN']), studentController.getStudentTimeline);

// Parameterized routes - must come after specific routes
router.get('/:id', studentController.getStudentById);
router.post('/', authorize(['ADMIN', 'INSTRUCTOR']), studentController.createStudent);
router.put('/:id', authorize(['ADMIN', 'INSTRUCTOR', 'STUDENT', 'COORDINATOR']), studentController.updateStudent);
router.delete('/:id', authorize(['ADMIN', 'INSTRUCTOR']), studentController.deleteStudent);

export default router;