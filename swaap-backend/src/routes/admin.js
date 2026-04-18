import { Router } from "express";
import crypto from "node:crypto";
import { requireAuth } from "../middleware/require-auth.js";
import { requireAdmin } from "../middleware/require-admin.js";
import {
  createEvent,
  listAllReservations,
  listAllUsers,
  getEventById,
  listEvents,
  listReservationsForEvent,
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

adminRouter.get("/events", (_req, res) => {
  res.json({ events: listEvents() });
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
