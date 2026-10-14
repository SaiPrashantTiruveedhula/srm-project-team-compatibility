import { UserRepository } from '../repositories/user.repository.js';

export function requireAdmin(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required.'
    });
  }

  const user = UserRepository.findById(req.session.userId);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Access denied. Administrative privileges required.'
    });
  }

  req.adminUser = user;
  next();
}
