import { Router } from "express";
import crypto from "node:crypto";
import { requireAuth } from "../middleware/require-auth.js";
import { requireAdmin } from "../middleware/require-admin.js";
import {
  createEvent,
  deleteEventById,
  listAllReservations,
  listAllUsers,
  getEventById,
  listEvents,
  listReservationsForEvent,
  listContactSubmissions,
  updateEventRow,
} from "../db.js";
import { SWAAP_STREAMS } from "../data/dummy-events.js";
import { readEventHostAttendeeMessages } from "../firebase-admin.js";

export const adminRouter = Router();

adminRouter.use(requireAuth, requireAdmin);

adminRouter.get("/users", (_req, res) => {
  res.json({ users: listAllUsers() });
});

adminRouter.get("/reservations", (_req, res) => {
  res.json({ reservations: listAllReservations() });
});

/** Contact form messages from the public /contact page, newest first. */
adminRouter.get("/contact-messages", (_req, res) => {
  res.json({ messages: listContactSubmissions() });
});

adminRouter.get("/events", (_req, res) => {
  res.json({ events: listEvents() });
});

adminRouter.get("/events/:eventId", (req, res) => {
  const ev = getEventById(req.params.eventId);
  if (!ev) {
    return res.status(404).json({ error: "Event not found" });
  }
  return res.json({ event: ev });
});

adminRouter.get("/events/:eventId/reservations", (req, res) => {
  const ev = getEventById(req.params.eventId);
  if (!ev) {
    return res.status(404).json({ error: "Event not found" });
  }
  return res.json({ reservations: listReservationsForEvent(req.params.eventId) });
});

adminRouter.get("/events/:eventId/conversations/:attendeeUserId/messages", async (req, res, next) => {
  try {
    const ev = getEventById(req.params.eventId);
    if (!ev) {
      return res.status(404).json({ error: "Event not found" });
    }
    const hostUid = ev.hostUserId;
    if (!hostUid) {
      return res.json({
        messages: [],
        notice: "Assign a host to this event to collect host–guest messages.",
      });
    }
    const messages = await readEventHostAttendeeMessages(
      req.params.eventId,
      hostUid,
      req.params.attendeeUserId
    );
    return res.json({ messages });
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/admin/events
 * Body: title, description, image, type, category, startDate, startTime, endDate, endTime,
 *       status?, price?, location?, longDescription?, agenda? (array), attendeesHint?
 */
adminRouter.post("/events", (req, res) => {
  const b = req.body ?? {};
  const title = b.title != null ? String(b.title).trim() : "";
  if (!title) {
    return res.status(400).json({ error: "title is required" });
  }

  const id = `evt-${crypto.randomUUID()}`;
  const streamRaw = b.swaapStream != null ? String(b.swaapStream).trim() : "Swaap Connect";
  const swaap_stream = SWAAP_STREAMS.includes(streamRaw) ? streamRaw : "Swaap Connect";
  const host_user_id = b.hostUserId != null ? String(b.hostUserId).trim() : "";

  const row = {
    id,
    title,
    description: b.description != null ? String(b.description).trim() : "",
    image: b.image != null ? String(b.image).trim() : "",
    type: b.type != null ? String(b.type).trim() : "",
    category: b.category != null ? String(b.category).trim() : "",
    start_date: b.startDate != null ? String(b.startDate).trim() : "",
    start_time: b.startTime != null ? String(b.startTime).trim() : "",
    end_date: b.endDate != null ? String(b.endDate).trim() : "",
    end_time: b.endTime != null ? String(b.endTime).trim() : "",
    status: b.status != null ? String(b.status).trim() : "published",
    price: b.price != null ? Number(b.price) : 0,
    location: b.location != null ? String(b.location).trim() : "",
    long_description:
      b.longDescription != null ? String(b.longDescription).trim() : String(b.description || "").trim(),
    agenda_json: JSON.stringify(Array.isArray(b.agenda) ? b.agenda : []),
    attendees_hint: b.attendeesHint != null ? Number(b.attendeesHint) : 0,
    swaap_stream,
    host_user_id,
    admin_created: 1,
  };

  if (!row.start_date || !row.start_time || !row.end_date || !row.end_time) {
    return res.status(400).json({
      error: "startDate, startTime, endDate, and endTime are required",
    });
  }

  createEvent(row);
  const created = getEventById(id);
  return res.status(201).json({ event: created });
});

/**
 * PATCH /api/admin/events/:eventId
 * Same body fields as POST (partial merge: omitted fields keep existing values).
 */
adminRouter.patch("/events/:eventId", (req, res) => {
  const eventId = req.params.eventId;
  const existing = getEventById(eventId);
  if (!existing) {
    return res.status(404).json({ error: "Event not found" });
  }
  const b = req.body ?? {};
  const title =
    b.title != null ? String(b.title).trim() : String(existing.title || "").trim();
  if (!title) {
    return res.status(400).json({ error: "title is required" });
  }

  const streamRaw =
    b.swaapStream != null ? String(b.swaapStream).trim() : existing.swaapStream || "Swaap Connect";
  const swaap_stream = SWAAP_STREAMS.includes(streamRaw) ? streamRaw : existing.swaapStream || "Swaap Connect";
  const host_user_id =
    b.hostUserId !== undefined
      ? String(b.hostUserId ?? "").trim()
      : (existing.hostUserId && String(existing.hostUserId).trim()) || "";

  const description =
    b.description != null ? String(b.description).trim() : existing.description ?? "";
  const start_date =
    b.startDate != null ? String(b.startDate).trim() : existing.startDate ?? "";
  const start_time =
    b.startTime != null ? String(b.startTime).trim() : existing.startTime ?? "";
  const end_date = b.endDate != null ? String(b.endDate).trim() : existing.endDate ?? "";
  const end_time = b.endTime != null ? String(b.endTime).trim() : existing.endTime ?? "";

  if (!start_date || !start_time || !end_date || !end_time) {
    return res.status(400).json({
      error: "startDate, startTime, endDate, and endTime are required",
    });
  }

  let agenda = existing.agenda;
  if (Array.isArray(b.agenda)) {
    agenda = b.agenda;
  }
  const longDesc =
    b.longDescription != null
      ? String(b.longDescription).trim()
      : existing.longDescription ?? description;

  const row = {
    title,
    description,
    image: b.image != null ? String(b.image).trim() : existing.image ?? "",
    type: b.type != null ? String(b.type).trim() : existing.type ?? "",
    category: b.category != null ? String(b.category).trim() : existing.category ?? "",
    start_date,
    start_time,
    end_date,
    end_time,
    status: b.status != null ? String(b.status).trim() : existing.status ?? "published",
    price: b.price != null ? Number(b.price) : Number(existing.price) || 0,
    location: b.location != null ? String(b.location).trim() : existing.location ?? "",
    long_description: longDesc || description,
    agenda_json: JSON.stringify(Array.isArray(agenda) ? agenda : []),
    attendees_hint:
      b.attendeesHint != null ? Number(b.attendeesHint) : Number(existing.attendees) || 0,
    swaap_stream,
    host_user_id,
  };

  const updated = updateEventRow(eventId, row);
  return res.json({ event: updated });
});

adminRouter.delete("/events/:eventId", (req, res) => {
  const ok = deleteEventById(req.params.eventId);
  if (!ok) {
    return res.status(404).json({ error: "Event not found" });
  }
  return res.status(204).send();
});
