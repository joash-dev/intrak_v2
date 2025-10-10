import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import * as announcementController from '../controllers/announcement.controller';

const router = Router();

router.use(authenticate);

router.get('/', announcementController.getAnnouncements);
router.get('/:id', announcementController.getAnnouncementById);
router.post('/', authorize(['COORDINATOR', 'ADMIN']), announcementController.createAnnouncement);
router.put('/:id', authorize(['COORDINATOR', 'ADMIN']), announcementController.updateAnnouncement);
router.delete('/:id', authorize(['COORDINATOR', 'ADMIN']), announcementController.deleteAnnouncement);
router.post('/:id/view', announcementController.trackAnnouncementView);

export default router;