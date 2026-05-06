const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../db.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Connected to SQLite database');
  }
});

db.serialize(() => {
  // Users table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    resume_path TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Jobs table
  db.run(`CREATE TABLE IF NOT EXISTS jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    location TEXT,
    salary TEXT,
    description TEXT,
    url TEXT UNIQUE,
    posted_date DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Applications table
  db.run(`CREATE TABLE IF NOT EXISTS applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    job_id INTEGER NOT NULL,
    status TEXT DEFAULT 'applied', -- applied, viewed, interview, rejected
    applied_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(job_id) REFERENCES jobs(id),
    UNIQUE(user_id, job_id)
  )`);

  // Auto-apply rules table
  db.run(`CREATE TABLE IF NOT EXISTS auto_apply_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title_keywords TEXT, -- comma-separated
    location TEXT,
    min_salary REAL,
    max_salary REAL,
    remote_only INTEGER DEFAULT 0,
    active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);

  // Settings table
  db.run(`CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    auto_apply_enabled INTEGER DEFAULT 0,
    daily_limit INTEGER DEFAULT 5,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    UNIQUE(user_id)
  )`);

  // User credentials for external sites
  db.run(`CREATE TABLE IF NOT EXISTS user_credentials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE,
    linkedin_email TEXT,
    linkedin_password TEXT,
    wellfound_email TEXT,
    wellfound_password TEXT,
    naukri_email TEXT,
    naukri_password TEXT,    full_name TEXT,
    contact_email TEXT,
    phone_number TEXT,    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);

  // Password reset tokens
  db.run(`CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token TEXT NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    used INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);

  // External applications tracking
  db.run(`CREATE TABLE IF NOT EXISTS external_applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    job_title TEXT NOT NULL,
    source TEXT NOT NULL, -- LinkedIn, Wellfound, Naukri
    status TEXT DEFAULT 'applied',
    applied_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);

  // Job scrape history
  db.run(`CREATE TABLE IF NOT EXISTS scrape_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    keyword TEXT,
    location TEXT,
    source TEXT,
    jobs_found INTEGER,
    scraped_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);
});

module.exports = db;
