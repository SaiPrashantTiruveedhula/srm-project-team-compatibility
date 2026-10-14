import { getDbConnection } from './connection.js';

export function initializeDatabase(options = {}) {
  const db = getDbConnection();

  if (options.reset) {
    db.exec(`
      DROP TABLE IF EXISTS reports;
      DROP TABLE IF EXISTS notifications;
      DROP TABLE IF EXISTS team_invitations;
      DROP TABLE IF EXISTS team_members;
      DROP TABLE IF EXISTS teams;
      DROP TABLE IF EXISTS project_applications;
      DROP TABLE IF EXISTS project_roles;
      DROP TABLE IF EXISTS project_optional_skills;
      DROP TABLE IF EXISTS project_required_skills;
      DROP TABLE IF EXISTS projects;
      DROP TABLE IF EXISTS student_skills;
      DROP TABLE IF EXISTS skills;
      DROP TABLE IF EXISTS student_profiles;
      DROP TABLE IF EXISTS users;
    `);
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      is_verified INTEGER DEFAULT 0,
      verification_token TEXT,
      token_expires_at DATETIME,
      role TEXT DEFAULT 'student' CHECK (role IN ('student', 'admin')),
      status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS student_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      bio TEXT DEFAULT '',
      branch TEXT DEFAULT 'Computer Science and Engineering',
      academic_year TEXT DEFAULT '2nd Year',
      campus TEXT DEFAULT 'Kattankulathur',
      github_url TEXT DEFAULT '',
      linkedin_url TEXT DEFAULT '',
      portfolio_url TEXT DEFAULT '',
      availability TEXT DEFAULT '10-15 hrs/week',
      preferred_team_size INTEGER DEFAULT 4,
      preferred_categories TEXT DEFAULT '',
      achievements TEXT DEFAULT '',
      hackathon_exp TEXT DEFAULT '',
      avatar_url TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS skills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      category TEXT DEFAULT 'Technical'
    );

    CREATE TABLE IF NOT EXISTS student_skills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      skill_id INTEGER NOT NULL,
      proficiency TEXT DEFAULT 'Intermediate' CHECK (proficiency IN ('Beginner', 'Intermediate', 'Advanced')),
      FOREIGN KEY (student_id) REFERENCES student_profiles(id) ON DELETE CASCADE,
      FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE,
      UNIQUE(student_id, skill_id)
    );

    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      owner_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      problem_statement TEXT DEFAULT '',
      goals TEXT DEFAULT '',
      desired_team_size INTEGER DEFAULT 4,
      preferred_years TEXT DEFAULT '',
      preferred_branches TEXT DEFAULT '',
      experience_reqs TEXT DEFAULT '',
      duration TEXT DEFAULT '4-8 weeks',
      availability_reqs TEXT DEFAULT '10 hrs/week',
      deadline DATETIME,
      status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS project_required_skills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      skill_id INTEGER NOT NULL,
      min_proficiency TEXT DEFAULT 'Intermediate',
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE,
      UNIQUE(project_id, skill_id)
    );

    CREATE TABLE IF NOT EXISTS project_optional_skills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      skill_id INTEGER NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE,
      UNIQUE(project_id, skill_id)
    );

    CREATE TABLE IF NOT EXISTS project_roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      role_name TEXT NOT NULL,
      slots_needed INTEGER DEFAULT 1,
      slots_filled INTEGER DEFAULT 0,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS project_applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      applicant_id INTEGER NOT NULL,
      requested_role TEXT DEFAULT 'Member',
      pitch TEXT DEFAULT '',
      status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (applicant_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(project_id, applicant_id)
    );

    CREATE TABLE IF NOT EXISTS teams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER UNIQUE NOT NULL,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS team_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      team_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      role TEXT DEFAULT 'Member',
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(team_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS team_invitations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      team_id INTEGER NOT NULL,
      project_id INTEGER NOT NULL,
      inviter_id INTEGER NOT NULL,
      invitee_id INTEGER NOT NULL,
      offered_role TEXT DEFAULT 'Member',
      message TEXT DEFAULT '',
      status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (inviter_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (invitee_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      link TEXT DEFAULT '',
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reporter_id INTEGER NOT NULL,
      target_type TEXT NOT NULL CHECK (target_type IN ('user', 'project')),
      target_id INTEGER NOT NULL,
      reason TEXT NOT NULL,
      status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Create Indexes for fast searches and joins
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_profiles_branch ON student_profiles(branch);
    CREATE INDEX IF NOT EXISTS idx_profiles_year ON student_profiles(academic_year);
    CREATE INDEX IF NOT EXISTS idx_projects_category ON projects(category);
    CREATE INDEX IF NOT EXISTS idx_projects_owner ON projects(owner_id);
    CREATE INDEX IF NOT EXISTS idx_applications_project ON project_applications(project_id);
    CREATE INDEX IF NOT EXISTS idx_applications_applicant ON project_applications(applicant_id);
    CREATE INDEX IF NOT EXISTS idx_invitations_invitee ON team_invitations(invitee_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
  `);

  console.log('Database schema initialized successfully.');
}

// Direct execution CLI flag check
if (process.argv[1] && process.argv[1].endsWith('initialize.js')) {
  const isReset = process.argv.includes('--reset');
  initializeDatabase({ reset: isReset });
}
