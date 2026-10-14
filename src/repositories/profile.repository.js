import { getDbConnection } from '../../database/connection.js';

export const ProfileRepository = {
  findByUserId(userId) {
    const db = getDbConnection();
    const profile = db.prepare(`
      SELECT sp.*, u.full_name, u.email, u.role, u.status
      FROM student_profiles sp
      JOIN users u ON sp.user_id = u.id
      WHERE sp.user_id = ?
    `).get(userId);

    if (profile) {
      profile.skills = this.getSkills(profile.id);
    }
    return profile;
  },

  findById(id) {
    const db = getDbConnection();
    const profile = db.prepare(`
      SELECT sp.*, u.full_name, u.email, u.role, u.status
      FROM student_profiles sp
      JOIN users u ON sp.user_id = u.id
      WHERE sp.id = ?
    `).get(id);

    if (profile) {
      profile.skills = this.getSkills(profile.id);
    }
    return profile;
  },

  getSkills(profileId) {
    const db = getDbConnection();
    return db.prepare(`
      SELECT s.id, s.name, s.category, ss.proficiency
      FROM student_skills ss
      JOIN skills s ON ss.skill_id = s.id
      WHERE ss.student_id = ?
    `).all(profileId);
  },

  update(userId, data) {
    const db = getDbConnection();
    const stmt = db.prepare(`
      UPDATE student_profiles SET
        bio = ?,
        branch = ?,
        academic_year = ?,
        campus = ?,
        github_url = ?,
        linkedin_url = ?,
        portfolio_url = ?,
        availability = ?,
        preferred_team_size = ?,
        preferred_categories = ?,
        achievements = ?,
        hackathon_exp = ?,
        avatar_url = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `);

    stmt.run(
      data.bio || '',
      data.branch || 'Computer Science and Engineering',
      data.academicYear || '2nd Year',
      data.campus || 'Kattankulathur',
      data.githubUrl || '',
      data.linkedinUrl || '',
      data.portfolioUrl || '',
      data.availability || '10 hrs/week',
      parseInt(data.preferredTeamSize, 10) || 4,
      data.preferredCategories || '',
      data.achievements || '',
      data.hackathonExp || '',
      data.avatarUrl || '',
      userId
    );

    // Update full name in users table if provided
    if (data.fullName) {
      db.prepare('UPDATE users SET full_name = ? WHERE id = ?').run(data.fullName, userId);
    }

    return this.findByUserId(userId);
  },

  updateSkills(profileId, skillsArray) {
    const db = getDbConnection();

    // Clear existing skills
    db.prepare('DELETE FROM student_skills WHERE student_id = ?').run(profileId);

    const getSkill = db.prepare('SELECT id FROM skills WHERE LOWER(name) = LOWER(?)');
    const insertSkill = db.prepare('INSERT INTO skills (name, category) VALUES (?, ?)');
    const linkSkill = db.prepare('INSERT INTO student_skills (student_id, skill_id, proficiency) VALUES (?, ?, ?)');

    for (const item of skillsArray) {
      const skillName = typeof item === 'string' ? item.trim() : item.name.trim();
      const prof = (typeof item === 'object' && item.proficiency) ? item.proficiency : 'Intermediate';
      if (!skillName) continue;

      let skill = getSkill.get(skillName);
      let skillId;
      if (!skill) {
        const info = insertSkill.run(skillName, 'Technical');
        skillId = info.lastInsertRowid;
      } else {
        skillId = skill.id;
      }

      try {
        linkSkill.run(profileId, skillId, prof);
      } catch (err) {
        // Ignore duplicate key if any
      }
    }

    return this.getSkills(profileId);
  },

  findAllStudents(filters = {}) {
    const db = getDbConnection();
    let query = `
      SELECT sp.*, u.full_name, u.email, u.status
      FROM student_profiles sp
      JOIN users u ON sp.user_id = u.id
      WHERE u.status = 'active'
    `;
    const params = [];

    if (filters.name) {
      query += ' AND LOWER(u.full_name) LIKE LOWER(?)';
      params.push(`%${filters.name}%`);
    }

    if (filters.branch) {
      query += ' AND sp.branch = ?';
      params.push(filters.branch);
    }

    if (filters.year) {
      query += ' AND sp.academic_year = ?';
      params.push(filters.year);
    }

    if (filters.category) {
      query += ' AND sp.preferred_categories LIKE ?';
      params.push(`%${filters.category}%`);
    }

    query += ' ORDER BY sp.updated_at DESC';

    const profiles = db.prepare(query).all(...params);

    for (const p of profiles) {
      p.skills = this.getSkills(p.id);
    }

    // Filter by skill name if provided
    if (filters.skill) {
      const targetSkill = filters.skill.toLowerCase();
      return profiles.filter(p => p.skills.some(s => s.name.toLowerCase().includes(targetSkill)));
    }

    return profiles;
  }
};
