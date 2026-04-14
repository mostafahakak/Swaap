import { Router } from "express";
import { createUser, getUserById, updateUserProfile, listReservationsForUser } from "../db.js";
import { requireAuth } from "../middleware/require-auth.js";
import { ALLOWED_INTERESTS } from "../data/dummy-events.js";

export const usersRouter = Router();

usersRouter.get("/me", requireAuth, (req, res) => {
  const profile = getUserById(req.user.uid);
  if (!profile) {
    return res.status(404).json({ error: "Profile not found", userExists: false });
  }
  return res.json({ profile });
});

usersRouter.get("/me/event-reservations", requireAuth, (req, res) => {
  const profile = getUserById(req.user.uid);
  if (!profile) {
    return res.status(404).json({ error: "Profile not found" });
  }
  return res.json({ reservations: listReservationsForUser(req.user.uid) });
});

/**
 * POST /api/users/profile — create profile once
 */
usersRouter.post("/profile", requireAuth, (req, res) => {
  const b = req.body ?? {};
  const { name, email, interest, hearAbout, professionArea, title, linkedinUrl } = b;

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
    job_role: b.jobRole != null ? String(b.jobRole).trim() : "",
    company_name: b.companyName != null ? String(b.companyName).trim() : "",
    industry: b.industry != null ? String(b.industry).trim() : "",
    looking_for: b.lookingFor != null ? String(b.lookingFor).trim() : "",
    can_offer: b.canOffer != null ? String(b.canOffer).trim() : "",
    business_owner: Boolean(b.businessOwner),
    business_website: b.businessWebsite != null ? String(b.businessWebsite).trim() : "",
    social_instagram: b.socialInstagram != null ? String(b.socialInstagram).trim() : "",
    social_facebook: b.socialFacebook != null ? String(b.socialFacebook).trim() : "",
    social_linkedin: b.socialLinkedin != null ? String(b.socialLinkedin).trim() : "",
    social_snapchat: b.socialSnapchat != null ? String(b.socialSnapchat).trim() : "",
    social_tiktok: b.socialTiktok != null ? String(b.socialTiktok).trim() : "",
  });

  return res.status(201).json({ profile });
});

/**
 * PATCH /api/users/profile — update existing profile
 */
usersRouter.patch("/profile", requireAuth, (req, res) => {
  const profile = getUserById(req.user.uid);
  if (!profile) {
    return res.status(404).json({ error: "Profile not found" });
  }

  const b = req.body ?? {};
  if (b.interest != null && !ALLOWED_INTERESTS.includes(b.interest)) {
    return res.status(400).json({ error: "Invalid interest", allowed: ALLOWED_INTERESTS });
  }
  if (b.hearAbout != null) {
    const hear = String(b.hearAbout).trim();
    if (hear.length < 2 || hear.length > 500) {
      return res.status(400).json({ error: "hearAbout must be between 2 and 500 characters" });
    }
  }

  const updated = updateUserProfile(req.user.uid, {
    email: b.email,
    name: b.name,
    interest: b.interest,
    professionArea: b.professionArea,
    title: b.title,
    linkedinUrl: b.linkedinUrl,
    hearAbout: b.hearAbout,
    jobRole: b.jobRole,
    companyName: b.companyName,
    industry: b.industry,
    lookingFor: b.lookingFor,
    canOffer: b.canOffer,
    businessOwner: b.businessOwner,
    businessWebsite: b.businessWebsite,
    socialInstagram: b.socialInstagram,
    socialFacebook: b.socialFacebook,
    socialLinkedin: b.socialLinkedin,
    socialSnapchat: b.socialSnapchat,
    socialTiktok: b.socialTiktok,
  });

  return res.json({ profile: updated });
});
