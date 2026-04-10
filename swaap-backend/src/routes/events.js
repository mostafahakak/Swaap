import { Router } from "express";
import { dummyEvents } from "../data/dummy-events.js";
import { requireAuth } from "../middleware/require-auth.js";
import { isRegisteredForEvent, registerForEvent, getUserById } from "../db.js";
import { verifyIdToken } from "../firebase-admin.js";

export const eventsRouter = Router();

function publicEvent(e) {
  const { longDescription, agenda, coverImage, ...rest } = e;
  return rest;
}

/**
 * GET /api/events
 * Optional: Authorization Bearer — adds isRegistered per event for authenticated users with a profile.
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

    const list = dummyEvents.map((e) => {
      const base = publicEvent(e);
      if (uid) {
        return { ...base, isRegistered: isRegisteredForEvent(uid, e.id) };
      }
      return base;
    });

    return res.json({ events: list });
  } catch (e) {
    next(e);
  }
});

/**
 * GET /api/events/:id
 * Full detail for an event. Optional Bearer adds isRegistered.
 */
eventsRouter.get("/:id", async (req, res, next) => {
  try {
    const event = dummyEvents.find((e) => e.id === req.params.id);
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    let isRegistered = false;
    const header = req.headers.authorization;
    if (header?.startsWith("Bearer ")) {
      try {
        const decoded = await verifyIdToken(header.slice(7));
        if (getUserById(decoded.uid)) {
          isRegistered = isRegisteredForEvent(decoded.uid, event.id);
        }
      } catch {
        /* optional */
      }
    }

    return res.json({ event: { ...event, isRegistered } });
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/events/:id/register
 * Authorization: Bearer <Firebase ID token>
 * Requires an existing user profile in the database.
 */
eventsRouter.post("/:id/register", requireAuth, (req, res) => {
  const event = dummyEvents.find((e) => e.id === req.params.id);
  if (!event) {
    return res.status(404).json({ error: "Event not found" });
  }

  if (!getUserById(req.user.uid)) {
    return res.status(403).json({ error: "Complete your profile before registering" });
  }

  registerForEvent(req.user.uid, event.id);
  return res.status(201).json({
    ok: true,
    eventId: event.id,
    message: "Registered successfully",
  });
});
