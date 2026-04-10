import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
/** Render persistent disk: set DATA_DIR to the mount path (e.g. /var/data). */
const dataDir = (() => {
  const fromEnv = process.env.DATA_DIR?.trim();
  if (fromEnv) return path.resolve(fromEnv);
  return path.join(__dirname, "..", "data");
})();
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, "swaap.db");
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    phone TEXT,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    interest TEXT NOT NULL,
    profession_area TEXT NOT NULL DEFAULT '',
    title TEXT NOT NULL DEFAULT '',
    linkedin_url TEXT NOT NULL DEFAULT '',
    hear_about TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS event_registrations (
    user_id TEXT NOT NULL,
    event_id TEXT NOT NULL,
    registered_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (user_id, event_id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

try {
  db.exec(`ALTER TABLE users ADD COLUMN hear_about TEXT NOT NULL DEFAULT ''`);
} catch (e) {
  const msg = String(e?.message || e);
  if (!msg.includes("duplicate column")) throw e;
}

export function getUserById(id) {
  const row = db.prepare("SELECT * FROM users WHERE id = ?").get(id);
  return row ? mapUser(row) : null;
}

export function createUser(row) {
  const stmt = db.prepare(`
    INSERT INTO users (id, phone, email, name, interest, profession_area, title, linkedin_url, hear_about)
    VALUES (@id, @phone, @email, @name, @interest, @profession_area, @title, @linkedin_url, @hear_about)
  `);
  stmt.run(row);
  return getUserById(row.id);
}

export function isRegisteredForEvent(userId, eventId) {
  const r = db
    .prepare("SELECT 1 FROM event_registrations WHERE user_id = ? AND event_id = ?")
    .get(userId, eventId);
  return Boolean(r);
}

export function registerForEvent(userId, eventId) {
  db.prepare(
    "INSERT OR IGNORE INTO event_registrations (user_id, event_id) VALUES (?, ?)"
  ).run(userId, eventId);
}

function mapUser(row) {
  return {
    id: row.id,
    phone: row.phone,
    email: row.email,
    name: row.name,
    interest: row.interest,
    professionArea: row.profession_area,
    title: row.title,
    linkedinUrl: row.linkedin_url,
    hearAbout: row.hear_about,
    createdAt: row.created_at,
  };
}

export { db };
