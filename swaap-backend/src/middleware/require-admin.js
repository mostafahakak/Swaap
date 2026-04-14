import { isUserAdmin } from "../db.js";

export function requireAdmin(req, res, next) {
  if (!req.user?.uid) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  if (!isUserAdmin(req.user.uid)) {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}
