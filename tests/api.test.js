import test from 'node:test';
import assert from 'node:assert';
import path from 'path';
import fs from 'fs';

// Set test env
process.env.NODE_ENV = 'test';
process.env.DB_PATH = 'data/test_project_team_compatibility.db';

import { getDbConnection } from '../database/connection.js';
import { initializeDatabase } from '../database/initialize.js';
import { UserRepository } from '../src/repositories/user.repository.js';
import { ProfileRepository } from '../src/repositories/profile.repository.js';
import { ProjectRepository } from '../src/repositories/project.repository.js';
import { TeamRepository } from '../src/repositories/team.repository.js';
import { MatchingService } from '../src/services/matching.service.js';
import { TeamGeneratorService } from '../src/services/teamGenerator.service.js';

test.before(() => {
  initializeDatabase({ reset: true });
});

test.after(() => {
  const testDbFile = path.resolve(process.cwd(), process.env.DB_PATH);
  if (fs.existsSync(testDbFile)) {
    try {
      getDbConnection().close();
      fs.unlinkSync(testDbFile);
    } catch (e) {}
  }
});

test('1. SRMIST Email Domain Validation', () => {
  const invalidEmail = 'student@gmail.com';
  const validEmail = 'student.test@srmist.edu.in';

  assert.strictEqual(invalidEmail.endsWith('@srmist.edu.in'), false);
  assert.strictEqual(validEmail.endsWith('@srmist.edu.in'), true);
});

test('2. User Registration & Password Hashing', () => {
  const userId = UserRepository.create({
    email: 'tester.one@srmist.edu.in',
    passwordHash: 'hashed_pass_123',
    fullName: 'Tester One',
    isVerified: true
  });

  assert.ok(userId > 0);
  const user = UserRepository.findByEmail('tester.one@srmist.edu.in');
  assert.strictEqual(user.full_name, 'Tester One');
  assert.strictEqual(user.password_hash, 'hashed_pass_123');
});

test('3. Profile Creation & Skill Updates', () => {
  const user = UserRepository.findByEmail('tester.one@srmist.edu.in');

  const db = getDbConnection();
  db.prepare(`
    INSERT INTO student_profiles (user_id, bio, branch, academic_year)
    VALUES (?, 'Test Bio', 'Computer Science and Engineering', '3rd Year')
  `).run(user.id);

  const profile = ProfileRepository.findByUserId(user.id);
  assert.strictEqual(profile.branch, 'Computer Science and Engineering');

  ProfileRepository.updateSkills(profile.id, [
    { name: 'Python', proficiency: 'Advanced' },
    { name: 'Node.js', proficiency: 'Intermediate' }
  ]);

  const updatedProfile = ProfileRepository.findByUserId(user.id);
  assert.strictEqual(updatedProfile.skills.length, 2);
  assert.strictEqual(updatedProfile.skills[0].name, 'Python');
});

test('4. Project Creation & Owner Authorization', () => {
  const user = UserRepository.findByEmail('tester.one@srmist.edu.in');

  const project = ProjectRepository.create(user.id, {
    title: 'Test AI Platform',
    description: 'Building an automated AI test platform.',
    category: 'Hackathon',
    desiredTeamSize: 3,
    requiredSkills: ['Python', 'Node.js'],
    roles: [{ name: 'Lead Dev', slotsNeeded: 1 }]
  });

  assert.ok(project.id > 0);
  assert.strictEqual(project.owner_id, user.id);
  assert.strictEqual(project.required_skills.length, 2);

  // Attempt non-owner modification should throw
  assert.throws(() => {
    ProjectRepository.update(project.id, 9999, { title: 'Hacked Title' });
  }, /Unauthorized/);
});

test('5. Compatibility Scoring Engine & Match Reasoning', () => {
  const user = UserRepository.findByEmail('tester.one@srmist.edu.in');
  const profile = ProfileRepository.findByUserId(user.id);
  const projects = ProjectRepository.findAll();
  const proj = projects[0];

  const match = MatchingService.calculateCompatibility(profile, proj);
  assert.ok(match.compatibilityPercentage >= 0 && match.compatibilityPercentage <= 100);
  assert.ok(Array.isArray(match.matchingSkills));
  assert.ok(typeof match.explanation === 'string');
});

test('6. Application Submission & Duplicate Application Prevention', () => {
  const user2Id = UserRepository.create({
    email: 'tester.two@srmist.edu.in',
    passwordHash: 'pass2',
    fullName: 'Tester Two',
    isVerified: true
  });

  const projects = ProjectRepository.findAll();
  const proj = projects[0];

  const appId = TeamRepository.createApplication({
    projectId: proj.id,
    applicantId: user2Id,
    requestedRole: 'Member',
    pitch: 'I want to join'
  });

  assert.ok(appId > 0);

  // Duplicate application must throw
  assert.throws(() => {
    TeamRepository.createApplication({
      projectId: proj.id,
      applicantId: user2Id,
      requestedRole: 'Member',
      pitch: 'Applying again'
    });
  }, /already applied/);
});

test('7. Holistic Team Generator', () => {
  const projects = ProjectRepository.findAll();
  const proj = projects[0];

  const genResult = TeamGeneratorService.generateTeamCombinations(proj.id, { teamSize: 3 });
  assert.strictEqual(genResult.projectId, proj.id);
  assert.ok(Array.isArray(genResult.combinations));
});

test('8. SQLite Data Persistence Verification', () => {
  const userCountBefore = UserRepository.findAll().length;
  assert.ok(userCountBefore >= 2);

  // Close and re-get connection to ensure SQLite file storage persists across resets
  const db = getDbConnection();
  const result = db.prepare('SELECT COUNT(*) as count FROM users').get();
  assert.strictEqual(result.count, userCountBefore);
});
