import { ProfileRepository } from '../repositories/profile.repository.js';

export const StudentController = {
  async discoverStudents(req, res, next) {
    try {
      const filters = {
        name: req.query.name,
        skill: req.query.skill,
        branch: req.query.branch,
        year: req.query.year,
        category: req.query.category
      };

      const students = ProfileRepository.findAllStudents(filters);
      res.json({
        success: true,
        count: students.length,
        students
      });
    } catch (err) {
      next(err);
    }
  },

  async getStudentById(req, res, next) {
    try {
      const studentId = parseInt(req.params.id, 10);
      const student = ProfileRepository.findById(studentId);
      if (!student) {
        return res.status(404).json({ success: false, error: 'Student profile not found.' });
      }
      res.json({ success: true, student });
    } catch (err) {
      next(err);
    }
  }
};
