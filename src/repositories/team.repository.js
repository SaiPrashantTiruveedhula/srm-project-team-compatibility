import { getDbConnection } from '../../database/connection.js';

export const TeamRepository = {
  findTeamByProjectId(projectId) {
    const db = getDbConnection();
    const team = db.prepare('SELECT * FROM teams WHERE project_id = ?').get(projectId);
    if (!team) return null;

    team.members = db.prepare(`
      SELECT tm.*, u.full_name, u.email, sp.avatar_url, sp.branch, sp.academic_year
      FROM team_members tm
      JOIN users u ON tm.user_id = u.id
      LEFT JOIN student_profiles sp ON u.id = sp.user_id
      WHERE tm.team_id = ?
    `).all(team.id);

    return team;
  },

  findTeamById(teamId) {
    const db = getDbConnection();
    const team = db.prepare('SELECT * FROM teams WHERE id = ?').get(teamId);
    if (!team) return null;

    team.members = db.prepare(`
      SELECT tm.*, u.full_name, u.email, sp.avatar_url, sp.branch, sp.academic_year
      FROM team_members tm
      JOIN users u ON tm.user_id = u.id
      LEFT JOIN student_profiles sp ON u.id = sp.user_id
      WHERE tm.team_id = ?
    `).all(team.id);

    return team;
  },

  findUserTeams(userId) {
    const db = getDbConnection();
    const teams = db.prepare(`
      SELECT t.*, p.title as project_title, p.owner_id as project_owner_id
      FROM teams t
      JOIN team_members tm ON t.id = tm.team_id
      JOIN projects p ON t.project_id = p.id
      WHERE tm.user_id = ?
    `).all(userId);

    for (const team of teams) {
      team.members = db.prepare(`
        SELECT tm.*, u.full_name, u.email, sp.avatar_url, sp.branch, sp.academic_year
        FROM team_members tm
        JOIN users u ON tm.user_id = u.id
        LEFT JOIN student_profiles sp ON u.id = sp.user_id
        WHERE tm.team_id = ?
      `).all(team.id);
    }

    return teams;
  },

  addMember(teamId, userId, role = 'Member') {
    const db = getDbConnection();
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO team_members (team_id, user_id, role)
      VALUES (?, ?, ?)
    `);
    stmt.run(teamId, userId, role);
  },

  removeMember(teamId, userId) {
    const db = getDbConnection();
    db.prepare('DELETE FROM team_members WHERE team_id = ? AND user_id = ?').run(teamId, userId);
  },

  // Applications
  createApplication(data) {
    const db = getDbConnection();
    const existing = db.prepare('SELECT id FROM project_applications WHERE project_id = ? AND applicant_id = ?').get(data.projectId, data.applicantId);
    if (existing) {
      throw new Error('You have already applied to this project.');
    }

    const stmt = db.prepare(`
      INSERT INTO project_applications (project_id, applicant_id, requested_role, pitch, status)
      VALUES (?, ?, ?, ?, 'pending')
    `);
    const info = stmt.run(data.projectId, data.applicantId, data.requestedRole || 'Member', data.pitch || '');
    return info.lastInsertRowid;
  },

  findApplicationsForProject(projectId) {
    const db = getDbConnection();
    return db.prepare(`
      SELECT pa.*, u.full_name, u.email, sp.avatar_url, sp.branch, sp.academic_year
      FROM project_applications pa
      JOIN users u ON pa.applicant_id = u.id
      LEFT JOIN student_profiles sp ON u.id = sp.user_id
      WHERE pa.project_id = ?
      ORDER BY pa.created_at DESC
    `).all(projectId);
  },

  findUserApplications(userId) {
    const db = getDbConnection();
    return db.prepare(`
      SELECT pa.*, p.title as project_title, p.category as project_category
      FROM project_applications pa
      JOIN projects p ON pa.project_id = p.id
      WHERE pa.applicant_id = ?
      ORDER BY pa.created_at DESC
    `).all(userId);
  },

  updateApplicationStatus(applicationId, status) {
    const db = getDbConnection();
    db.prepare('UPDATE project_applications SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(status, applicationId);
    return db.prepare('SELECT * FROM project_applications WHERE id = ?').get(applicationId);
  },

  // Invitations
  createInvitation(data) {
    const db = getDbConnection();
    const existing = db.prepare(`
      SELECT id FROM team_invitations
      WHERE team_id = ? AND invitee_id = ? AND status = 'pending'
    `).get(data.teamId, data.inviteeId);

    if (existing) {
      throw new Error('A pending invitation has already been sent to this student.');
    }

    const stmt = db.prepare(`
      INSERT INTO team_invitations (team_id, project_id, inviter_id, invitee_id, offered_role, message, status)
      VALUES (?, ?, ?, ?, ?, ?, 'pending')
    `);
    const info = stmt.run(
      data.teamId,
      data.projectId,
      data.inviterId,
      data.inviteeId,
      data.offeredRole || 'Member',
      data.message || ''
    );
    return info.lastInsertRowid;
  },

  findUserInvitations(userId) {
    const db = getDbConnection();
    return db.prepare(`
      SELECT ti.*, p.title as project_title, u.full_name as inviter_name, t.name as team_name
      FROM team_invitations ti
      JOIN projects p ON ti.project_id = p.id
      JOIN users u ON ti.inviter_id = u.id
      JOIN teams t ON ti.team_id = t.id
      WHERE ti.invitee_id = ?
      ORDER BY ti.created_at DESC
    `).all(userId);
  },

  updateInvitationStatus(invitationId, status) {
    const db = getDbConnection();
    db.prepare('UPDATE team_invitations SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(status, invitationId);
    return db.prepare('SELECT * FROM team_invitations WHERE id = ?').get(invitationId);
  }
};
