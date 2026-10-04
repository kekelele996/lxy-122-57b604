const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = process.env.DB_PATH || path.resolve(__dirname, '../../../database/database.db');
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Database opening error: ', err);
  } else {
    console.log('Connected to SQLite database');
    initTables();
  }
});

function initTables() {
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      nickname TEXT,
      avatar TEXT,
      rank TEXT,
      game_id TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS teams (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      logo TEXT,
      leader_id TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (leader_id) REFERENCES users(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS team_members (
      id TEXT PRIMARY KEY,
      team_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      role TEXT DEFAULT 'member',
      position TEXT,
      status TEXT DEFAULT 'pending',
      joined_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (team_id) REFERENCES teams(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(team_id, user_id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS schedules (
      id TEXT PRIMARY KEY,
      team_id TEXT NOT NULL,
      title TEXT NOT NULL,
      type TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT,
      opponent TEXT,
      location TEXT,
      description TEXT,
      created_by TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (team_id) REFERENCES teams(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS schedule_attendance (
      id TEXT PRIMARY KEY,
      schedule_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      reason TEXT,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (schedule_id) REFERENCES schedules(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(schedule_id, user_id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS match_records (
      id TEXT PRIMARY KEY,
      team_id TEXT NOT NULL,
      schedule_id TEXT,
      opponent TEXT NOT NULL,
      our_score INTEGER DEFAULT 0,
      opponent_score INTEGER DEFAULT 0,
      result TEXT,
      summary TEXT,
      match_time TEXT,
      created_by TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (team_id) REFERENCES teams(id),
      FOREIGN KEY (schedule_id) REFERENCES schedules(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS match_notes (
      id TEXT PRIMARY KEY,
      match_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (match_id) REFERENCES match_records(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS invitations (
      id TEXT PRIMARY KEY,
      team_id TEXT NOT NULL,
      inviter_id TEXT NOT NULL,
      invitee_username TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (team_id) REFERENCES teams(id),
      FOREIGN KEY (inviter_id) REFERENCES users(id)
    )`);
  });
}

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

module.exports = { run, get, all };
