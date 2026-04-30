import "dotenv/config";
import express from "express";
import cors from "cors";
import { initFirebaseAdmin } from "./firebase-admin.js";
import { authRouter } from "./routes/auth.js";
import { usersRouter } from "./routes/users.js";
import { eventsRouter } from "./routes/events.js";
import { adminRouter } from "./routes/admin.js";
import { contactRouter } from "./routes/contact.js";
import { seedEventsIfEmpty } from "./db.js";

initFirebaseAdmin();
seedEventsIfEmpty();

const app = express();
const port = Number(process.env.PORT) || 4000;

const defaultOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "https://swaap.it.com",
  "https://www.swaap.it.com",
];

/** Merge CORS_ORIGIN (comma-separated) with defaults so production frontends are never dropped by mistake. */
const fromEnv = (process.env.CORS_ORIGIN ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const origins = [...new Set([...defaultOrigins, ...fromEnv])];

app.use(
  cors({
    origin: origins,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 204,
  })
);
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "swaap-backend" });
});

app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/events", eventsRouter);
app.use("/api/contact", contactRouter);
app.use("/api/admin", adminRouter);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(port, () => {
  console.log(`swaap-backend listening on http://localhost:${port}`);
});
