import { getDbConnection } from '../../database/connection.js';

export const NotificationRepository = {
  create(userId, title, message, link = '') {
    const db = getDbConnection();
    const stmt = db.prepare(`
      INSERT INTO notifications (user_id, title, message, link, is_read)
      VALUES (?, ?, ?, ?, 0)
    `);
    const info = stmt.run(userId, title, message, link);
    return info.lastInsertRowid;
  },

  findUserNotifications(userId) {
    const db = getDbConnection();
    return db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50').all(userId);
  },

  getUnreadCount(userId) {
    const db = getDbConnection();
    const res = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0').get(userId);
    return res ? res.count : 0;
  },

  markAsRead(notificationId, userId) {
    const db = getDbConnection();
    db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(notificationId, userId);
  },

  markAllAsRead(userId) {
    const db = getDbConnection();
    db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(userId);
  }
};
