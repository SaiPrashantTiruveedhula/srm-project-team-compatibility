import { Router } from 'express';
import { StudentController } from '../controllers/student.controller.js';

const router = Router();

router.get('/', StudentController.discoverStudents);
router.get('/:id', StudentController.getStudentById);

export default router;
