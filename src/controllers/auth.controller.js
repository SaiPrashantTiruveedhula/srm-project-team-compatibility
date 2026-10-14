import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { UserRepository } from '../repositories/user.repository.js';
import { ProfileRepository } from '../repositories/profile.repository.js';
import { getDbConnection } from '../../database/connection.js';

export const AuthController = {
  async register(req, res, next) {
    try {
      const { email, password, confirmPassword, fullName } = req.body;

      if (!email || !password || !fullName) {
        return res.status(400).json({ success: false, error: 'Full name, email, and password are required.' });
      }

      if (password !== confirmPassword) {
        return res.status(400).json({ success: false, error: 'Password and confirm password do not match.' });
      }

      if (password.length < 8) {
        return res.status(400).json({ success: false, error: 'Password must be at least 8 characters long.' });
      }

      // MANDATORY DOMAIN CHECK FOR SRMIST
      const cleanEmail = email.trim().toLowerCase();
      if (!cleanEmail.endsWith('@srmist.edu.in')) {
        return res.status(400).json({
          success: false,
          error: 'Registration is restricted strictly to official SRMIST email addresses ending in @srmist.edu.in'
        });
      }

      const existingUser = UserRepository.findByEmail(cleanEmail);
      if (existingUser) {
        return res.status(400).json({ success: false, error: 'An account with this SRM email already exists.' });
      }

      const passwordHash = bcrypt.hashSync(password, 10);
      const devMode = process.env.DEV_VERIFICATION_MODE !== 'false';
      const isVerified = devMode ? 1 : 0;
      const verificationToken = crypto.randomBytes(20).toString('hex');
      const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      const userId = UserRepository.create({
        email: cleanEmail,
        passwordHash,
        fullName: fullName.trim(),
        isVerified,
        verificationToken,
        tokenExpiresAt,
        role: 'student',
        status: 'active'
      });

      // Create default student profile record
      const db = getDbConnection();
      db.prepare(`
        INSERT INTO student_profiles (user_id, bio, branch, academic_year, campus)
        VALUES (?, 'SRMIST Student passionate about technology projects.', 'Computer Science and Engineering', '2nd Year', 'Kattankulathur')
      `).run(userId);

      // Save user session
      req.session.userId = userId;
      req.session.userRole = 'student';

      res.status(201).json({
        success: true,
        message: devMode
          ? 'Account registered successfully (Development verification mode active: account auto-verified).'
          : 'Account registered successfully. Please check your SRM email to verify your account.',
        verificationToken: devMode ? verificationToken : undefined,
        user: UserRepository.findById(userId)
      });
    } catch (err) {
      next(err);
    }
  },

  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ success: false, error: 'Email and password are required.' });
      }

      const user = UserRepository.findByEmail(email.trim());
      if (!user) {
        return res.status(401).json({ success: false, error: 'Invalid SRM email or password.' });
      }

      if (user.status === 'suspended') {
        return res.status(403).json({ success: false, error: 'Your account has been suspended by administration.' });
      }

      const isMatch = bcrypt.compareSync(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({ success: false, error: 'Invalid SRM email or password.' });
      }

      req.session.userId = user.id;
      req.session.userRole = user.role;

      const safeUser = UserRepository.findById(user.id);
      const profile = ProfileRepository.findByUserId(user.id);

      req.session.save((err) => {
  if (err) {
    return next(err);
  }

  res.json({
    success: true,
    message: 'Login successful.',
    user: safeUser,
    profile
  });
});
    } catch (err) {
      next(err);
    }
  },

  async logout(req, res, next) {
    try {
      req.session.destroy(err => {
        if (err) return next(err);
        res.clearCookie('connect.sid');
        res.json({ success: true, message: 'Logged out successfully.' });
      });
    } catch (err) {
      next(err);
    }
  },

  async me(req, res, next) {
    try {
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ success: false, error: 'Not authenticated.' });
      }

      const user = UserRepository.findById(req.session.userId);
      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found.' });
      }

      const profile = ProfileRepository.findByUserId(user.id);

      res.json({
        success: true,
        user,
        profile
      });
    } catch (err) {
      next(err);
    }
  },

  async verifyEmail(req, res, next) {
    try {
      const { token } = req.body;
      if (!token) {
        return res.status(400).json({ success: false, error: 'Verification token is required.' });
      }

      const db = getDbConnection();
      const user = db.prepare('SELECT * FROM users WHERE verification_token = ?').get(token);
      if (!user) {
        return res.status(400).json({ success: false, error: 'Invalid or expired verification token.' });
      }

      UserRepository.verifyEmail(user.id);
      res.json({ success: true, message: 'Email address verified successfully.' });
    } catch (err) {
      next(err);
    }
  }
};
