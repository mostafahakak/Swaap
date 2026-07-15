import { Router } from "express";
import {
  createUser,
  getUserById,
  updateUserProfile,
  listReservationsForUser,
  listPublicProfiles,
  getPublicProfileById,
} from "../db.js";
import { requireAuth } from "../middleware/require-auth.js";
import {
  ALLOWED_INTERESTS,
  CAN_OFFER_OPTIONS,
  CONNECT_AREAS_OPTIONS,
  CURRENT_STAGE_OPTIONS,
  DESCRIBES_YOU_OPTIONS,
  encodeMultiSelect,
  EXPERIENCE_ATTEND_OPTIONS,
  HEAR_ABOUT_OPTIONS,
  INDUSTRY_OPTIONS,
  NEED_SUPPORT_OPTIONS,
  TOPICS_INTEREST_OPTIONS,
  validateMultiSelect,
} from "../data/registration-options.js";

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

/** Public member directory for Explore (no email / phone). */
usersRouter.get("/directory", (_req, res) => {
  return res.json({ users: listPublicProfiles() });
});

/** Public profile by Firebase uid (for shared profile links). */
usersRouter.get("/:userId/public", (req, res) => {
  const profile = getPublicProfileById(req.params.userId);
  if (!profile) {
    return res.status(404).json({ error: "Profile not found" });
  }
  return res.json({ profile });
});

function resolveHearAbout(b) {
  const hear = b.hearAbout != null ? String(b.hearAbout).trim() : "";
  if (!hear) return { ok: false, error: "hearAbout is required" };
  if (hear === "Other") {
    const detail = b.hearAboutOther != null ? String(b.hearAboutOther).trim() : "";
    if (!detail) return { ok: false, error: "Please tell us how you heard about SWAAP." };
    const full = `Other: ${detail}`;
    if (full.length > 500) return { ok: false, error: "hearAbout is too long" };
    return { ok: true, value: full };
  }
  if (!HEAR_ABOUT_OPTIONS.includes(hear) && !hear.startsWith("Other:")) {
    return { ok: false, error: "Invalid hearAbout value" };
  }
  if (hear.length < 2 || hear.length > 500) {
    return { ok: false, error: "hearAbout must be between 2 and 500 characters" };
  }
  return { ok: true, value: hear };
}

function validateSelect(value, allowlist, fieldName, { required = true } = {}) {
  const v = value != null ? String(value).trim() : "";
  if (!v) {
    if (required) return { ok: false, error: `${fieldName} is required` };
    return { ok: true, value: "" };
  }
  if (!allowlist.includes(v)) {
    return { ok: false, error: `Invalid ${fieldName}` };
  }
  return { ok: true, value: v };
}

/**
 * POST /api/users/profile — create profile once (full registration wizard payload).
 */
usersRouter.post("/profile", requireAuth, (req, res) => {
  const b = req.body ?? {};
  const name = b.name != null ? String(b.name).trim() : "";
  const email = b.email != null ? String(b.email).trim() : "";

  if (!name || !email) {
    return res.status(400).json({ error: "name and email are required" });
  }

  const hearRes = resolveHearAbout(b);
  if (!hearRes.ok) return res.status(400).json({ error: hearRes.error });

  const experience = validateSelect(b.experienceAttend, EXPERIENCE_ATTEND_OPTIONS, "experienceAttend");
  if (!experience.ok) return res.status(400).json({ error: experience.error });

  const describes = validateSelect(b.describesYou, DESCRIBES_YOU_OPTIONS, "describesYou");
  if (!describes.ok) return res.status(400).json({ error: describes.error });

  const industry = validateSelect(b.industry, INDUSTRY_OPTIONS, "industry");
  if (!industry.ok) return res.status(400).json({ error: industry.error });

  const stage = validateSelect(b.currentStage, CURRENT_STAGE_OPTIONS, "currentStage");
  if (!stage.ok) return res.status(400).json({ error: stage.error });

  const looking = validateMultiSelect(b.lookingFor, NEED_SUPPORT_OPTIONS, {
    fieldName: "lookingFor",
  });
  if (!looking.ok) return res.status(400).json({ error: looking.error });

  const offer = validateMultiSelect(b.canOffer, CAN_OFFER_OPTIONS, { fieldName: "canOffer" });
  if (!offer.ok) return res.status(400).json({ error: offer.error });

  const topics = validateMultiSelect(b.topics, TOPICS_INTEREST_OPTIONS, { fieldName: "topics" });
  if (!topics.ok) return res.status(400).json({ error: topics.error });

  const connect = validateMultiSelect(b.connectAreas, CONNECT_AREAS_OPTIONS, {
    fieldName: "connectAreas",
  });
  if (!connect.ok) return res.status(400).json({ error: connect.error });

  if (!b.agreeNetworking) {
    return res.status(400).json({
      error: "You must agree to share your information for networking and matchmaking.",
    });
  }

  const primaryInterest = topics.values[0];
  const interest =
    b.interest != null && ALLOWED_INTERESTS.includes(String(b.interest).trim())
      ? String(b.interest).trim()
      : ALLOWED_INTERESTS.includes(primaryInterest)
        ? primaryInterest
        : "Networking";

  if (getUserById(req.user.uid)) {
    return res.status(409).json({ error: "Profile already exists" });
  }

  const profile = createUser({
    id: req.user.uid,
    phone: req.user.phone ?? "",
    email,
    name,
    interest,
    profession_area: b.professionArea != null ? String(b.professionArea).trim() : "",
    title: b.title != null ? String(b.title).trim() : b.jobRole != null ? String(b.jobRole).trim() : "",
    linkedin_url: b.linkedinUrl != null ? String(b.linkedinUrl).trim() : "",
    hear_about: hearRes.value,
    job_role: b.jobRole != null ? String(b.jobRole).trim() : "",
    company_name: b.companyName != null ? String(b.companyName).trim() : "",
    industry: industry.value,
    looking_for: encodeMultiSelect(looking.values),
    can_offer: encodeMultiSelect(offer.values),
    business_owner: Boolean(b.businessOwner),
    business_website: b.businessWebsite != null ? String(b.businessWebsite).trim() : "",
    social_instagram: b.socialInstagram != null ? String(b.socialInstagram).trim() : "",
    social_facebook: b.socialFacebook != null ? String(b.socialFacebook).trim() : "",
    social_linkedin: b.socialLinkedin != null ? String(b.socialLinkedin).trim() : "",
    social_snapchat: b.socialSnapchat != null ? String(b.socialSnapchat).trim() : "",
    social_tiktok: b.socialTiktok != null ? String(b.socialTiktok).trim() : "",
    describes_you: describes.value,
    current_stage: stage.value,
    experience_attend: experience.value,
    topics_json: encodeMultiSelect(topics.values),
    connect_areas_json: encodeMultiSelect(connect.values),
    open_to_team_meeting: Boolean(b.openToTeamMeeting),
    open_to_matchmaking: Boolean(b.openToMatchmaking),
    agree_networking: true,
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
    const hearRes = resolveHearAbout(b);
    if (!hearRes.ok) return res.status(400).json({ error: hearRes.error });
    b.hearAbout = hearRes.value;
  }

  const listPatch = {};
  if (b.lookingFor != null) {
    const looking = validateMultiSelect(b.lookingFor, NEED_SUPPORT_OPTIONS, {
      fieldName: "lookingFor",
      required: false,
    });
    if (looking.ok) {
      listPatch.lookingFor = looking.values;
    } else {
      // Profile edit may use free-text lines; still cap at 5.
      const raw = Array.isArray(b.lookingFor)
        ? b.lookingFor.map((x) => String(x).trim()).filter(Boolean)
        : String(b.lookingFor)
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean);
      listPatch.lookingFor = [...new Set(raw)].slice(0, 5);
    }
  }
  if (b.canOffer != null) {
    const offer = validateMultiSelect(b.canOffer, CAN_OFFER_OPTIONS, {
      fieldName: "canOffer",
      required: false,
    });
    if (offer.ok) {
      listPatch.canOffer = offer.values;
    } else {
      const raw = Array.isArray(b.canOffer)
        ? b.canOffer.map((x) => String(x).trim()).filter(Boolean)
        : String(b.canOffer)
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean);
      listPatch.canOffer = [...new Set(raw)].slice(0, 5);
    }
  }
  if (b.topics != null) {
    const topics = validateMultiSelect(b.topics, TOPICS_INTEREST_OPTIONS, {
      fieldName: "topics",
      required: false,
    });
    if (!topics.ok) return res.status(400).json({ error: topics.error });
    listPatch.topics = topics.values;
  }
  if (b.connectAreas != null) {
    const connect = validateMultiSelect(b.connectAreas, CONNECT_AREAS_OPTIONS, {
      fieldName: "connectAreas",
      required: false,
    });
    if (!connect.ok) return res.status(400).json({ error: connect.error });
    listPatch.connectAreas = connect.values;
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
    lookingFor: listPatch.lookingFor,
    canOffer: listPatch.canOffer,
    topics: listPatch.topics,
    connectAreas: listPatch.connectAreas,
    describesYou: b.describesYou,
    currentStage: b.currentStage,
    experienceAttend: b.experienceAttend,
    openToTeamMeeting: b.openToTeamMeeting,
    openToMatchmaking: b.openToMatchmaking,
    agreeNetworking: b.agreeNetworking,
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
