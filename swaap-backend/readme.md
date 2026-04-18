# SWAAP Backend

Node.js **Express** API for SWAAP: **Firebase phone auth** verification, **SQLite** persistence for users and events, **event reservations** (signups), and **admin** tools. The service account can read **Firebase Realtime Database** threads for **event-scoped host–guest chat** (used by the admin panel).

## Features (summary)

- Verify Firebase **ID tokens** and return whether the user has completed onboarding.
- **Sync admin role** on each verify: profiles whose phone matches the organiser allowlist get `userType: "Admin"` (see [Admin users](#admin-users)).
- **Users**: create/update profile, public directory, public profile by uid, my event reservations.
- **Events**: list/detail from SQLite; optional Bearer token attaches `isRegistered` and `reservationStatus`.
- **Reservations**: `POST /api/events/:id/reserve` creates a **pending_confirmation** row (not a final ticket until you confirm in your process).
- **Admin** (Bearer + Admin): list users, reservations, events; create events (Swaap stream, host uid, price in **numeric SAR** as stored); list signups per event; **read** host–attendee chat messages for an event via the Admin SDK.

## Setup

1. Copy `.env.example` to `.env` and set variables (see [Environment variables](#environment-variables)).
2. In [Firebase Console](https://console.firebase.google.com/) → your project → **Project settings** → **Service accounts** → **Generate new private key**. Put the entire JSON object into `FIREBASE_SERVICE_ACCOUNT` as a **single line** in `.env`, **or** set `GOOGLE_APPLICATION_CREDENTIALS` to the path of that JSON file.
3. Enable **Phone** sign-in under **Authentication** → **Sign-in method** (the web app uses the same Firebase project as in `swaap/src/lib/firebase-config.js`).
4. Enable **Realtime Database** if you use in-app chat; set `FIREBASE_DATABASE_URL` if it is not the default `https://<project_id>-default-rtdb.firebaseio.com`.
5. Install and run:

```bash
npm install
npm run dev
```

Default URL: `http://localhost:4000`. Set `CORS_ORIGIN` to your Next dev/prod origins (comma-separated, **no trailing slashes**). The frontend in this monorepo runs on **port 3001** by default (`npm run dev` in `swaap`), so include `http://localhost:3001` in `CORS_ORIGIN`.

### Environment variables

| Key | Required | Description |
|-----|----------|-------------|
| `PORT` | No | Defaults to `4000` locally; Render injects `PORT` automatically. |
| `CORS_ORIGIN` | **Yes** (production) | Comma-separated allowed browser origins. |
| `DATA_DIR` | Recommended on Render | Absolute path to persistent disk (e.g. `/var/data`) for `swaap.db`. |
| `FIREBASE_SERVICE_ACCOUNT` | **Yes** | Service account JSON as one line (or use `GOOGLE_APPLICATION_CREDENTIALS`). |
| `FIREBASE_DATABASE_URL` | No | Realtime Database URL; if omitted, derived from `project_id` in the service account JSON (or a safe default for this project). Needed for admin chat reads. |
| `ADMIN_PHONES` | No | Extra admin phones in **E.164**, comma-separated. **Built-in allowlist** (always active): `+966581277377`, `+201282160015` (normalization strips spaces). |

Never commit `.env` or `data/*.db` to Git.

## Admin users

- **Who is an admin?** Users whose **normalized** phone number matches the built-in list or `ADMIN_PHONES`.
- **Normalization** (`normalizePhoneE164` in `src/db.js`): trims, removes spaces/dashes/parentheses, ensures a leading `+` for digit-only input.
- **When it applies**: On **`POST /api/auth/verify`**, if a profile exists, the server runs **`syncAdminRoleForUser`**, which sets `users.user_type` to `Admin` or `User` accordingly. New profiles created via **`POST /api/users/profile`** also get the correct type from the stored phone.
- **Authorization**: Routes under `/api/admin/*` use `requireAuth` + `requireAdmin` (`user_type === 'Admin'` in SQLite).

## Data model (SQLite)

| Table | Purpose |
|-------|---------|
| `users` | One row per Firebase `uid`: phone, email, name, interest, onboarding fields, social/business fields, `user_type`. |
| `events` | Event records: title, description, image, type, category, dates/times, price (**numeric**, interpreted as **SAR** in the frontend), location, `swaap_stream`, `host_user_id`, agenda JSON, etc. |
| `event_reservations` | Signup requests: `user_id`, `event_id`, snapshot name/phone/email, `status` (`pending_confirmation`, `confirmed`, …). |

On first start with an empty `events` table, **`seedEventsIfEmpty()`** inserts rows from `src/data/dummy-events.js`.

## Firebase Realtime Database (chat)

- The **web client** writes guest–host messages under paths like `event_pair_messages/{eventId}/{minUid}/{maxUid}/items` (see the frontend `pair-messages` helper).
- **Security rules** should allow only the two participant uids to read/write those nodes (see comments in `swaap/src/lib/firebase-config.js`).
- This backend **reads** those paths with the **Admin SDK** for the organiser UI: `readEventHostAttendeeMessages` in `src/firebase-admin.js` (bypasses client rules).

## API reference

All JSON bodies use `Content-Type: application/json` unless noted. Errors generally return `{ "error": "message" }` with an appropriate HTTP status.

### Health

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | `{ ok, service }` — liveness check. |

### Auth

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/auth/verify` | **Body:** `{ "idToken": "<Firebase ID token>" }`. Verifies the token. **Response:** `{ uid, phone, userExists, profile? }`. If `profile` exists, **`user_type` is synced** from the organiser phone allowlist before the profile is returned. |

### Users

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/users/me` | Bearer | `{ profile }`. **404** if not onboarded. |
| `GET` | `/api/users/me/event-reservations` | Bearer | `{ reservations }` for the current user. |
| `GET` | `/api/users/directory` | None | **Public directory:** `{ users }` — safe fields only (no phone/email in public payload shape). |
| `GET` | `/api/users/:userId/public` | None | `{ profile }` for Explore / public profile links. **404** if unknown. |
| `POST` | `/api/users/profile` | Bearer | Create profile once. **Body:** `name`, `email`, `interest`, `hearAbout`, plus optional extended fields. **409** if profile exists. |
| `PATCH` | `/api/users/profile` | Bearer | Partial update; `interest` must remain in the allowed list if sent. |

**Allowed `interest` values** are defined in `src/data/dummy-events.js` (`ALLOWED_INTERESTS`) and must stay in sync with the web app’s constants.

### Events

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/events` | Optional Bearer | `{ events }` from SQLite. With valid Bearer **and** existing profile, each event includes `isRegistered` and `reservationStatus`. |
| `GET` | `/api/events/:id` | Optional Bearer | `{ event }` with detail fields (`longDescription`, `agenda`, `swaapStream`, `hostUserId`, …). |
| `POST` | `/api/events/:id/reserve` | Bearer | Creates a reservation request. **403** without profile. **409** if already requested. |

### Admin (`/api/admin`)

All routes require **`Authorization: Bearer <idToken>`** and **`user_type: Admin`** in the database.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/admin/users` | `{ users }` — full user rows (includes phone, email). |
| `GET` | `/api/admin/reservations` | `{ reservations }` — all signup rows with event title. |
| `GET` | `/api/admin/events` | `{ events }` — event list (same shape as public list fields from DB). |
| `GET` | `/api/admin/events/:eventId/reservations` | `{ reservations }` for one event (`userId`, name, phone, email, status, …). |
| `GET` | `/api/admin/events/:eventId/conversations/:attendeeUserId/messages` | `{ messages, notice? }` — reads RTDB **event-scoped** thread between **event `hostUserId`** and **attendee** Firebase uid. Empty list if no messages or no host. |
| `POST` | `/api/admin/events` | **Body:** `title`, `description`, `startDate`, `startTime`, `endDate`, `endTime`, optional `image`, `type`, `category`, `status`, `price` (SAR number), `location`, `longDescription`, `agenda`, `attendeesHint`, `swaapStream`, `hostUserId`. Creates a new event. |

## Deploy to GitHub

This API lives in the monorepo folder **`swaap-backend/`**.

```bash
cd /path/to/Swap
git add swaap-backend
git commit -m "Update SWAAP backend"
git push origin main
```

Do **not** commit `.env` or production `*.db` files. Use `.gitignore` as configured in the repo root.

## Deploy to Render (or similar)

1. Connect the GitHub repo; set **Root Directory** to `swaap-backend` if the service is the API only.
2. **Build:** `npm install` · **Start:** `npm start`
3. Mount a **persistent disk** (paid tier) and set `DATA_DIR` to the mount path (e.g. `/var/data`).
4. Set `CORS_ORIGIN`, `FIREBASE_SERVICE_ACCOUNT`, and optionally `FIREBASE_DATABASE_URL` and `ADMIN_PHONES`.

See also the monorepo **`render.yaml`** blueprint if present.

## Client integration (Next.js)

The web app sets **`NEXT_PUBLIC_API_URL`** to this API’s public HTTPS URL (no trailing slash). Phone OTP runs in the browser; only **ID tokens** are sent to protected routes.

**Currency:** amounts are stored as numbers; the UI labels them **SAR**.

## Security notes

- Never expose the service account in client bundles; keep it only in server environment variables.
- Use HTTPS in production; restrict `CORS_ORIGIN`; consider rate limiting on `/api/auth/verify` and write endpoints.
- Tighten **Realtime Database rules** so only conversation participants can access `pair_messages` / `event_pair_messages` paths; rely on Admin SDK only on the server for organiser read access.
