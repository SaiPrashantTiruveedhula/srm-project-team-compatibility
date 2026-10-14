import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller.js';
import { requireAdmin } from '../middleware/admin.middleware.js';

const router = Router();

router.get('/stats', requireAdmin, AdminController.getStats);
router.get('/users', requireAdmin, AdminController.getUsers);
router.patch('/users/:id/status', requireAdmin, AdminController.updateUserStatus);
router.get('/reports', requireAdmin, AdminController.getReports);
router.patch('/reports/:id', requireAdmin, AdminController.resolveReport);

export default router;
