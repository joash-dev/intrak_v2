import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import { templateUpload } from '../utils/templateUpload';
import * as templateController from '../controllers/template.controller';

const router = Router();

router.use(authenticate);

// Template upload (instructors and admins only)
router.post('/upload', 
  authorize(['ADMIN', 'INSTRUCTOR']),
  templateUpload.single('file'),
  templateController.uploadTemplate
);

// Get all templates (everyone can view)
router.get('/', templateController.getTemplates);

// Get template by ID
router.get('/:id', templateController.getTemplateById);

// Download template
router.get('/:id/download', templateController.downloadTemplate);

// Update template (instructors and admins only)
router.put('/:id', authorize(['ADMIN', 'INSTRUCTOR']), templateController.updateTemplate);

// Delete template (instructors and admins only)
router.delete('/:id', authorize(['ADMIN', 'INSTRUCTOR']), templateController.deleteTemplate);

export default router;
