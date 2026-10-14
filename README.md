# Project Team Compatibility Platform (SRMIST)

A full-stack web application built for students of **SRM Institute of Science and Technology (SRMIST)** to discover compatible project teammates, manage hackathon/research teams, analyze skill gaps, and generate optimal team compositions.

---

## 🌟 Key Features

1. **SRM Email Verification**:
   - Enforces strict backend domain validation for `@srmist.edu.in` email addresses.
   - Includes password hashing (`bcryptjs`) and development verification mode.

2. **Student Profile System**:
   - Rich student portfolios highlighting branch, academic year, campus, technical skills with proficiency levels (Beginner, Intermediate, Advanced), GitHub/LinkedIn/Portfolio links, hackathon history, and availability.

3. **Teammate Compatibility Engine**:
   - Algorithmic matching system (0–100% score) with transparent match reasoning based on:
     - **Required Skills Overlap (35%)**
     - **Complementary Skills & Roles (20%)**
     - **Relevant Experience & Hackathons (15%)**
     - **Project Interests & Categories (10%)**
     - **Availability Match (10%)**
     - **Academic Preferences (10%)**

4. **Holistic Team Generator ("Generate My Team")**:
   - Evaluates multi-member candidate combinations to build balanced teams covering all project technical requirements without redundant skill duplication.

5. **Project Publishing & Applications**:
   - Create, edit, and search projects across categories (Hackathon, Research, Startup, Web Dev, AI/ML, IoT, Cybersecurity).
   - Students can apply with pitches, and project owners can accept or reject applications.

6. **Skill Gap Analysis**:
   - Compares required project skills against accepted team members' skills, flagging covered, partially covered, and missing skills.

7. **In-App Notifications & Team Dashboards**:
   - Track team membership, pending invitations, application status updates, and unread notification badges.

8. **Administrative System & Moderation**:
   - Platform usage stats, student account suspension/reactivation, and report moderation.

---

## 🛠️ Mandatory Technology Stack

- **Frontend**: HTML5, CSS3 (Modern design system, dark/light theme, responsive grid), Vanilla JavaScript (Fetch API).
- **Backend**: Node.js, Express.js REST API, `express-session` for secure server-side sessions.
- **Database**: SQLite (`data/project_team_compatibility.db`) using Node 24 native `node:sqlite` / `better-sqlite3`. Full relational schema with foreign key constraints, indexes, and parameterized queries.

---

## 🚀 Quick Start & Installation (Windows / VS Code)

### 1. Prerequisites
- **Node.js**: v20 or v24+ (Node 24 supported natively without native C++ compilation).

### 2. Install Dependencies
Open a terminal in the project root directory and run:
```cmd
npm install
```

### 3. Setup Environment Variables
Copy `.env.example` to `.env`:
```cmd
copy .env.example .env
```
Default `.env` configuration:
```env
PORT=3000
SESSION_SECRET=srmist_team_compatibility_secret_key_2026
NODE_ENV=development
ADMIN_EMAIL=admin@srmist.edu.in
ADMIN_PASSWORD=AdminPass123!
DEV_VERIFICATION_MODE=true
DB_PATH=data/project_team_compatibility.db
```

### 4. Initialize & Seed Database
Initialize the SQLite tables and insert demo SRMIST students, projects, and active teams:
```cmd
npm run db:seed
```

### 5. Start Development Server
```cmd
npm run dev
```
Open your browser and navigate to:
👉 **`http://localhost:3000`**

---

## 🧪 Running Automated Tests

Run the comprehensive integration test suite validating domain enforcement, auth, projects, compatibility scoring, team generation, and SQLite persistence:
```cmd
npm test
```

---

## 🔑 Demo Account Credentials

| Role | Email | Password |
| :--- | :--- | :--- |
| **Student (CSE 3rd Year)** | `aarav.sharma@srmist.edu.in` | `Password123!` |
| **Student (AI/ML 3rd Year)** | `priya.patel@srmist.edu.in` | `Password123!` |
| **Student (Cyber Security 4th Year)** | `rohan.gupta@srmist.edu.in` | `Password123!` |
| **Student (UI/UX 2nd Year)** | `ananya.singh@srmist.edu.in` | `Password123!` |
| **Platform Administrator** | `admin@srmist.edu.in` | `AdminPass123!` |

---

## 🗄️ SQLite Database Schema

The SQLite database file is located at `data/project_team_compatibility.db`.

### Core Tables:
1. `users`: User credentials, SRM email, role, status.
2. `student_profiles`: Academic year, branch, campus, bio, GitHub/LinkedIn links, availability.
3. `skills`: Technical skill registry.
4. `student_skills`: Junction table for student skills & proficiency levels.
5. `projects`: Published projects, required team size, duration, status.
6. `project_required_skills`: Required skills & minimum proficiency.
7. `project_optional_skills`: Optional skills.
8. `project_roles`: Open roles & filled slots.
9. `project_applications`: Student join applications & status.
10. `teams`: Active project teams.
11. `team_members`: Team membership & assigned roles.
12. `team_invitations`: Project team invitations.
13. `notifications`: In-app notification queue.
14. `reports`: Abuse and moderation reports.

---

## 📡 REST API Reference

- `POST /api/auth/register` - Register new SRMIST account
- `POST /api/auth/login` - Authenticate student session
- `POST /api/auth/logout` - End session
- `GET /api/auth/me` - Get current authenticated user
- `GET /api/profile/me` - Get profile details
- `PUT /api/profile/me` - Update profile & skills
- `GET /api/students` - Discover & filter students
- `GET /api/projects` - Browse & filter projects
- `POST /api/projects` - Publish new project
- `POST /api/matching/recommendations` - Get ranked teammate compatibility list
- `POST /api/matching/generate-team` - Generate optimal team combinations
- `GET /api/matching/skill-gaps` - Analyze project skill coverage
- `GET /api/teams/me` - View active teams
- `POST /api/teams/invitations` - Send team invitation
- `GET /api/notifications` - Fetch user notifications
- `GET /api/admin/stats` - Admin overview stats (Admin only)
