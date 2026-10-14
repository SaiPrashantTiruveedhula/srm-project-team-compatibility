import { ProjectRepository } from '../repositories/project.repository.js';
import { ProfileRepository } from '../repositories/profile.repository.js';
import { MatchingService } from './matching.service.js';

export const TeamGeneratorService = {
  generateTeamCombinations(projectId, options = {}) {
    const project = ProjectRepository.findById(projectId);
    if (!project) throw new Error('Project not found');

    const targetTeamSize = parseInt(options.teamSize || project.desired_team_size || 4, 10);
    const reqSkills = project.required_skills || [];
    const roles = project.roles || [];

    const allStudents = ProfileRepository.findAllStudents();
    // Exclude project owner
    const candidates = allStudents.filter(s => s.user_id !== project.owner_id);

    // Score each candidate individually
    const scoredCandidates = candidates.map(student => {
      const match = MatchingService.calculateCompatibility(student, project);
      return { student, match };
    });

    // Sort by compatibility descending
    scoredCandidates.sort((a, b) => b.match.compatibilityPercentage - a.match.compatibilityPercentage);

    // Take top N candidate pool (e.g. top 10) to generate combinations
    const pool = scoredCandidates.slice(0, 10);
    const slotsToFill = Math.max(1, targetTeamSize - 1); // Owner takes 1 slot

    if (pool.length < slotsToFill) {
      return {
        projectId: project.id,
        projectTitle: project.title,
        targetTeamSize,
        message: 'Not enough candidate profiles available to generate full team options. Consider relaxing filters.',
        combinations: []
      };
    }

    // Helper: generate k-subsets from array
    function getSubsets(arr, k) {
      const results = [];
      function backtrack(start, current) {
        if (current.length === k) {
          results.push([...current]);
          return;
        }
        for (let i = start; i < arr.length; i++) {
          current.push(arr[i]);
          backtrack(i + 1, current);
          current.pop();
        }
      }
      backtrack(0, []);
      return results;
    }

    const rawSubsets = getSubsets(pool, slotsToFill);

    // Evaluate each combination as a team
    const evaluatedCombinations = rawSubsets.map((combo, idx) => {
      const members = combo.map(c => c.student);
      const memberScores = combo.map(c => c.match.compatibilityPercentage);
      const avgCompatibility = Math.round(memberScores.reduce((a, b) => a + b, 0) / memberScores.length);

      // Skill coverage analysis
      const coveredSet = new Set();
      for (const m of members) {
        for (const s of m.skills) {
          coveredSet.add(s.name.toLowerCase());
        }
      }

      let coveredReqCount = 0;
      const missingSkills = [];
      for (const req of reqSkills) {
        if (coveredSet.has(req.name.toLowerCase())) {
          coveredReqCount++;
        } else {
          missingSkills.push(req.name);
        }
      }

      const skillCoveragePct = reqSkills.length === 0 ? 100 : Math.round((coveredReqCount / reqSkills.length) * 100);

      // Holistic team score combines avg individual score and total skill coverage
      const overallTeamScore = Math.round(avgCompatibility * 0.6 + skillCoveragePct * 0.4);

      return {
        combinationId: idx + 1,
        overallTeamScore,
        avgCompatibility,
        skillCoveragePct,
        members: combo.map(c => ({
          studentId: c.student.id,
          userId: c.student.user_id,
          fullName: c.student.full_name,
          branch: c.student.branch,
          academicYear: c.student.academic_year,
          avatarUrl: c.student.avatar_url,
          compatibilityPercentage: c.match.compatibilityPercentage,
          matchingSkills: c.match.matchingSkills,
          complementarySkills: c.match.complementarySkills,
          explanation: c.match.explanation
        })),
        missingSkills
      };
    });

    // Sort combinations by overall team score descending
    evaluatedCombinations.sort((a, b) => b.overallTeamScore - a.overallTeamScore);

    return {
      projectId: project.id,
      projectTitle: project.title,
      targetTeamSize,
      combinations: evaluatedCombinations.slice(0, 3) // Return top 3 combinations
    };
  }
};
