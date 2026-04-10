import { verifyIdToken } from "../firebase-admin.js";

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  const token =
    header?.startsWith("Bearer ") ? header.slice(7) : req.body?.idToken;

  if (!token) {
    return res.status(401).json({ error: "Missing Bearer token or idToken" });
  }

  try {
    const decoded = await verifyIdToken(token);
    req.user = { uid: decoded.uid, phone: decoded.phone_number ?? null };
    next();
  } catch (e) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
