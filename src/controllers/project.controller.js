import { ProjectRepository } from '../repositories/project.repository.js';

export const ProjectController = {
  async getAllProjects(req, res, next) {
    try {
      const filters = {
        category: req.query.category,
        status: req.query.status,
        ownerId: req.query.ownerId ? parseInt(req.query.ownerId, 10) : undefined,
        search: req.query.search,
        skill: req.query.skill
      };

      const projects = ProjectRepository.findAll(filters);
      res.json({
        success: true,
        count: projects.length,
        projects
      });
    } catch (err) {
      next(err);
    }
  },

  async getProjectById(req, res, next) {
    try {
      const projectId = parseInt(req.params.id, 10);
      const project = ProjectRepository.findById(projectId);
      if (!project) {
        return res.status(404).json({ success: false, error: 'Project not found.' });
      }
      res.json({ success: true, project });
    } catch (err) {
      next(err);
    }
  },

  async createProject(req, res, next) {
    try {
      const { title, description, category } = req.body;
      if (!title || !description || !category) {
        return res.status(400).json({ success: false, error: 'Project title, description, and category are required.' });
      }

      const project = ProjectRepository.create(req.session.userId, req.body);
      res.status(201).json({
        success: true,
        message: 'Project published successfully.',
        project
      });
    } catch (err) {
      next(err);
    }
  },

  async updateProject(req, res, next) {
    try {
      const projectId = parseInt(req.params.id, 10);
      const project = ProjectRepository.update(projectId, req.session.userId, req.body);
      res.json({
        success: true,
        message: 'Project updated successfully.',
        project
      });
    } catch (err) {
      next(err);
    }
  },

  async deleteProject(req, res, next) {
    try {
      const projectId = parseInt(req.params.id, 10);
      const isAdmin = req.session.userRole === 'admin';
      const deleted = ProjectRepository.delete(projectId, req.session.userId, isAdmin);
      if (!deleted) {
        return res.status(404).json({ success: false, error: 'Project not found or already deleted.' });
      }
      res.json({ success: true, message: 'Project removed successfully.' });
    } catch (err) {
      next(err);
    }
  }
};
