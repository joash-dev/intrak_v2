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
import * as companyProposalController from '../controllers/companyProposal.controller';

const router = Router();

router.use(authenticate);

// Student endpoints
router.post('/', authorize(['STUDENT']), companyProposalController.createProposal);
router.get('/my', authorize(['STUDENT']), companyProposalController.getMyProposals);
router.delete('/:id', authorize(['STUDENT']), companyProposalController.deleteMyProposal);

// Instructor and coordinator proposal lists
router.get('/instructor', authorize(['INSTRUCTOR', 'ADMIN']), companyProposalController.getInstructorProposals);
router.get('/coordinator', authorize(['COORDINATOR', 'ADMIN']), companyProposalController.getCoordinatorProposals);

// Attachments
router.post(
  '/:id/attachments',
  authorize(['STUDENT', 'INSTRUCTOR', 'COORDINATOR', 'ADMIN']),
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
