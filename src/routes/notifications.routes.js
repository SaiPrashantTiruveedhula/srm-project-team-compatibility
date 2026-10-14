import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', requireAuth, NotificationController.getNotifications);
router.patch('/:id/read', requireAuth, NotificationController.markAsRead);
router.post('/read-all', requireAuth, NotificationController.markAllAsRead);

export default router;
