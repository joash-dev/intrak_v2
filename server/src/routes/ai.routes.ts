import express from 'express';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import {
  generateEvaluationRemarks,
  generateDocumentFeedback,
  generateAttendanceNote,
  generateWeeklyReportSummary,
  generateOverallComments,
  generateForm18Comments,
  generateInstructorEvaluationComments,
  generateImprovementSuggestions,
  generateAnnouncementContent,
} from '../controllers/ai.controller';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Rate limiting for AI endpoints (5 requests per minute per user)
const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  message: 'Too many AI requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// All AI routes require authentication and rate limiting
router.use(authenticate);
router.use(aiRateLimiter);

// Evaluation remarks generation (for supervisors/industry partners)
router.post('/evaluation-remarks', authorize(['INDUSTRY_PARTNER']), generateEvaluationRemarks);

// Document feedback generation (for instructors/coordinators)
router.post('/document-feedback', authorize(['INSTRUCTOR', 'COORDINATOR']), generateDocumentFeedback);

// Attendance note generation (for supervisors/instructors)
router.post('/attendance-note', authorize(['INDUSTRY_PARTNER', 'INSTRUCTOR']), generateAttendanceNote);

// Weekly report summary (for students)
router.post('/weekly-report-summary', authorize(['STUDENT']), generateWeeklyReportSummary);

// Overall evaluation comments (for supervisors/industry partners)
router.post('/overall-comments', authorize(['INDUSTRY_PARTNER']), generateOverallComments);

// Form 18 comments (for supervisors/industry partners)
router.post('/form18-comments', authorize(['INDUSTRY_PARTNER']), generateForm18Comments);

// Instructor evaluation comments
router.post('/instructor-evaluation-comments', authorize(['INSTRUCTOR']), generateInstructorEvaluationComments);

// Improvement suggestions (for instructors)
router.post('/improvement-suggestions', authorize(['INSTRUCTOR']), generateImprovementSuggestions);

// Announcement content (for coordinators and admins)
router.post('/announcement-content', authorize(['COORDINATOR', 'ADMIN']), generateAnnouncementContent);

export default router;

