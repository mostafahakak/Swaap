import { Router } from "express";
import { createContactSubmission } from "../db.js";

export const contactRouter = Router();

/** Public: site contact form (no auth). */
contactRouter.post("/", (req, res) => {
  const b = req.body ?? {};
  const name = b.name != null ? String(b.name).trim() : "";
  const email = b.email != null ? String(b.email).trim().toLowerCase() : "";
  const message = b.message != null ? String(b.message).trim() : "";

  if (!name || name.length > 200) {
    return res.status(400).json({ error: "Please enter your name (max 200 characters)." });
  }
  if (!email || email.length > 320) {
    return res.status(400).json({ error: "Please enter a valid email address." });
  }
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!emailOk) {
    return res.status(400).json({ error: "Please enter a valid email address." });
  }
  if (!message || message.length < 3) {
    return res.status(400).json({ error: "Please enter a message (at least a few words)." });
  }
  if (message.length > 10000) {
    return res.status(400).json({ error: "Message is too long. Please shorten and try again." });
  }

  try {
    const submission = createContactSubmission({ name, email, message });
    return res.status(201).json({ ok: true, submission });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Could not save your message. Please try again later." });
  }
});
