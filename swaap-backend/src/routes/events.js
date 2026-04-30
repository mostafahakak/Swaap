import { Router } from "express";
import {
  getPublicEventById,
  getUserById,
  createEventReservation,
  getReservationStatus,
  listPublicEvents,
} from "../db.js";
import { requireAuth } from "../middleware/require-auth.js";
import { verifyIdToken } from "../firebase-admin.js";

export const eventsRouter = Router();

function attachRegistration(e, reservationStatus) {
  const isRegistered =
    reservationStatus === "pending_confirmation" || reservationStatus === "confirmed";
  return {
    ...e,
    isRegistered,
    reservationStatus: reservationStatus ?? null,
  };
}

/**
 * GET /api/events
 */
eventsRouter.get("/", async (req, res, next) => {
  try {
    let uid = null;
    const header = req.headers.authorization;
    if (header?.startsWith("Bearer ")) {
      try {
        const decoded = await verifyIdToken(header.slice(7));
        if (getUserById(decoded.uid)) uid = decoded.uid;
      } catch {
        /* optional auth */
      }
    }

    const list = listPublicEvents().map((e) => {
      const st = uid ? getReservationStatus(uid, e.id) : null;
      return attachRegistration(e, st);
    });

    return res.json({ events: list });
  } catch (e) {
    next(e);
  }
});

/**
 * GET /api/events/:id
 */
eventsRouter.get("/:id", async (req, res, next) => {
  try {
    const event = getPublicEventById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    let uid = null;
    const header = req.headers.authorization;
    if (header?.startsWith("Bearer ")) {
      try {
        const decoded = await verifyIdToken(header.slice(7));
        if (getUserById(decoded.uid)) uid = decoded.uid;
      } catch {
        /* optional */
      }
    }

    const st = uid ? getReservationStatus(uid, event.id) : null;
    return res.json({ event: attachRegistration(event, st) });
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/events/:id/reserve
 */
eventsRouter.post("/:id/reserve", requireAuth, (req, res) => {
  const event = getPublicEventById(req.params.id);
  if (!event) {
    return res.status(404).json({ error: "Event not found" });
  }

  const profile = getUserById(req.user.uid);
  if (!profile) {
    return res.status(403).json({ error: "Complete your profile before reserving" });
  }

  try {
    createEventReservation({
      userId: req.user.uid,
      eventId: event.id,
      name: profile.name,
      phone: profile.phone || req.user.phone || "",
      email: profile.email,
    });
  } catch (e) {
    if (e.code === "ALREADY_RESERVED") {
      return res.status(409).json({ error: "You already submitted a request for this event" });
    }
    throw e;
  }

  return res.status(201).json({
    ok: true,
    eventId: event.id,
    status: "pending_confirmation",
    message: "Reservation request submitted",
  });
});
