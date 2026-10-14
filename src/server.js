import app from './app.js';
import { initializeDatabase } from '../database/initialize.js';
import { seedDatabase } from '../database/seed.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const PORT = process.env.PORT || 3000;
const dbPath = process.env.DB_PATH || 'data/project_team_compatibility.db';
const absDbPath = path.resolve(process.cwd(), dbPath);

// Ensure DB exists and is initialized
if (!fs.existsSync(absDbPath)) {
  console.log('Database file not found. Initializing and seeding demo dataset...');
  seedDatabase();
} else {
  initializeDatabase();
}

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 SRMIST Project Team Compatibility Platform running!`);
  console.log(`🌐 Local URL: http://localhost:${PORT}`);
  console.log(`📁 Database: ${absDbPath}`);
  console.log(`=======================================================`);
});
