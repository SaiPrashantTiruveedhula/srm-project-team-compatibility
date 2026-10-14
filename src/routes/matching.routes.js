import { Router } from 'express';
import { MatchingController } from '../controllers/matching.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/recommendations', requireAuth, MatchingController.getRecommendations);
router.post('/generate-team', requireAuth, MatchingController.generateTeam);
router.get('/skill-gaps', requireAuth, MatchingController.getSkillGaps);

export default router;
