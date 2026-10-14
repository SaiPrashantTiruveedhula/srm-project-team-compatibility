import bcrypt from 'bcryptjs';
import { getDbConnection } from './connection.js';
import { initializeDatabase } from './initialize.js';

export function seedDatabase() {
  initializeDatabase({ reset: true });
  const db = getDbConnection();

  console.log('Seeding database with demo SRMIST data...');

  const passwordHash = bcrypt.hashSync('Password123!', 10);
  const adminPasswordHash = bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'AdminPass123!', 10);

  // 1. Insert Skills
  const skillNames = [
    'Python', 'Machine Learning', 'PyTorch', 'TensorFlow',
    'JavaScript', 'Node.js', 'Express.js', 'React', 'HTML/CSS',
    'SQL', 'SQLite', 'MongoDB', 'Docker', 'Cyber Security',
    'Penetration Testing', 'Figma', 'UI/UX Design', 'C++',
    'Arduino', 'IoT', 'Embedded Systems', 'Flutter', 'Java', 'Data Analysis'
  ];

  const insertSkill = db.prepare('INSERT INTO skills (name, category) VALUES (?, ?)');
  const skillIds = {};

  for (const name of skillNames) {
    let category = 'Technical';
    if (['Figma', 'UI/UX Design'].includes(name)) category = 'Design';
    if (['Cyber Security', 'Penetration Testing'].includes(name)) category = 'Security';
    if (['Machine Learning', 'PyTorch', 'TensorFlow', 'Data Analysis'].includes(name)) category = 'AI/Data';
    if (['Arduino', 'IoT', 'Embedded Systems'].includes(name)) category = 'Hardware';
    const info = insertSkill.run(name, category);
    skillIds[name] = info.lastInsertRowid;
  }

  // 2. Insert Users & Profiles
  const usersData = [
    {
      email: process.env.ADMIN_EMAIL || 'admin@srmist.edu.in',
      password: adminPasswordHash,
      name: 'Dr. Administrator',
      role: 'admin',
      profile: {
        bio: 'Platform Administrator & SRMIST Faculty Advisor.',
        branch: 'Computer Science and Engineering',
        academic_year: '4th Year',
        campus: 'Kattankulathur',
        availability: '20 hrs/week',
        achievements: 'Faculty Coordinator for SRM Hackathons.',
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
      },
      skills: ['Python', 'SQL', 'Cyber Security']
    },
    {
      email: 'aarav.sharma@srmist.edu.in',
      password: passwordHash,
      name: 'Aarav Sharma',
      role: 'student',
      profile: {
        bio: 'Passionate full-stack developer with experience building scalable Node.js web platforms and APIs.',
        branch: 'Computer Science and Engineering',
        academic_year: '3rd Year',
        campus: 'Kattankulathur',
        github_url: 'https://github.com/aarav-sharma-srm',
        linkedin_url: 'https://linkedin.com/in/aarav-sharma-srm',
        availability: '15-20 hrs/week',
        preferred_team_size: 4,
        preferred_categories: 'Hackathon, Web Development, Startup',
        achievements: 'Winner of SRM TechSurge 2025, Built 5+ web apps',
        hackathon_exp: 'Participated in Smart India Hackathon & HackSRM',
        avatar_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150'
      },
      skills: [
        { name: 'JavaScript', prof: 'Advanced' },
        { name: 'Node.js', prof: 'Advanced' },
        { name: 'Express.js', prof: 'Advanced' },
        { name: 'HTML/CSS', prof: 'Advanced' },
        { name: 'SQL', prof: 'Intermediate' },
        { name: 'React', prof: 'Intermediate' }
      ]
    },
    {
      email: 'priya.patel@srmist.edu.in',
      password: passwordHash,
      name: 'Priya Patel',
      role: 'student',
      profile: {
        bio: 'AI/ML researcher and Data Scientist specializing in Computer Vision, NLP, and PyTorch.',
        branch: 'Artificial Intelligence and Machine Learning',
        academic_year: '3rd Year',
        campus: 'Kattankulathur',
        github_url: 'https://github.com/priya-patel-ml',
        linkedin_url: 'https://linkedin.com/in/priyapatel-ai',
        availability: '10-15 hrs/week',
        preferred_team_size: 4,
        preferred_categories: 'Artificial Intelligence / Machine Learning, Research, Hackathon',
        achievements: 'Published research paper on Sentiment Analysis, 2nd Place in SRM AI Summit',
        hackathon_exp: 'HackSRM 2025 AI Track Finalist',
        avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'
      },
      skills: [
        { name: 'Python', prof: 'Advanced' },
        { name: 'Machine Learning', prof: 'Advanced' },
        { name: 'PyTorch', prof: 'Intermediate' },
        { name: 'TensorFlow', prof: 'Intermediate' },
        { name: 'Data Analysis', prof: 'Advanced' }
      ]
    },
    {
      email: 'rohan.gupta@srmist.edu.in',
      password: passwordHash,
      name: 'Rohan Gupta',
      role: 'student',
      profile: {
        bio: 'Cyber Security enthusiast focused on web vulnerability assessment, ethical hacking, and network security.',
        branch: 'Cyber Security',
        academic_year: '4th Year',
        campus: 'Ramapuram',
        github_url: 'https://github.com/rohan-sec',
        linkedin_url: 'https://linkedin.com/in/rohangupta-sec',
        availability: '10 hrs/week',
        preferred_team_size: 3,
        preferred_categories: 'Cybersecurity, Open Source',
        achievements: 'Reported 3 bug bounties, CEH Certified',
        hackathon_exp: 'CTF Captain at SRM Cyber Club',
        avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
      },
      skills: [
        { name: 'Cyber Security', prof: 'Advanced' },
        { name: 'Penetration Testing', prof: 'Advanced' },
        { name: 'Python', prof: 'Intermediate' },
        { name: 'Docker', prof: 'Intermediate' }
      ]
    },
    {
      email: 'ananya.singh@srmist.edu.in',
      password: passwordHash,
      name: 'Ananya Singh',
      role: 'student',
      profile: {
        bio: 'Creative UI/UX designer obsessed with crafting accessible, intuitive user interfaces and wireframes.',
        branch: 'Information Technology',
        academic_year: '2nd Year',
        campus: 'Kattankulathur',
        github_url: 'https://github.com/ananya-design',
        linkedin_url: 'https://linkedin.com/in/ananyasingh-ux',
        portfolio_url: 'https://ananya-ux.design',
        availability: '15 hrs/week',
        preferred_team_size: 4,
        preferred_categories: 'Web Development, Mobile Application, Startup',
        achievements: 'Redesigned SRM Student Portal Prototype',
        hackathon_exp: 'UI/UX lead for 2 campus hackathons',
        avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150'
      },
      skills: [
        { name: 'Figma', prof: 'Advanced' },
        { name: 'UI/UX Design', prof: 'Advanced' },
        { name: 'HTML/CSS', prof: 'Intermediate' },
        { name: 'JavaScript', prof: 'Beginner' }
      ]
    },
    {
      email: 'vikram.verma@srmist.edu.in',
      password: passwordHash,
      name: 'Vikram Verma',
      role: 'student',
      profile: {
        bio: 'Hardware maker, IoT developer, and robotics enthusiast.',
        branch: 'Mechatronics',
        academic_year: '3rd Year',
        campus: 'Kattankulathur',
        github_url: 'https://github.com/vikram-iot',
        availability: '12 hrs/week',
        preferred_team_size: 5,
        preferred_categories: 'Hardware / IoT, Research',
        achievements: 'Built autonomous solar tracking system',
        hackathon_exp: 'SRM IoT Challenge Winner',
        avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'
      },
      skills: [
        { name: 'Arduino', prof: 'Advanced' },
        { name: 'IoT', prof: 'Advanced' },
        { name: 'Embedded Systems', prof: 'Intermediate' },
        { name: 'C++', prof: 'Intermediate' },
        { name: 'Python', prof: 'Beginner' }
      ]
    },
    {
      email: 'sneha.reddy@srmist.edu.in',
      password: passwordHash,
      name: 'Sneha Reddy',
      role: 'student',
      profile: {
        bio: 'Data Science student interested in statistical modeling, visualization, and Python backend scripts.',
        branch: 'Data Science',
        academic_year: '2nd Year',
        campus: 'Kattankulathur',
        github_url: 'https://github.com/sneha-ds',
        availability: '10-15 hrs/week',
        preferred_team_size: 4,
        preferred_categories: 'Artificial Intelligence / Machine Learning, Academic Project',
        achievements: 'Dean’s list student, Python certification',
        avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150'
      },
      skills: [
        { name: 'Python', prof: 'Advanced' },
        { name: 'Data Analysis', prof: 'Advanced' },
        { name: 'SQL', prof: 'Intermediate' },
        { name: 'Machine Learning', prof: 'Beginner' }
      ]
    }
  ];

  const insertUser = db.prepare(`
    INSERT INTO users (email, password_hash, full_name, is_verified, role, status)
    VALUES (?, ?, ?, 1, ?, 'active')
  `);

  const insertProfile = db.prepare(`
    INSERT INTO student_profiles (
      user_id, bio, branch, academic_year, campus, github_url, linkedin_url, portfolio_url,
      availability, preferred_team_size, preferred_categories, achievements, hackathon_exp, avatar_url
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertStudentSkill = db.prepare(`
    INSERT INTO student_skills (student_id, skill_id, proficiency)
    VALUES (?, ?, ?)
  `);

  const userIds = {};
  const profileIds = {};

  for (const u of usersData) {
    const info = insertUser.run(u.email, u.password, u.name, u.role);
    const userId = info.lastInsertRowid;
    userIds[u.email] = userId;

    const p = u.profile;
    const pInfo = insertProfile.run(
      userId,
      p.bio || '',
      p.branch || 'Computer Science and Engineering',
      p.academic_year || '2nd Year',
      p.campus || 'Kattankulathur',
      p.github_url || '',
      p.linkedin_url || '',
      p.portfolio_url || '',
      p.availability || '10 hrs/week',
      p.preferred_team_size || 4,
      p.preferred_categories || '',
      p.achievements || '',
      p.hackathon_exp || '',
      p.avatar_url || ''
    );
    const profileId = pInfo.lastInsertRowid;
    profileIds[u.email] = profileId;

    if (u.skills) {
      for (const s of u.skills) {
        const name = typeof s === 'string' ? s : s.name;
        const prof = typeof s === 'string' ? 'Intermediate' : s.prof;
        if (skillIds[name]) {
          insertStudentSkill.run(profileId, skillIds[name], prof);
        }
      }
    }
  }

  // 3. Insert Projects
  const insertProject = db.prepare(`
    INSERT INTO projects (
      owner_id, title, description, category, problem_statement, goals,
      desired_team_size, preferred_years, preferred_branches, experience_reqs, duration, availability_reqs, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open')
  `);

  const insertReqSkill = db.prepare(`
    INSERT INTO project_required_skills (project_id, skill_id, min_proficiency)
    VALUES (?, ?, ?)
  `);

  const insertOptSkill = db.prepare(`
    INSERT INTO project_optional_skills (project_id, skill_id)
    VALUES (?, ?)
  `);

  const insertRole = db.prepare(`
    INSERT INTO project_roles (project_id, role_name, slots_needed, slots_filled)
    VALUES (?, ?, ?, ?)
  `);

  // Project 1 by Aarav
  const proj1Info = insertProject.run(
    userIds['aarav.sharma@srmist.edu.in'],
    'SRM Smart Campus Hackathon AI Assistant',
    'A real-time intelligent chatbot and mobile-friendly web dashboard for SRMIST students to navigate campus events, timetable, faculty contacts, and shuttle bus schedules.',
    'Hackathon',
    'Students miss campus announcements, shuttle updates, and club hackathons due to fragmented notice boards.',
    'Build an AI-assisted web portal with Node.js backend, SQLite database, dynamic search, and interactive campus map.',
    4,
    '2nd Year, 3rd Year, 4th Year',
    'Computer Science and Engineering, Artificial Intelligence and Machine Learning, Information Technology',
    'Experience with web APIs, Node.js, or AI models preferred.',
    '3 weeks (Hackathon prep)',
    '15 hrs/week'
  );
  const proj1Id = proj1Info.lastInsertRowid;

  insertReqSkill.run(proj1Id, skillIds['Node.js'], 'Intermediate');
  insertReqSkill.run(proj1Id, skillIds['Python'], 'Intermediate');
  insertReqSkill.run(proj1Id, skillIds['Machine Learning'], 'Intermediate');
  insertReqSkill.run(proj1Id, skillIds['UI/UX Design'], 'Beginner');

  insertOptSkill.run(proj1Id, skillIds['React']);
  insertOptSkill.run(proj1Id, skillIds['Figma']);

  insertRole.run(proj1Id, 'Backend Lead (Node.js)', 1, 1);
  insertRole.run(proj1Id, 'AI/ML Engineer (Python)', 1, 0);
  insertRole.run(proj1Id, 'Frontend & UI/UX Specialist', 1, 0);
  insertRole.run(proj1Id, 'Data Analyst / Documentation', 1, 0);

  // Project 2 by Priya Patel
  const proj2Info = insertProject.run(
    userIds['priya.patel@srmist.edu.in'],
    'Automated Plant Disease Diagnostics using Computer Vision',
    'AI research project developing a lightweight deep learning vision pipeline for detecting crop diseases in local farms around Kanchipuram district.',
    'Research',
    'Local farmers struggle with early disease identification causing crop loss.',
    'Train PyTorch model, deploy web dashboard, write paper for SRM Tech Conference.',
    4,
    '3rd Year, 4th Year',
    'Artificial Intelligence and Machine Learning, Computer Science and Engineering, Biotechnology',
    'PyTorch / OpenCV knowledge required.',
    '8 weeks',
    '12 hrs/week'
  );
  const proj2Id = proj2Info.lastInsertRowid;

  insertReqSkill.run(proj2Id, skillIds['Python'], 'Advanced');
  insertReqSkill.run(proj2Id, skillIds['Machine Learning'], 'Advanced');
  insertReqSkill.run(proj2Id, skillIds['PyTorch'], 'Intermediate');
  insertOptSkill.run(proj2Id, skillIds['Docker']);

  insertRole.run(proj2Id, 'ML Researcher', 2, 1);
  insertRole.run(proj2Id, 'Web Interface Developer', 1, 0);
  insertRole.run(proj2Id, 'Data Analyst', 1, 0);

  // Project 3 by Vikram Verma
  const proj3Info = insertProject.run(
    userIds['vikram.verma@srmist.edu.in'],
    'IoT Smart Energy & Room Automation System',
    'Hardware and IoT project building smart energy monitoring plugs connected to a centralized dashboard for SRM hostel rooms.',
    'Hardware / IoT',
    'High energy waste in hostel rooms during vacant hours.',
    'Build ESP32 based smart plugs with sensor telemetry fed to SQLite database.',
    3,
    '2nd Year, 3rd Year',
    'Mechatronics, Electrical and Electronics Engineering, Computer Science and Engineering',
    'Hands-on Arduino/ESP32 solder and C++ programming.',
    '6 weeks',
    '10 hrs/week'
  );
  const proj3Id = proj3Info.lastInsertRowid;

  insertReqSkill.run(proj3Id, skillIds['Arduino'], 'Intermediate');
  insertReqSkill.run(proj3Id, skillIds['IoT'], 'Intermediate');
  insertReqSkill.run(proj3Id, skillIds['C++'], 'Intermediate');

  insertRole.run(proj3Id, 'Hardware Engineer', 1, 1);
  insertRole.run(proj3Id, 'Embedded C++ Programmer', 1, 0);
  insertRole.run(proj3Id, 'Dashboard Developer', 1, 0);

  // 4. Insert Teams & Members
  const insertTeam = db.prepare('INSERT INTO teams (project_id, name) VALUES (?, ?)');
  const insertMember = db.prepare('INSERT INTO team_members (team_id, user_id, role) VALUES (?, ?, ?)');

  const team1Info = insertTeam.run(proj1Id, 'Smart Campus Crew');
  const team1Id = team1Info.lastInsertRowid;
  insertMember.run(team1Id, userIds['aarav.sharma@srmist.edu.in'], 'Project Owner / Backend Lead');

  const team2Info = insertTeam.run(proj2Id, 'AgriVision AI');
  const team2Id = team2Info.lastInsertRowid;
  insertMember.run(team2Id, userIds['priya.patel@srmist.edu.in'], 'Project Owner / Lead Researcher');

  const team3Info = insertTeam.run(proj3Id, 'EcoHostel IoT');
  const team3Id = team3Info.lastInsertRowid;
  insertMember.run(team3Id, userIds['vikram.verma@srmist.edu.in'], 'Project Owner / Hardware Lead');

  // 5. Insert Applications & Invitations
  const insertApp = db.prepare(`
    INSERT INTO project_applications (project_id, applicant_id, requested_role, pitch, status)
    VALUES (?, ?, ?, ?, ?)
  `);

  const insertInv = db.prepare(`
    INSERT INTO team_invitations (team_id, project_id, inviter_id, invitee_id, offered_role, message, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertNotif = db.prepare(`
    INSERT INTO notifications (user_id, title, message, link, is_read)
    VALUES (?, ?, ?, ?, ?)
  `);

  // Priya applied to Aarav's Smart Campus project
  insertApp.run(
    proj1Id,
    userIds['priya.patel@srmist.edu.in'],
    'AI/ML Engineer (Python)',
    'Hi Aarav! I have strong Python & ML experience and would love to build the AI assistant module for the campus app.',
    'pending'
  );

  insertNotif.run(
    userIds['aarav.sharma@srmist.edu.in'],
    'New Project Application',
    'Priya Patel applied to join SRM Smart Campus Hackathon AI Assistant as AI/ML Engineer (Python).',
    `/project-details.html?id=${proj1Id}`,
    0
  );

  // Ananya applied to Aarav's project
  insertApp.run(
    proj1Id,
    userIds['ananya.singh@srmist.edu.in'],
    'Frontend & UI/UX Specialist',
    'Hey! I designed the SRM student portal mockups in Figma and can create slick, responsive UI layouts.',
    'pending'
  );

  // Aarav invited Sneha Reddy
  insertInv.run(
    team1Id,
    proj1Id,
    userIds['aarav.sharma@srmist.edu.in'],
    userIds['sneha.reddy@srmist.edu.in'],
    'Data Analyst / Documentation',
    'Hi Sneha, your data analysis skills would be super helpful for structuring campus timetable data!',
    'pending'
  );

  insertNotif.run(
    userIds['sneha.reddy@srmist.edu.in'],
    'New Team Invitation',
    'Aarav Sharma invited you to join team Smart Campus Crew for SRM Smart Campus Hackathon AI Assistant.',
    '/notifications.html',
    0
  );

  console.log('Database seeded successfully with demo SRMIST data!');
}

if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  seedDatabase();
}
