import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const dbPath = process.env.DB_PATH || 'data/project_team_compatibility.db';
const absoluteDbPath = path.resolve(process.cwd(), dbPath);

// Ensure data directory exists
const dbDir = path.dirname(absoluteDbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

let rawDb = null;
let wrappedDb = null;

export function getDbConnection() {
  if (!wrappedDb) {
    rawDb = new DatabaseSync(absoluteDbPath);
    try {
      rawDb.exec('PRAGMA foreign_keys = ON;');
      rawDb.exec('PRAGMA journal_mode = WAL;');
    } catch (e) {
      console.warn('Pragma warning:', e.message);
    }

    wrappedDb = {
      exec(sql) {
        return rawDb.exec(sql);
      },
      prepare(sql) {
        const stmt = rawDb.prepare(sql);
        return {
          run(...params) {
            const res = stmt.run(...params);
            return {
              lastInsertRowid: Number(res.lastInsertRowid),
              changes: Number(res.changes)
            };
          },
          get(...params) {
            return stmt.get(...params);
          },
          all(...params) {
            return stmt.all(...params);
          }
        };
      },
      close() {
        if (rawDb) rawDb.close();
      }
    };
  }
  return wrappedDb;
}

export default getDbConnection;
