import { TeamRepository } from '../repositories/team.repository.js';
import { ProjectRepository } from '../repositories/project.repository.js';
import { NotificationRepository } from '../repositories/notification.repository.js';
import { UserRepository } from '../repositories/user.repository.js';

export const TeamController = {
  async getMyTeams(req, res, next) {
    try {
      const teams = TeamRepository.findUserTeams(req.session.userId);
      res.json({ success: true, count: teams.length, teams });
    } catch (err) {
      next(err);
    }
  },

  async getTeamById(req, res, next) {
    try {
      const teamId = parseInt(req.params.id, 10);
      const team = TeamRepository.findTeamById(teamId);
      if (!team) {
        return res.status(404).json({ success: false, error: 'Team not found.' });
      }
      res.json({ success: true, team });
    } catch (err) {
      next(err);
    }
  },

  async sendInvitation(req, res, next) {
    try {
      const { teamId, projectId, inviteeId, offeredRole, message } = req.body;

      if (!teamId || !projectId || !inviteeId) {
        return res.status(400).json({ success: false, error: 'teamId, projectId, and inviteeId are required.' });
      }

      const inviterId = req.session.userId;
      const invId = TeamRepository.createInvitation({
        teamId: parseInt(teamId, 10),
        projectId: parseInt(projectId, 10),
        inviterId,
        inviteeId: parseInt(inviteeId, 10),
        offeredRole: offeredRole || 'Member',
        message: message || ''
      });

      const inviter = UserRepository.findById(inviterId);
      const project = ProjectRepository.findById(projectId);

      NotificationRepository.create(
        parseInt(inviteeId, 10),
        'New Project Team Invitation',
        `${inviter.full_name} invited you to join team for "${project.title}".`,
        `/notifications.html`
      );

      res.status(201).json({
        success: true,
        message: 'Invitation sent successfully.',
        invitationId: invId
      });
    } catch (err) {
      next(err);
    }
  },

  async getMyInvitations(req, res, next) {
    try {
      const invitations = TeamRepository.findUserInvitations(req.session.userId);
      res.json({ success: true, invitations });
    } catch (err) {
      next(err);
    }
  },

  async respondToInvitation(req, res, next) {
    try {
      const invitationId = parseInt(req.params.id, 10);
      const { status } = req.body; // 'accepted', 'declined'

      if (!['accepted', 'declined'].includes(status)) {
        return res.status(400).json({ success: false, error: 'Invalid invitation status.' });
      }

      const invitation = TeamRepository.updateInvitationStatus(invitationId, status);

      if (status === 'accepted') {
        TeamRepository.addMember(invitation.team_id, invitation.invitee_id, invitation.offered_role);

        const invitee = UserRepository.findById(invitation.invitee_id);
        const project = ProjectRepository.findById(invitation.project_id);

        NotificationRepository.create(
          invitation.inviter_id,
          'Invitation Accepted!',
          `${invitee.full_name} accepted your invitation to join "${project.title}".`,
          `/teams.html`
        );
      }

      res.json({ success: true, message: `Invitation ${status}.`, invitation });
    } catch (err) {
      next(err);
    }
  },

  async leaveTeam(req, res, next) {
    try {
      const teamId = parseInt(req.params.id, 10);
      const userId = req.session.userId;

      const team = TeamRepository.findTeamById(teamId);
      if (!team) {
        return res.status(404).json({ success: false, error: 'Team not found.' });
      }

      const project = ProjectRepository.findById(team.project_id);
      if (project && project.owner_id === userId) {
        return res.status(400).json({ success: false, error: 'Project owner cannot leave team. Delete or transfer project instead.' });
      }

      TeamRepository.removeMember(teamId, userId);
      res.json({ success: true, message: 'You have left the team.' });
    } catch (err) {
      next(err);
    }
  }
};
