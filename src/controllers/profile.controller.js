import { ProfileRepository } from '../repositories/profile.repository.js';

export const ProfileController = {
  async getMyProfile(req, res, next) {
    try {
      const profile = ProfileRepository.findByUserId(req.session.userId);
      if (!profile) {
        return res.status(404).json({ success: false, error: 'Profile not found.' });
      }
      res.json({ success: true, profile });
    } catch (err) {
      next(err);
    }
  },

  async updateMyProfile(req, res, next) {
    try {
      const updatedProfile = ProfileRepository.update(req.session.userId, req.body);

      if (Array.isArray(req.body.skills)) {
        ProfileRepository.updateSkills(updatedProfile.id, req.body.skills);
      }

      const finalProfile = ProfileRepository.findByUserId(req.session.userId);
      res.json({
        success: true,
        message: 'Profile updated successfully.',
        profile: finalProfile
      });
    } catch (err) {
      next(err);
    }
  }
};
