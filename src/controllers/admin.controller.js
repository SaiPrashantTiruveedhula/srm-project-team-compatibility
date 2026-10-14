import { getDbConnection } from '../../database/connection.js';
import { UserRepository } from '../repositories/user.repository.js';

export const AdminController = {
  async getStats(req, res, next) {
    try {
      const db = getDbConnection();

      const userCount = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
      const projectCount = db.prepare('SELECT COUNT(*) as c FROM projects').get().c;
      const teamCount = db.prepare('SELECT COUNT(*) as c FROM teams').get().c;
      const applicationCount = db.prepare('SELECT COUNT(*) as c FROM project_applications').get().c;
      const reportCount = db.prepare("SELECT COUNT(*) as c FROM reports WHERE status = 'pending'").get().c;

      res.json({
        success: true,
        stats: {
          users: userCount,
          projects: projectCount,
          teams: teamCount,
          applications: applicationCount,
          pendingReports: reportCount
        }
      });
    } catch (err) {
      next(err);
    }
  },

  async getUsers(req, res, next) {
    try {
      const users = UserRepository.findAll();
      res.json({ success: true, count: users.length, users });
    } catch (err) {
      next(err);
    }
  },

  async updateUserStatus(req, res, next) {
    try {
      const userId = parseInt(req.params.id, 10);
      const { status } = req.body; // 'active', 'suspended'

      if (!['active', 'suspended'].includes(status)) {
        return res.status(400).json({ success: false, error: 'Invalid user status.' });
      }

      UserRepository.updateStatus(userId, status);
      res.json({ success: true, message: `User status set to ${status}.` });
    } catch (err) {
      next(err);
    }
  },

  async getReports(req, res, next) {
    try {
      const db = getDbConnection();
      const reports = db.prepare(`
        SELECT r.*, u.full_name as reporter_name, u.email as reporter_email
        FROM reports r
        JOIN users u ON r.reporter_id = u.id
        ORDER BY r.created_at DESC
      `).all();

      res.json({ success: true, reports });
    } catch (err) {
      next(err);
    }
  },

  async resolveReport(req, res, next) {
    try {
      const reportId = parseInt(req.params.id, 10);
      const { status } = req.body; // 'reviewed', 'dismissed'

      const db = getDbConnection();
      db.prepare('UPDATE reports SET status = ? WHERE id = ?').run(status, reportId);

      res.json({ success: true, message: `Report marked as ${status}.` });
    } catch (err) {
      next(err);
    }
  }
};
