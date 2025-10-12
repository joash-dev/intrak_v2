import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import * as auditController from '../controllers/audit.controller';

const router = Router();

router.use(authenticate);
router.use(authorize(['ADMIN', 'INSTRUCTOR']));

router.get('/', auditController.getAuditLogs);
router.get('/:id', auditController.getAuditLogById);

export default router;