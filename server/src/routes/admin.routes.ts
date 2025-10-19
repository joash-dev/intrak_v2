import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import { profilePhotoUpload } from '../utils/profilePhotoUpload';
import * as adminController from '../controllers/admin.controller';
import * as userController from '../controllers/user.controller';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Admin profile routes
router.get('/profile', adminController.getAdminProfile);
router.put('/profile', adminController.updateAdminProfile);
router.put('/password', adminController.changeAdminPassword);

// Admin settings routes
router.get('/settings', adminController.getAdminSettings);
router.put('/settings', adminController.updateAdminSettings);

// Admin dashboard routes
router.get('/dashboard', adminController.getAdminDashboard);

// Admin user management routes
router.get('/instructors', adminController.getInstructors);

// Admin system information route
router.get('/system-info', adminController.getSystemInfo);

// Public maintenance status check route
router.get('/maintenance-status', adminController.checkMaintenanceStatus);

// Emergency disable maintenance mode (public route for emergencies)
router.post('/emergency-disable-maintenance', adminController.emergencyDisableMaintenance);

// Profile photo routes (reuse from user controller)
router.get('/profile-photo', userController.getCurrentUserProfilePhoto);
router.post('/profile-photo/upload', profilePhotoUpload.single('photo'), userController.uploadProfilePhoto);
router.delete('/profile-photo', userController.removeProfilePhoto);

export default router;
