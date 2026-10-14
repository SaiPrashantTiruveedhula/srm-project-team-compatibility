import { TeamRepository } from '../repositories/team.repository.js';
import { ProjectRepository } from '../repositories/project.repository.js';
import { NotificationRepository } from '../repositories/notification.repository.js';
import { UserRepository } from '../repositories/user.repository.js';

export const ApplicationController = {
  async applyToProject(req, res, next) {
    try {
      const projectId = parseInt(req.params.id, 10);
      const applicantId = req.session.userId;
      const { requestedRole, pitch } = req.body;

      const project = ProjectRepository.findById(projectId);
      if (!project) {
        return res.status(404).json({ success: false, error: 'Project not found.' });
      }

      if (project.owner_id === applicantId) {
        return res.status(400).json({ success: false, error: 'You are the owner of this project.' });
      }

      const appId = TeamRepository.createApplication({
        projectId,
        applicantId,
        requestedRole,
        pitch
      });

      // Send Notification to Project Owner
      const applicant = UserRepository.findById(applicantId);
      NotificationRepository.create(
        project.owner_id,
        'New Project Application',
        `${applicant.full_name} applied to join "${project.title}" as ${requestedRole || 'Member'}.`,
        `/project-details.html?id=${projectId}`
      );

      res.status(201).json({
        success: true,
        message: 'Application submitted successfully.',
        applicationId: appId
      });
    } catch (err) {
      next(err);
    }
  },

  async getMyApplications(req, res, next) {
    try {
      const apps = TeamRepository.findUserApplications(req.session.userId);
      res.json({ success: true, applications: apps });
    } catch (err) {
      next(err);
    }
  },

  async getProjectApplications(req, res, next) {
    try {
      const projectId = parseInt(req.params.id, 10);
      const project = ProjectRepository.findById(projectId);
      if (!project) {
        return res.status(404).json({ success: false, error: 'Project not found.' });
      }

      if (project.owner_id !== req.session.userId && req.session.userRole !== 'admin') {
        return res.status(403).json({ success: false, error: 'Unauthorized to view applications for this project.' });
      }

      const apps = TeamRepository.findApplicationsForProject(projectId);
      res.json({ success: true, applications: apps });
    } catch (err) {
      next(err);
    }
  },

  async updateStatus(req, res, next) {
    try {
      const applicationId = parseInt(req.params.id, 10);
      const { status } = req.body; // 'accepted', 'rejected', 'withdrawn'

      if (!['accepted', 'rejected', 'withdrawn'].includes(status)) {
        return res.status(400).json({ success: false, error: 'Invalid application status.' });
      }

      const app = TeamRepository.updateApplicationStatus(applicationId, status);

      if (status === 'accepted') {
        const project = ProjectRepository.findById(app.project_id);
        const team = TeamRepository.findTeamByProjectId(app.project_id);
        if (team) {
          TeamRepository.addMember(team.id, app.applicant_id, app.requested_role);
        }

        NotificationRepository.create(
          app.applicant_id,
          'Application Accepted!',
          `Congratulations! Your application to join "${project.title}" was accepted.`,
          `/teams.html`
        );
      } else if (status === 'rejected') {
        const project = ProjectRepository.findById(app.project_id);
        NotificationRepository.create(
          app.applicant_id,
          'Application Status Update',
          `Your application for "${project.title}" was not selected at this time.`,
          `/projects.html`
        );
      }

      res.json({ success: true, message: `Application ${status}.`, application: app });
    } catch (err) {
      next(err);
    }
  }
};
