import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import * as messageTemplateController from '../controllers/messageTemplate.controller';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  authorize(['STUDENT', 'INSTRUCTOR', 'COORDINATOR']),
  messageTemplateController.getMessageTemplates
);

export default router;

