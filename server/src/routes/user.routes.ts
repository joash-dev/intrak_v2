import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import * as userController from '../controllers/user.controller';

const router = Router();

router.use(authenticate);

router.get('/', authorize(['ADMIN', 'COORDINATOR']), userController.getUsers);
router.get('/:id', userController.getUserById);
router.put('/:id', userController.updateUser);
router.delete('/:id', authorize(['ADMIN']), userController.deleteUser);

export default router;