import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { dummyEvents } from "./data/dummy-events.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
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

  CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    image TEXT NOT NULL DEFAULT '',
    type TEXT NOT NULL DEFAULT '',
    category TEXT NOT NULL DEFAULT '',
    start_date TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_date TEXT NOT NULL,
    end_time TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'published',
    price REAL NOT NULL DEFAULT 0,
    location TEXT NOT NULL DEFAULT '',
    long_description TEXT NOT NULL DEFAULT '',
    agenda_json TEXT NOT NULL DEFAULT '[]',
    attendees_hint INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS event_reservations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    event_id TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending_confirmation',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (event_id) REFERENCES events(id)
  );

  CREATE UNIQUE INDEX IF NOT EXISTS idx_event_reservations_user_event
    ON event_reservations (user_id, event_id);
`);

const alters = [
  "ALTER TABLE users ADD COLUMN hear_about TEXT NOT NULL DEFAULT ''",
  "ALTER TABLE users ADD COLUMN user_type TEXT NOT NULL DEFAULT 'User'",
  "ALTER TABLE users ADD COLUMN job_role TEXT NOT NULL DEFAULT ''",
  "ALTER TABLE users ADD COLUMN company_name TEXT NOT NULL DEFAULT ''",
  "ALTER TABLE users ADD COLUMN industry TEXT NOT NULL DEFAULT ''",
  "ALTER TABLE users ADD COLUMN looking_for TEXT NOT NULL DEFAULT ''",
  "ALTER TABLE users ADD COLUMN can_offer TEXT NOT NULL DEFAULT ''",
  "ALTER TABLE users ADD COLUMN business_owner INTEGER NOT NULL DEFAULT 0",
  "ALTER TABLE users ADD COLUMN business_website TEXT NOT NULL DEFAULT ''",
  "ALTER TABLE users ADD COLUMN social_instagram TEXT NOT NULL DEFAULT ''",
  "ALTER TABLE users ADD COLUMN social_facebook TEXT NOT NULL DEFAULT ''",
  "ALTER TABLE users ADD COLUMN social_linkedin TEXT NOT NULL DEFAULT ''",
  "ALTER TABLE users ADD COLUMN social_snapchat TEXT NOT NULL DEFAULT ''",
  "ALTER TABLE users ADD COLUMN social_tiktok TEXT NOT NULL DEFAULT ''",
];
for (const sql of alters) {
  try {
    db.exec(sql);
  } catch (e) {
    const msg = String(e?.message || e);
    if (!msg.includes("duplicate column")) throw e;
  }
}

function mapUser(row) {
  if (!row) return null;
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
    userType: row.user_type ?? "User",
    jobRole: row.job_role ?? "",
    companyName: row.company_name ?? "",
    industry: row.industry ?? "",
    lookingFor: row.looking_for ?? "",
    canOffer: row.can_offer ?? "",
    businessOwner: Boolean(row.business_owner),
    businessWebsite: row.business_website ?? "",
    socialInstagram: row.social_instagram ?? "",
    socialFacebook: row.social_facebook ?? "",
    socialLinkedin: row.social_linkedin ?? "",
    socialSnapchat: row.social_snapchat ?? "",
    socialTiktok: row.social_tiktok ?? "",
    createdAt: row.created_at,
  };
}

function mapEventRow(row, { includeDetail = false } = {}) {
  let agenda = [];
  try {
    agenda = JSON.parse(row.agenda_json || "[]");
    if (!Array.isArray(agenda)) agenda = [];
  } catch {
    agenda = [];
  }
  const base = {
    id: row.id,
    title: row.title,
    description: row.description,
    image: row.image,
    type: row.type,
    category: row.category,
    startDate: row.start_date,
    startTime: row.start_time,
    endDate: row.end_date,
    endTime: row.end_time,
    status: row.status,
    price: row.price,
    location: row.location,
    attendees: row.attendees_hint ?? 0,
    date: row.start_date,
    time: row.start_time,
    industry: row.category,
  };
  if (includeDetail) {
    return {
      ...base,
      longDescription: row.long_description || row.description,
      agenda,
    };
  }
  return base;
}

export function getUserById(id) {
  const row = db.prepare("SELECT * FROM users WHERE id = ?").get(id);
  return row ? mapUser(row) : null;
}

/** Admin role is never chosen by the client—only if phone matches ADMIN_PHONES (E.164). */
function resolveAdminType(phone) {
  const normalized = (phone ?? "").trim();
  const phones = (process.env.ADMIN_PHONES || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (normalized && phones.includes(normalized)) return "Admin";
  return "User";
}

export function createUser(row) {
  const userType = resolveAdminType(row.phone ?? "");
  const stmt = db.prepare(`
    INSERT INTO users (
      id, phone, email, name, interest, profession_area, title, linkedin_url, hear_about,
      user_type, job_role, company_name, industry, looking_for, can_offer,
      business_owner, business_website, social_instagram, social_facebook, social_linkedin,
      social_snapchat, social_tiktok
    )
    VALUES (
      @id, @phone, @email, @name, @interest, @profession_area, @title, @linkedin_url, @hear_about,
      @user_type, @job_role, @company_name, @industry, @looking_for, @can_offer,
      @business_owner, @business_website, @social_instagram, @social_facebook, @social_linkedin,
      @social_snapchat, @social_tiktok
    )
  `);
  stmt.run({
    id: row.id,
    phone: row.phone ?? "",
    email: row.email,
    name: row.name,
    interest: row.interest,
    profession_area: row.profession_area ?? "",
    title: row.title ?? "",
    linkedin_url: row.linkedin_url ?? "",
    hear_about: row.hear_about ?? "",
    user_type: userType,
    job_role: row.job_role ?? "",
    company_name: row.company_name ?? "",
    industry: row.industry ?? "",
    looking_for: row.looking_for ?? "",
    can_offer: row.can_offer ?? "",
    business_owner: row.business_owner ? 1 : 0,
    business_website: row.business_website ?? "",
    social_instagram: row.social_instagram ?? "",
    social_facebook: row.social_facebook ?? "",
    social_linkedin: row.social_linkedin ?? "",
    social_snapchat: row.social_snapchat ?? "",
    social_tiktok: row.social_tiktok ?? "",
  });
  return getUserById(row.id);
}

export function updateUserProfile(userId, patch) {
  const cur = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
  if (!cur) return null;
  const m = mapUser(cur);
  const next = {
    email: patch.email != null ? String(patch.email).trim() : m.email,
    name: patch.name != null ? String(patch.name).trim() : m.name,
    interest: patch.interest != null ? String(patch.interest).trim() : m.interest,
    profession_area:
      patch.professionArea != null ? String(patch.professionArea).trim() : cur.profession_area,
    title: patch.title != null ? String(patch.title).trim() : cur.title,
    linkedin_url: patch.linkedinUrl != null ? String(patch.linkedinUrl).trim() : cur.linkedin_url,
    hear_about: patch.hearAbout != null ? String(patch.hearAbout).trim() : cur.hear_about,
    job_role: patch.jobRole != null ? String(patch.jobRole).trim() : cur.job_role,
    company_name: patch.companyName != null ? String(patch.companyName).trim() : cur.company_name,
    industry: patch.industry != null ? String(patch.industry).trim() : cur.industry,
    looking_for: patch.lookingFor != null ? String(patch.lookingFor).trim() : cur.looking_for,
    can_offer: patch.canOffer != null ? String(patch.canOffer).trim() : cur.can_offer,
    business_owner:
      patch.businessOwner != null ? (patch.businessOwner ? 1 : 0) : cur.business_owner,
    business_website:
      patch.businessWebsite != null ? String(patch.businessWebsite).trim() : cur.business_website,
    social_instagram:
      patch.socialInstagram != null ? String(patch.socialInstagram).trim() : cur.social_instagram,
    social_facebook:
      patch.socialFacebook != null ? String(patch.socialFacebook).trim() : cur.social_facebook,
    social_linkedin:
      patch.socialLinkedin != null ? String(patch.socialLinkedin).trim() : cur.social_linkedin,
    social_snapchat:
      patch.socialSnapchat != null ? String(patch.socialSnapchat).trim() : cur.social_snapchat,
    social_tiktok: patch.socialTiktok != null ? String(patch.socialTiktok).trim() : cur.social_tiktok,
  };
  db.prepare(
    `UPDATE users SET
 email=@email, name=@name, interest=@interest, profession_area=@profession_area,
      title=@title, linkedin_url=@linkedin_url, hear_about=@hear_about,
      job_role=@job_role, company_name=@company_name, industry=@industry,
      looking_for=@looking_for, can_offer=@can_offer, business_owner=@business_owner,
      business_website=@business_website, social_instagram=@social_instagram,
      social_facebook=@social_facebook, social_linkedin=@social_linkedin,
      social_snapchat=@social_snapchat, social_tiktok=@social_tiktok
    WHERE id=@id`
  ).run({ ...next, id: userId });
  return getUserById(userId);
}

export function isUserAdmin(userId) {
  const row = db.prepare("SELECT user_type FROM users WHERE id = ?").get(userId);
  return row?.user_type === "Admin";
}

export function listEvents() {
  const rows = db.prepare("SELECT * FROM events ORDER BY start_date, start_time").all();
  return rows.map((r) => mapEventRow(r));
}

export function getEventById(id) {
  const row = db.prepare("SELECT * FROM events WHERE id = ?").get(id);
  return row ? mapEventRow(row, { includeDetail: true }) : null;
}

export function createEvent(row) {
  const stmt = db.prepare(`
    INSERT INTO events (
      id, title, description, image, type, category,
      start_date, start_time, end_date, end_time, status, price, location,
      long_description, agenda_json, attendees_hint
    ) VALUES (
      @id, @title, @description, @image, @type, @category,
      @start_date, @start_time, @end_date, @end_time, @status, @price, @location,
      @long_description, @agenda_json, @attendees_hint
    )
  `);
  stmt.run(row);
  return getEventById(row.id);
}

function getReservationRow(userId, eventId) {
  return db
    .prepare(
      `SELECT * FROM event_reservations WHERE user_id = ? AND event_id = ?`
    )
    .get(userId, eventId);
}

export function getReservationStatus(userId, eventId) {
  const r = getReservationRow(userId, eventId);
  return r?.status ?? null;
}

export function createEventReservation({ userId, eventId, name, phone, email }) {
  const existing = getReservationRow(userId, eventId);
  if (existing) {
    const err = new Error("Already reserved");
    err.code = "ALREADY_RESERVED";
    throw err;
  }
  db.prepare(
    `INSERT INTO event_reservations (user_id, event_id, name, phone, email, status)
     VALUES (?, ?, ?, ?, ?, 'pending_confirmation')`
  ).run(userId, eventId, name, phone, email);
  return getReservationRow(userId, eventId);
}

export function listReservationsForUser(userId) {
  const rows = db
    .prepare(
      `SELECT r.*, e.title as event_title, e.start_date, e.start_time, e.status as event_status
       FROM event_reservations r
       JOIN events e ON e.id = r.event_id
       WHERE r.user_id = ?
       ORDER BY r.created_at DESC`
    )
    .all(userId);
  return rows.map((row) => ({
    id: row.id,
    eventId: row.event_id,
    eventTitle: row.event_title,
    name: row.name,
    phone: row.phone,
    email: row.email,
    status: row.status,
    createdAt: row.created_at,
    eventStartDate: row.start_date,
    eventStartTime: row.start_time,
    eventStatus: row.event_status,
  }));
}

export function listAllReservations() {
  const rows = db
    .prepare(
      `SELECT r.*, e.title as event_title
       FROM event_reservations r
       JOIN events e ON e.id = r.event_id
       ORDER BY r.created_at DESC`
    )
    .all();
  return rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    eventId: row.event_id,
    eventTitle: row.event_title,
    name: row.name,
    phone: row.phone,
    email: row.email,
    status: row.status,
    createdAt: row.created_at,
  }));
}

export function listAllUsers() {
  const rows = db.prepare("SELECT * FROM users ORDER BY datetime(created_at) DESC").all();
  return rows.map((r) => mapUser(r));
}

export function seedEventsIfEmpty() {
  const n = db.prepare("SELECT COUNT(*) as c FROM events").get().c;
  if (n > 0) return;
  const insert = db.prepare(`
    INSERT INTO events (
      id, title, description, image, type, category,
      start_date, start_time, end_date, end_time, status, price, location,
      long_description, agenda_json, attendees_hint
    ) VALUES (
      @id, @title, @description, @image, @type, @category,
      @start_date, @start_time, @end_date, @end_time, @status, @price, @location,
      @long_description, @agenda_json, @attendees_hint
    )
  `);
  for (const e of dummyEvents) {
    insert.run({
      id: e.id,
      title: e.title,
      description: e.description,
      image: e.coverImage?.startsWith("http") ? e.coverImage : e.coverImage || "",
      type: e.type,
      category: e.industry,
      start_date: e.date,
      start_time: e.time,
      end_date: e.date,
      end_time: e.time,
      status: "published",
      price: e.price ?? 0,
      location: e.location ?? "",
      long_description: e.longDescription ?? e.description,
      agenda_json: JSON.stringify(e.agenda ?? []),
      attendees_hint: e.attendees ?? 0,
    });
  }
}

/** @deprecated legacy direct registration */
export function isRegisteredForEvent(userId, eventId) {
  const st = getReservationStatus(userId, eventId);
  return st === "pending_confirmation" || st === "confirmed";
}

/** @deprecated */
export function registerForEvent(userId, eventId) {
  const profile = getUserById(userId);
  if (!profile) return;
  try {
    createEventReservation({
      userId,
      eventId,
      name: profile.name,
      phone: profile.phone || "",
      email: profile.email,
    });
  } catch (e) {
    if (e.code !== "ALREADY_RESERVED") throw e;
  }
}

export { db };
