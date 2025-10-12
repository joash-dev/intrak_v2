import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import * as studentController from '../controllers/student.controller';

const router = Router();

router.use(authenticate);

router.get('/', studentController.getStudents);
router.get('/profile', studentController.getStudentProfile);
router.get('/my-assigned', studentController.getMyAssignedStudents);
router.get('/instructor/:instructorId', studentController.getStudentsByInstructor);
router.get('/:id', studentController.getStudentById);
router.post('/', authorize(['ADMIN', 'INSTRUCTOR']), studentController.createStudent);
router.put('/:id', authorize(['ADMIN', 'INSTRUCTOR', 'STUDENT']), studentController.updateStudent);
router.patch('/:studentId/instructor', authorize(['ADMIN', 'COORDINATOR']), studentController.assignInstructor);
router.delete('/:id', authorize(['ADMIN', 'INSTRUCTOR']), studentController.deleteStudent);

export default router;