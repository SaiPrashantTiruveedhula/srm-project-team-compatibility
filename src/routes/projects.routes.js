import { Router } from 'express';
import { ProjectController } from '../controllers/project.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', ProjectController.getAllProjects);
router.post('/', requireAuth, ProjectController.createProject);
router.get('/:id', ProjectController.getProjectById);
router.put('/:id', requireAuth, ProjectController.updateProject);
router.delete('/:id', requireAuth, ProjectController.deleteProject);

export default router;
