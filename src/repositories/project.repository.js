import { getDbConnection } from '../../database/connection.js';

export const ProjectRepository = {
  findById(id) {
    const db = getDbConnection();
    const project = db.prepare(`
      SELECT p.*, u.full_name as owner_name, u.email as owner_email, sp.avatar_url as owner_avatar
      FROM projects p
      JOIN users u ON p.owner_id = u.id
      LEFT JOIN student_profiles sp ON u.id = sp.user_id
      WHERE p.id = ?
    `).get(id);

    if (project) {
      project.required_skills = this.getRequiredSkills(project.id);
      project.optional_skills = this.getOptionalSkills(project.id);
      project.roles = this.getRoles(project.id);
    }
    return project;
  },

  getRequiredSkills(projectId) {
    const db = getDbConnection();
    return db.prepare(`
      SELECT s.id, s.name, s.category, prs.min_proficiency
      FROM project_required_skills prs
      JOIN skills s ON prs.skill_id = s.id
      WHERE prs.project_id = ?
    `).all(projectId);
  },

  getOptionalSkills(projectId) {
    const db = getDbConnection();
    return db.prepare(`
      SELECT s.id, s.name, s.category
      FROM project_optional_skills pos
      JOIN skills s ON pos.skill_id = s.id
      WHERE pos.project_id = ?
    `).all(projectId);
  },

  getRoles(projectId) {
    const db = getDbConnection();
    return db.prepare('SELECT * FROM project_roles WHERE project_id = ?').all(projectId);
  },

  create(ownerId, data) {
    const db = getDbConnection();
    const stmt = db.prepare(`
      INSERT INTO projects (
        owner_id, title, description, category, problem_statement, goals,
        desired_team_size, preferred_years, preferred_branches, experience_reqs, duration, availability_reqs, deadline, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open')
    `);

    const info = stmt.run(
      ownerId,
      data.title,
      data.description,
      data.category,
      data.problemStatement || '',
      data.goals || '',
      parseInt(data.desiredTeamSize, 10) || 4,
      Array.isArray(data.preferredYears) ? data.preferredYears.join(', ') : (data.preferredYears || ''),
      Array.isArray(data.preferredBranches) ? data.preferredBranches.join(', ') : (data.preferredBranches || ''),
      data.experienceReqs || '',
      data.duration || '4-8 weeks',
      data.availabilityReqs || '10 hrs/week',
      data.deadline || null
    );

    const projectId = info.lastInsertRowid;

    // Create automatic Team for this project
    const teamStmt = db.prepare('INSERT INTO teams (project_id, name) VALUES (?, ?)');
    const teamInfo = teamStmt.run(projectId, `${data.title} Team`);
    const teamId = teamInfo.lastInsertRowid;

    // Add Owner to Team
    db.prepare('INSERT INTO team_members (team_id, user_id, role) VALUES (?, ?, ?)')
      .run(teamId, ownerId, 'Project Owner');

    // Add Required Skills
    if (Array.isArray(data.requiredSkills)) {
      this.updateRequiredSkills(projectId, data.requiredSkills);
    }

    // Add Optional Skills
    if (Array.isArray(data.optionalSkills)) {
      this.updateOptionalSkills(projectId, data.optionalSkills);
    }

    // Add Roles
    if (Array.isArray(data.roles)) {
      const roleStmt = db.prepare('INSERT INTO project_roles (project_id, role_name, slots_needed, slots_filled) VALUES (?, ?, ?, ?)');
      for (const r of data.roles) {
        const roleName = typeof r === 'string' ? r : r.name;
        const slotsNeeded = typeof r === 'object' ? (parseInt(r.slotsNeeded, 10) || 1) : 1;
        if (roleName) roleStmt.run(projectId, roleName, slotsNeeded, 0);
      }
    }

    return this.findById(projectId);
  },

  update(projectId, ownerId, data) {
    const db = getDbConnection();

    // Verify ownership
    const proj = db.prepare('SELECT owner_id FROM projects WHERE id = ?').get(projectId);
    if (!proj || proj.owner_id !== ownerId) {
      throw new Error('Unauthorized to modify this project.');
    }

    db.prepare(`
      UPDATE projects SET
        title = ?,
        description = ?,
        category = ?,
        problem_statement = ?,
        goals = ?,
        desired_team_size = ?,
        preferred_years = ?,
        preferred_branches = ?,
        experience_reqs = ?,
        duration = ?,
        availability_reqs = ?,
        deadline = ?,
        status = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      data.title,
      data.description,
      data.category,
      data.problemStatement || '',
      data.goals || '',
      parseInt(data.desiredTeamSize, 10) || 4,
      Array.isArray(data.preferredYears) ? data.preferredYears.join(', ') : (data.preferredYears || ''),
      Array.isArray(data.preferredBranches) ? data.preferredBranches.join(', ') : (data.preferredBranches || ''),
      data.experienceReqs || '',
      data.duration || '4-8 weeks',
      data.availabilityReqs || '10 hrs/week',
      data.deadline || null,
      data.status || 'open',
      projectId
    );

    if (Array.isArray(data.requiredSkills)) {
      this.updateRequiredSkills(projectId, data.requiredSkills);
    }

    if (Array.isArray(data.optionalSkills)) {
      this.updateOptionalSkills(projectId, data.optionalSkills);
    }

    return this.findById(projectId);
  },

  delete(projectId, ownerId, isAdmin = false) {
    const db = getDbConnection();
    const proj = db.prepare('SELECT owner_id FROM projects WHERE id = ?').get(projectId);
    if (!proj) return false;

    if (!isAdmin && proj.owner_id !== ownerId) {
      throw new Error('Unauthorized to delete this project.');
    }

    db.prepare('DELETE FROM projects WHERE id = ?').run(projectId);
    return true;
  },

  updateRequiredSkills(projectId, skillsArray) {
    const db = getDbConnection();
    db.prepare('DELETE FROM project_required_skills WHERE project_id = ?').run(projectId);

    const getSkill = db.prepare('SELECT id FROM skills WHERE LOWER(name) = LOWER(?)');
    const insertSkill = db.prepare('INSERT INTO skills (name, category) VALUES (?, ?)');
    const linkSkill = db.prepare('INSERT INTO project_required_skills (project_id, skill_id, min_proficiency) VALUES (?, ?, ?)');

    for (const item of skillsArray) {
      const name = typeof item === 'string' ? item.trim() : item.name.trim();
      const minProf = (typeof item === 'object' && item.minProficiency) ? item.minProficiency : 'Intermediate';
      if (!name) continue;

      let skill = getSkill.get(name);
      let skillId;
      if (!skill) {
        const info = insertSkill.run(name, 'Technical');
        skillId = info.lastInsertRowid;
      } else {
        skillId = skill.id;
      }

      try {
        linkSkill.run(projectId, skillId, minProf);
      } catch (err) {}
    }
  },

  updateOptionalSkills(projectId, skillsArray) {
    const db = getDbConnection();
    db.prepare('DELETE FROM project_optional_skills WHERE project_id = ?').run(projectId);

    const getSkill = db.prepare('SELECT id FROM skills WHERE LOWER(name) = LOWER(?)');
    const insertSkill = db.prepare('INSERT INTO skills (name, category) VALUES (?, ?)');
    const linkSkill = db.prepare('INSERT INTO project_optional_skills (project_id, skill_id) VALUES (?, ?)');

    for (const item of skillsArray) {
      const name = typeof item === 'string' ? item.trim() : item.name.trim();
      if (!name) continue;

      let skill = getSkill.get(name);
      let skillId;
      if (!skill) {
        const info = insertSkill.run(name, 'Technical');
        skillId = info.lastInsertRowid;
      } else {
        skillId = skill.id;
      }

      try {
        linkSkill.run(projectId, skillId);
      } catch (err) {}
    }
  },

  findAll(filters = {}) {
    const db = getDbConnection();
    let query = `
      SELECT p.*, u.full_name as owner_name, sp.avatar_url as owner_avatar
      FROM projects p
      JOIN users u ON p.owner_id = u.id
      LEFT JOIN student_profiles sp ON u.id = sp.user_id
      WHERE 1=1
    `;
    const params = [];

    if (filters.category) {
      query += ' AND p.category = ?';
      params.push(filters.category);
    }

    if (filters.status) {
      query += ' AND p.status = ?';
      params.push(filters.status);
    }

    if (filters.ownerId) {
      query += ' AND p.owner_id = ?';
      params.push(filters.ownerId);
    }

    if (filters.search) {
      query += ' AND (LOWER(p.title) LIKE LOWER(?) OR LOWER(p.description) LIKE LOWER(?))';
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    query += ' ORDER BY p.created_at DESC';

    const projects = db.prepare(query).all(...params);

    for (const proj of projects) {
      proj.required_skills = this.getRequiredSkills(proj.id);
      proj.optional_skills = this.getOptionalSkills(proj.id);
      proj.roles = this.getRoles(proj.id);
    }

    if (filters.skill) {
      const targetSkill = filters.skill.toLowerCase();
      return projects.filter(p =>
        p.required_skills.some(s => s.name.toLowerCase().includes(targetSkill)) ||
        p.optional_skills.some(s => s.name.toLowerCase().includes(targetSkill))
      );
    }

    return projects;
  }
};
