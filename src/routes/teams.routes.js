import { Router } from 'express';
import { TeamController } from '../controllers/team.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/me', requireAuth, TeamController.getMyTeams);
router.get('/invitations', requireAuth, TeamController.getMyInvitations);
router.get('/:id', requireAuth, TeamController.getTeamById);
router.post('/invitations', requireAuth, TeamController.sendInvitation);
router.patch('/invitations/:id', requireAuth, TeamController.respondToInvitation);
router.post('/:id/leave', requireAuth, TeamController.leaveTeam);

export default router;
