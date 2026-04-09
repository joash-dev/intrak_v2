import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import { upload } from '../utils/upload';
import {
  cleanupOnError,
  scanFileContent,
  validateFileSize,
  validateFileType,
} from '../middleware/fileSecurity';
import { guardStudentWriteByAuthenticatedUser } from '../middleware/studentLifecycleGuard';
import * as companyProposalController from '../controllers/companyProposal.controller';

const router = Router();

router.use(authenticate);

// Student endpoints
router.post('/', authorize(['STUDENT']), guardStudentWriteByAuthenticatedUser, companyProposalController.createProposal);
router.get('/my', authorize(['STUDENT']), companyProposalController.getMyProposals);
router.patch(
  '/:id/student/submit-to-instructor',
  authorize(['STUDENT']),
  guardStudentWriteByAuthenticatedUser,
  companyProposalController.studentSubmitDraftToInstructor,
);
router.patch(
  '/:id/student/resubmit',
  authorize(['STUDENT']),
  guardStudentWriteByAuthenticatedUser,
  companyProposalController.studentResubmitProposal,
);
router.delete(
  '/attachments/:attachmentId',
  authorize(['STUDENT', 'INSTRUCTOR', 'COORDINATOR', 'ADMIN']),
  guardStudentWriteByAuthenticatedUser,
  companyProposalController.deleteProposalAttachment,
);
router.delete('/:id', authorize(['STUDENT']), guardStudentWriteByAuthenticatedUser, companyProposalController.deleteMyProposal);

// Instructor and coordinator proposal lists
router.get('/instructor', authorize(['INSTRUCTOR', 'ADMIN']), companyProposalController.getInstructorProposals);
router.get('/coordinator', authorize(['COORDINATOR', 'ADMIN']), companyProposalController.getCoordinatorProposals);

// Attachments
router.post(
  '/:id/attachments',
  authorize(['STUDENT', 'INSTRUCTOR', 'COORDINATOR', 'ADMIN']),
  guardStudentWriteByAuthenticatedUser,
  upload.single('file'),
  validateFileType,
  validateFileSize,
  scanFileContent,
  cleanupOnError,
  companyProposalController.uploadProposalAttachment,
);
router.get(
  '/attachments/:attachmentId/download',
  authorize(['STUDENT', 'INSTRUCTOR', 'COORDINATOR', 'ADMIN']),
  companyProposalController.downloadAttachment,
);

// Instructor actions
router.patch(
  '/:id/instructor/forward',
  authorize(['INSTRUCTOR', 'ADMIN']),
  companyProposalController.instructorForwardProposal,
);
router.patch(
  '/:id/instructor/decision',
  authorize(['INSTRUCTOR', 'ADMIN']),
  companyProposalController.instructorRejectOrReturnProposal,
);
router.patch(
  '/:id/instructor/notify-student',
  authorize(['INSTRUCTOR', 'ADMIN']),
  companyProposalController.instructorNotifyStudent,
);

// Coordinator actions
router.patch(
  '/:id/coordinator/mark-external-pending',
  authorize(['COORDINATOR', 'ADMIN']),
  companyProposalController.coordinatorMarkExternalPending,
);
router.patch(
  '/:id/coordinator/finalize',
  authorize(['COORDINATOR', 'ADMIN']),
  companyProposalController.coordinatorFinalizeProposal,
);

export default router;
