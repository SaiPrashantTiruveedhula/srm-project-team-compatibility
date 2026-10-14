import { Router } from 'express';
import { ApplicationController } from '../controllers/application.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/projects/:id/applications', requireAuth, ApplicationController.applyToProject);
router.get('/me', requireAuth, ApplicationController.getMyApplications);
router.get('/projects/:id', requireAuth, ApplicationController.getProjectApplications);
router.patch('/:id', requireAuth, ApplicationController.updateStatus);

export default router;
