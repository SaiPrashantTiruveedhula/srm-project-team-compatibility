import { getDbConnection } from '../../database/connection.js';

export const UserRepository = {
  findByEmail(email) {
    const db = getDbConnection();
    return db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(email);
  },

  findById(id) {
    const db = getDbConnection();
    return db.prepare('SELECT id, email, full_name, is_verified, role, status, created_at FROM users WHERE id = ?').get(id);
  },

  create(user) {
    const db = getDbConnection();
    const stmt = db.prepare(`
      INSERT INTO users (email, password_hash, full_name, is_verified, verification_token, token_expires_at, role, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(
      user.email.toLowerCase(),
      user.passwordHash,
      user.fullName,
      user.isVerified ? 1 : 0,
      user.verificationToken || null,
      user.tokenExpiresAt || null,
      user.role || 'student',
      user.status || 'active'
    );
    return info.lastInsertRowid;
  },

  verifyEmail(userId) {
    const db = getDbConnection();
    return db.prepare('UPDATE users SET is_verified = 1, verification_token = NULL WHERE id = ?').run(userId);
  },

  updateStatus(userId, status) {
    const db = getDbConnection();
    return db.prepare('UPDATE users SET status = ? WHERE id = ?').run(status, userId);
  },

  findAll(options = {}) {
    const db = getDbConnection();
    let query = `
      SELECT u.id, u.email, u.full_name, u.is_verified, u.role, u.status, u.created_at,
             sp.branch, sp.academic_year, sp.avatar_url
      FROM users u
      LEFT JOIN student_profiles sp ON u.id = sp.user_id
    `;
    const params = [];
    if (options.role) {
      query += ' WHERE u.role = ?';
      params.push(options.role);
    }
    query += ' ORDER BY u.created_at DESC';
    return db.prepare(query).all(...params);
  }
};
