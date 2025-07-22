import Database from 'better-sqlite3';
import bcrypt from 'bcrypt';
import path from 'path';
import { logger } from '../utils/logger';

const dbPath = process.env.DB_PATH || path.join(__dirname, '../../data/svn-webui.db');
export const db = new Database(dbPath);

export async function setupDatabase() {
  try {
    // Enable foreign keys
    db.pragma('foreign_keys = ON');

    // Create users table
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        email TEXT,
        role TEXT NOT NULL DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create repositories table
    db.exec(`
      CREATE TABLE IF NOT EXISTS repositories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        description TEXT,
        created_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users (id)
      )
    `);

    // Create permissions table
    db.exec(`
      CREATE TABLE IF NOT EXISTS permissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        repository_id INTEGER NOT NULL,
        permission TEXT NOT NULL CHECK (permission IN ('read', 'write', 'admin')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (repository_id) REFERENCES repositories (id) ON DELETE CASCADE,
        UNIQUE (user_id, repository_id)
      )
    `);

    // Create default admin user if not exists
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    
    const existingAdmin = db.prepare('SELECT id FROM users WHERE username = ?').get(adminUsername);
    
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').run(
        adminUsername,
        hashedPassword,
        'admin'
      );
      logger.info(`Created default admin user: ${adminUsername}`);
    }

    logger.info('Database setup completed');
  } catch (error) {
    logger.error('Database setup failed:', error);
    throw error;
  }
}