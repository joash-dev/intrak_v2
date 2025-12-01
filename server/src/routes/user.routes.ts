import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import { profilePhotoUpload } from '../utils/profilePhotoUpload';
import * as userController from '../controllers/user.controller';

const router = Router();

// Public profile photo serving endpoint (no auth required)
router.get('/profile-photo/:filename', userController.getProfilePhoto);

// Apply authentication middleware to all other routes
router.use(authenticate);

// Profile photo routes (must come before /:id routes)
router.get('/profile-photo', userController.getCurrentUserProfilePhoto);
router.post('/profile-photo/upload', profilePhotoUpload.single('photo'), userController.uploadProfilePhoto);
router.delete('/profile-photo', userController.removeProfilePhoto);

// User CRUD routes
router.get('/', authorize(['ADMIN', 'COORDINATOR', 'INSTRUCTOR']), userController.getUsers);
router.get('/:id', userController.getUserById);
router.put('/:id', userController.updateUser);
router.delete('/:id', authorize(['ADMIN', 'COORDINATOR', 'INSTRUCTOR']), userController.deleteUser);

// Password change route
router.put('/password/change', authenticate, userController.changePassword);

export default router;