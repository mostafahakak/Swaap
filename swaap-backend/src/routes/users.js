import { Router } from "express";
import { createUser, getUserById } from "../db.js";
import { requireAuth } from "../middleware/require-auth.js";
import { ALLOWED_INTERESTS } from "../data/dummy-events.js";

export const usersRouter = Router();

/**
 * GET /api/users/me
 * Authorization: Bearer <Firebase ID token>
 */
usersRouter.get("/me", requireAuth, (req, res) => {
  const profile = getUserById(req.user.uid);
  if (!profile) {
    return res.status(404).json({ error: "Profile not found", userExists: false });
  }
  return res.json({ profile });
});

/**
 * POST /api/users/profile
 * Authorization: Bearer <Firebase ID token>
 * Body: { name, email, interest, hearAbout } — optional legacy: professionArea, title, linkedinUrl
 */
usersRouter.post("/profile", requireAuth, (req, res) => {
  const { name, email, interest, hearAbout, professionArea, title, linkedinUrl } = req.body ?? {};

  if (!name || !email || !interest || hearAbout === undefined || hearAbout === null) {
    return res.status(400).json({
      error: "name, email, interest, and hearAbout are required",
    });
  }

  const hear = String(hearAbout).trim();
  if (hear.length < 2 || hear.length > 500) {
    return res.status(400).json({
      error: "hearAbout must be between 2 and 500 characters",
    });
  }

  if (!ALLOWED_INTERESTS.includes(interest)) {
    return res.status(400).json({
      error: "Invalid interest",
      allowed: ALLOWED_INTERESTS,
    });
  }

  if (getUserById(req.user.uid)) {
    return res.status(409).json({ error: "Profile already exists" });
  }

  const profile = createUser({
    id: req.user.uid,
    phone: req.user.phone ?? "",
    email: String(email).trim(),
    name: String(name).trim(),
    interest: String(interest).trim(),
    profession_area: professionArea != null ? String(professionArea).trim() : "",
    title: title != null ? String(title).trim() : "",
    linkedin_url: linkedinUrl != null ? String(linkedinUrl).trim() : "",
    hear_about: hear,
  });

  return res.status(201).json({ profile });
});
