import { MatchingService } from '../services/matching.service.js';
import { TeamGeneratorService } from '../services/teamGenerator.service.js';
import { TeamRepository } from '../repositories/team.repository.js';

export const MatchingController = {
  async getRecommendations(req, res, next) {
    try {
      const { projectId } = req.body;
      if (!projectId) {
        return res.status(400).json({ success: false, error: 'projectId is required for recommendations.' });
      }

      const recommendations = MatchingService.getRecommendationsForProject(parseInt(projectId, 10));
      res.json({
        success: true,
        count: recommendations.length,
        recommendations
      });
    } catch (err) {
      next(err);
    }
  },

  async generateTeam(req, res, next) {
    try {
      const { projectId, teamSize } = req.body;
      if (!projectId) {
        return res.status(400).json({ success: false, error: 'projectId is required to generate team options.' });
      }

      const result = TeamGeneratorService.generateTeamCombinations(parseInt(projectId, 10), { teamSize });
      res.json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  },

  async getSkillGaps(req, res, next) {
    try {
      const projectId = parseInt(req.query.projectId, 10);
      if (!projectId) {
        return res.status(400).json({ success: false, error: 'projectId is required.' });
      }

      const team = TeamRepository.findTeamByProjectId(projectId);
      const members = team ? team.members : [];
      const gaps = MatchingService.analyzeSkillGaps(projectId, members);

      res.json({
        success: true,
        gaps
      });
    } catch (err) {
      next(err);
    }
  }
};
