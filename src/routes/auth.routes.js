import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { rateLimitAuth } from '../middleware/rateLimit.middleware.js';

const router = Router();

router.post('/register', rateLimitAuth(), AuthController.register);
router.post('/login', rateLimitAuth(), AuthController.login);
router.post('/logout', AuthController.logout);
router.get('/me', AuthController.me);
router.post('/verify-email', AuthController.verifyEmail);

export default router;
