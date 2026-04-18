import { Router } from "express";
import { verifyIdToken } from "../firebase-admin.js";
import { getUserById, syncAdminRoleForUser } from "../db.js";

export const authRouter = Router();

/**
 * POST /api/auth/verify
 * Body: { idToken: string }
 * Verifies Firebase ID token and returns whether the user exists in our DB + profile if present.
 */
authRouter.post("/verify", async (req, res) => {
  const idToken = req.body?.idToken;
  if (!idToken || typeof idToken !== "string") {
    return res.status(400).json({ error: "idToken is required" });
  }

  try {
    const decoded = await verifyIdToken(idToken);
    let profile = getUserById(decoded.uid);
    if (profile) {
      profile = syncAdminRoleForUser(decoded.uid, decoded.phone_number ?? null) ?? profile;
    }
    return res.json({
      uid: decoded.uid,
      phone: decoded.phone_number ?? null,
      userExists: Boolean(profile),
      profile: profile ?? undefined,
    });
  } catch (e) {
    return res.status(401).json({ error: "Invalid or expired idToken" });
  }
});
