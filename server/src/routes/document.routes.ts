import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import { upload } from '../utils/upload';
import { 
  validateFileType, 
  validateFileSize, 
  scanFileContent, 
  cleanupOnError 
} from '../middleware/fileSecurity';
import * as documentController from '../controllers/document.controller';

const router = Router();

router.use(authenticate);

// Document upload and management
router.post('/upload', 
  upload.single('file'), 
  validateFileType,
  validateFileSize,
  scanFileContent,
  cleanupOnError,
  documentController.uploadDocument
);
router.get('/', documentController.getDocuments);
router.get('/student', documentController.getStudentDocuments);
router.get('/:id', documentController.getDocumentById);
router.get('/:id/download', documentController.downloadDocument);
router.put('/:id/approve', authorize(['COORDINATOR', 'INSTRUCTOR']), documentController.approveDocument);
router.put('/:id/reject', authorize(['COORDINATOR', 'INSTRUCTOR']), documentController.rejectDocument);
router.delete('/:id', authorize(['ADMIN', 'STUDENT']), documentController.deleteDocument);

export default router;