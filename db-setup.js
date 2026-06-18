const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('er-wait-time.db');

// Create tables
db.serialize(() => {
  // Hospitals table
  db.run(`CREATE TABLE IF NOT EXISTS hospitals (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    wait_time INTEGER DEFAULT 0,
    location TEXT,
    phone TEXT,
    address TEXT,
    last_updated INTEGER
  )`);

  // Patients table
  db.run(`CREATE TABLE IF NOT EXISTS patients (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    status TEXT,
    arrival_time INTEGER,
    priority INTEGER DEFAULT 3,
    symptoms TEXT,
    last_updated INTEGER
  )`);

  // Chat history
  db.run(`CREATE TABLE IF NOT EXISTS chat_history (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    message TEXT,
    timestamp INTEGER,
    is_bot INTEGER DEFAULT 0
  )`);

  // User profiles
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    medical_history TEXT,
    created_at INTEGER
  )`);
});

// Close the database connection
db.close(); 