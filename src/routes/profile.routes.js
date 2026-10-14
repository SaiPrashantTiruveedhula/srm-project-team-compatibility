import { Router } from 'express';
import { ProfileController } from '../controllers/profile.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/me', requireAuth, ProfileController.getMyProfile);
router.put('/me', requireAuth, ProfileController.updateMyProfile);

export default router;
