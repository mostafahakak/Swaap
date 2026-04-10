import "dotenv/config";
import express from "express";
import cors from "cors";
import { initFirebaseAdmin } from "./firebase-admin.js";
import { authRouter } from "./routes/auth.js";
import { usersRouter } from "./routes/users.js";
import { eventsRouter } from "./routes/events.js";

initFirebaseAdmin();

const app = express();
const port = Number(process.env.PORT) || 4000;

const origins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((s) => s.trim()).filter(Boolean)
  : ["http://localhost:3000"];

app.use(
  cors({
    origin: origins,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "swaap-backend" });
});

app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/events", eventsRouter);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(port, () => {
  console.log(`swaap-backend listening on http://localhost:${port}`);
});
