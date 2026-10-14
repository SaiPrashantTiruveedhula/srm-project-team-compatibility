import { NotificationRepository } from '../repositories/notification.repository.js';

export const NotificationController = {
  async getNotifications(req, res, next) {
    try {
      const userId = req.session.userId;
      const notifications = NotificationRepository.findUserNotifications(userId);
      const unreadCount = NotificationRepository.getUnreadCount(userId);

      res.json({
        success: true,
        unreadCount,
        notifications
      });
    } catch (err) {
      next(err);
    }
  },

  async markAsRead(req, res, next) {
    try {
      const notifId = parseInt(req.params.id, 10);
      NotificationRepository.markAsRead(notifId, req.session.userId);
      res.json({ success: true, message: 'Notification marked as read.' });
    } catch (err) {
      next(err);
    }
  },

  async markAllAsRead(req, res, next) {
    try {
      NotificationRepository.markAllAsRead(req.session.userId);
      res.json({ success: true, message: 'All notifications marked as read.' });
    } catch (err) {
      next(err);
    }
  }
};
