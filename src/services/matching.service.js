import { MATCHING_WEIGHTS, PROFICIENCY_SCORES } from '../config/matching.config.js';
import { ProjectRepository } from '../repositories/project.repository.js';
import { ProfileRepository } from '../repositories/profile.repository.js';

export const MatchingService = {
  calculateCompatibility(studentProfile, project) {
    const reqSkills = project.required_skills || [];
    const optSkills = project.optional_skills || [];
    const studentSkills = studentProfile.skills || [];

    // 1. Required Skills Overlap (35%)
    let reqScore = 0;
    const matchingSkills = [];
    const missingSkills = [];

    if (reqSkills.length === 0) {
      reqScore = 1.0; // If project asks for 0 required skills, full score
    } else {
      let earnedReq = 0;
      for (const req of reqSkills) {
        const found = studentSkills.find(s => s.name.toLowerCase() === req.name.toLowerCase());
        if (found) {
          matchingSkills.push(found.name);
          const candidateProf = PROFICIENCY_SCORES[found.proficiency] || 2;
          const reqProf = PROFICIENCY_SCORES[req.min_proficiency] || 2;
          earnedReq += Math.min(candidateProf / reqProf, 1.2) / reqSkills.length;
        } else {
          missingSkills.push(req.name);
        }
      }
      reqScore = Math.min(earnedReq, 1.0);
    }

    // 2. Complementary Skills & Roles (20%)
    const complementarySkills = [];
    let compScore = 0;

    for (const stSkill of studentSkills) {
      const isReq = reqSkills.some(r => r.name.toLowerCase() === stSkill.name.toLowerCase());
      const isOpt = optSkills.some(o => o.name.toLowerCase() === stSkill.name.toLowerCase());

      if (!isReq) {
        complementarySkills.push(stSkill.name);
        if (isOpt) compScore += 0.3;
        else compScore += 0.1;
      }
    }
    compScore = Math.min(compScore, 1.0);

    // 3. Relevant Experience & Hackathons (15%)
    let expScore = 0.5; // Base score
    const hasCategoryExp = studentProfile.preferred_categories &&
      studentProfile.preferred_categories.toLowerCase().includes(project.category.toLowerCase());
    if (hasCategoryExp) expScore += 0.3;
    if (studentProfile.hackathon_exp && studentProfile.hackathon_exp.length > 5) expScore += 0.2;
    expScore = Math.min(expScore, 1.0);

    // 4. Project Interests & Categories (10%)
    let interestScore = 0.3;
    if (studentProfile.preferred_categories) {
      const cats = studentProfile.preferred_categories.split(',').map(c => c.trim().toLowerCase());
      if (cats.includes(project.category.toLowerCase())) {
        interestScore = 1.0;
      }
    }

    // 5. Availability Match (10%)
    let availScore = 0.7;
    if (studentProfile.availability && project.availability_reqs) {
      const candidateHours = parseInt(studentProfile.availability, 10) || 10;
      const reqHours = parseInt(project.availability_reqs, 10) || 10;
      availScore = Math.min(candidateHours / reqHours, 1.0);
    }

    // 6. Academic Preferences (10%)
    let academicScore = 0.5;
    if (project.preferred_branches && project.preferred_branches.includes(studentProfile.branch)) {
      academicScore += 0.3;
    }
    if (project.preferred_years && project.preferred_years.includes(studentProfile.academic_year)) {
      academicScore += 0.2;
    }
    academicScore = Math.min(academicScore, 1.0);

    // Final Weighted Calculation
    const totalScoreFloat = (
      reqScore * MATCHING_WEIGHTS.requiredSkills +
      compScore * MATCHING_WEIGHTS.complementarySkills +
      expScore * MATCHING_WEIGHTS.relevantExperience +
      interestScore * MATCHING_WEIGHTS.projectInterests +
      availScore * MATCHING_WEIGHTS.availability +
      academicScore * MATCHING_WEIGHTS.academicPreferences
    );

    const compatibilityPercentage = Math.round(totalScoreFloat * 100);

    // Reason Summary
    const reasons = [];
    if (matchingSkills.length > 0) {
      reasons.push(`Has required skills: ${matchingSkills.join(', ')}.`);
    }
    if (complementarySkills.length > 0) {
      reasons.push(`Brings complementary skills: ${complementarySkills.slice(0, 3).join(', ')}.`);
    }
    if (hasCategoryExp) {
      reasons.push(`Strong interest/experience in ${project.category} projects.`);
    }
    if (academicScore >= 0.8) {
      reasons.push(`Matches academic branch (${studentProfile.branch}) & year (${studentProfile.academic_year}).`);
    }

    const explanation = reasons.length > 0
      ? reasons.join(' ')
      : 'Solid academic background with growing skill set for team collaboration.';

    return {
      compatibilityPercentage,
      matchingSkills,
      missingSkills,
      complementarySkills,
      explanation
    };
  },

  getRecommendationsForProject(projectId, limit = 20) {
    const project = ProjectRepository.findById(projectId);
    if (!project) throw new Error('Project not found');

    const allStudents = ProfileRepository.findAllStudents();
    // Exclude owner
    const candidates = allStudents.filter(s => s.user_id !== project.owner_id);

    const results = candidates.map(student => {
      const match = this.calculateCompatibility(student, project);
      return {
        student,
        match
      };
    });

    results.sort((a, b) => b.match.compatibilityPercentage - a.match.compatibilityPercentage);
    return results.slice(0, limit);
  },

  analyzeSkillGaps(projectId, teamMembers = []) {
    const project = ProjectRepository.findById(projectId);
    if (!project) throw new Error('Project not found');

    const reqSkills = project.required_skills || [];
    const roles = project.roles || [];

    // Collect all skills from accepted team members
    const coveredSkillsMap = new Map();
    const allCandidateSkills = [];

    for (const member of teamMembers) {
      const profile = ProfileRepository.findByUserId(member.user_id);
      if (profile && profile.skills) {
        for (const s of profile.skills) {
          allCandidateSkills.push(s);
          const current = coveredSkillsMap.get(s.name.toLowerCase()) || 0;
          const score = PROFICIENCY_SCORES[s.proficiency] || 1;
          if (score > current) {
            coveredSkillsMap.set(s.name.toLowerCase(), score);
          }
        }
      }
    }

    const covered = [];
    const partiallyCovered = [];
    const missing = [];

    for (const req of reqSkills) {
      const nameKey = req.name.toLowerCase();
      const reqScore = PROFICIENCY_SCORES[req.min_proficiency] || 2;
      const memberScore = coveredSkillsMap.get(nameKey);

      if (!memberScore) {
        missing.push(req.name);
      } else if (memberScore >= reqScore) {
        covered.push(req.name);
      } else {
        partiallyCovered.push(req.name);
      }
    }

    // Role gap analysis
    const missingRoles = roles.filter(r => r.slots_filled < r.slots_needed).map(r => r.role_name);

    return {
      projectId: project.id,
      projectTitle: project.title,
      requiredSkillsCount: reqSkills.length,
      covered,
      partiallyCovered,
      missing,
      missingRoles
    };
  }
};
