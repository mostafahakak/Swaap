# SWAAP Backend

Node.js **Express** API for SWAAP: **Firebase phone auth** verification, **SQLite** persistence for users and events, **event reservations** (signups), and **admin** tools. The service account can read **Firebase Realtime Database** threads for **event-scoped host–guest chat** (used by the admin panel).

## Contents

- [Features](#features-summary)
- [Setup & environment](#setup)
- [Admin users](#admin-users)
- [Data model](#data-model-sqlite)
- [Firebase Realtime Database (chat)](#firebase-realtime-database-chat)
- [**API documentation**](#api-documentation) — all endpoints, requests, responses, examples
- [Deploy](#deploy-to-github)

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

## API documentation

**In this section:** [Conventions](#api-documentation) · [1. Health](#1-health) · [2. Authentication](#2-authentication) · [3. Users](#3-users) · [4. Events](#4-events) · [5. Admin](#5-admin) · [Reference shapes](#reference-response-shapes)

**Base URL:** your server origin (e.g. `http://localhost:4000` or `https://your-api.onrender.com`). All API paths below are relative to that origin.

**Content-Type:** use `Content-Type: application/json` for any request with a body.

**Authentication:**

- **Bearer:** `Authorization: Bearer <Firebase ID token>` (from the client after phone sign-in).
- **Public routes** do not require a header.

**CORS:** browser `POST`/`PATCH` must come from an origin listed in `CORS_ORIGIN` (merged with defaults in `src/index.js`).

### Error responses

Most failures return JSON:

```json
{ "error": "Human-readable message" }
```

| Status | Typical cause |
|--------|----------------|
| `400` | Missing/invalid body fields, invalid `interest`, validation errors. |
| `401` | Missing/invalid/expired Firebase token (`/api/auth/verify`, protected routes). |
| `403` | Authenticated but not allowed (e.g. reserve without profile, non-admin on `/api/admin/*`). |
| `404` | Unknown user profile, event, or public profile. |
| `409` | Profile already exists; duplicate reservation for same user+event. |
| `500` | Unhandled server error (`{ "error": "Internal server error" }`). |

Some `400` responses include extra keys (e.g. `{ "error": "Invalid interest", "allowed": [ ... ] }`).

---

### 1. Health

#### `GET /health`

**Auth:** none.

**Response** `200`:

```json
{
  "ok": true,
  "service": "swaap-backend"
}
```

**Example:**

```bash
curl -s https://YOUR_API/health
```

---

### 2. Authentication

#### `POST /api/auth/verify`

Verifies a Firebase ID token and returns whether the user has a row in `users`. If a profile exists, **`userType` is synced** to `Admin` or `User` based on the organiser phone allowlist before the response.

**Auth:** none  

**Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `idToken` | string | Yes | Firebase ID token from the client SDK. |

**Response** `200`:

| Field | Type | Description |
|-------|------|-------------|
| `uid` | string | Firebase user id. |
| `phone` | string \| null | E.164 phone from the token, if present. |
| `userExists` | boolean | `true` if a `users` row exists for `uid`. |
| `profile` | object | Present only if `userExists`; same fields as in [Full profile](#reference-response-shapes). |

**Errors:** `400` (no idToken), `401` (invalid/expired token).

**Example:**

```bash
curl -s -X POST https://YOUR_API/api/auth/verify \
  -H "Content-Type: application/json" \
  -d '{"idToken":"eyJhbGciOi..."}'
```

---

### 3. Users

Route prefix: `/api/users`

#### `GET /api/users/me`

Returns the authenticated user’s full profile.

**Auth:** `Authorization: Bearer <idToken>`.

**Response** `200`: `{ "profile": <FullProfile> }`  

**Errors:** `401`, `404` `{ "error": "Profile not found", "userExists": false }`

**Example:**

```bash
curl -s https://YOUR_API/api/users/me \
  -H "Authorization: Bearer YOUR_ID_TOKEN"
```

---

#### `GET /api/users/me/event-reservations`

Lists event signup rows for the current user.

**Auth:** Bearer  

**Response** `200`:

```json
{
  "reservations": [
    {
      "id": 1,
      "eventId": "evt-1",
      "eventTitle": "…",
      "name": "…",
      "phone": "…",
      "email": "…",
      "status": "pending_confirmation",
      "createdAt": "2026-01-01 12:00:00",
      "eventStartDate": "2026-05-15",
      "eventStartTime": "18:00 UTC",
      "eventStatus": "published"
    }
  ]
}
```

**Errors:** `401`, `404` (no profile).

---

#### `GET /api/users/directory`

Public member list for Explore (no email/phone in each item).

**Auth:** none  

**Response** `200`: `{ "users": [ <PublicProfile>, ... ] }` — see [Public profile](#public-profile-directory--shared-links).

---

#### `GET /api/users/:userId/public`

Public profile by Firebase uid (`userId` must not be mistaken for the literal path `profile`; this is `GET /api/users/<firebaseUid>/public`).

**Auth:** none  

**Response** `200`: `{ "profile": <PublicProfile> }`  

**Errors:** `404`

**Example:**

```bash
curl -s "https://YOUR_API/api/users/abcFirebaseUid123/public"
```

---

#### `POST /api/users/profile`

Creates the `users` row **once** for the token’s `uid`.

**Auth:** Bearer  

**Body (required):**

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Display name. |
| `email` | string | Email. |
| `interest` | string | Must be one of [Allowed interests](#allowed-interest-values). |
| `hearAbout` | string | 2–500 characters (how they heard about SWAAP). |

**Body (optional):** `professionArea`, `title`, `linkedinUrl`, `jobRole`, `companyName`, `industry`, `lookingFor`, `canOffer`, `businessOwner` (boolean), `businessWebsite`, `socialInstagram`, `socialFacebook`, `socialLinkedin`, `socialSnapchat`, `socialTiktok` (all strings unless noted).

**Response** `201`: `{ "profile": <FullProfile> }`  

**Errors:** `400` (validation / invalid interest + `allowed` array), `401`, `409` (profile already exists).

**Example:**

```bash
curl -s -X POST https://YOUR_API/api/users/profile \
  -H "Authorization: Bearer YOUR_ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Ada","email":"ada@example.com","interest":"Startups","hearAbout":"Friend"}'
```

---

#### `PATCH /api/users/profile`

Updates the current user’s profile; only sent fields are applied.

**Auth:** Bearer  

**Body:** any subset of profile fields using the same **JSON names** as in `POST` (camelCase: `professionArea`, `hearAbout`, `jobRole`, `companyName`, `lookingFor`, `canOffer`, `businessOwner`, `businessWebsite`, social fields, etc.).

**Response** `200`: `{ "profile": <FullProfile> }`  

**Errors:** `400` (invalid `interest` / `hearAbout` length), `401`, `404` (no profile).

---

### 4. Events

Route prefix: `/api/events`

#### `GET /api/events`

**Auth:** optional Bearer  

- **No header:** each event omits personal signup state (implementation still returns `isRegistered` / `reservationStatus` as for a non-signed-in user).
- **Valid Bearer + user has profile:** each event includes `isRegistered` and `reservationStatus` for that user.

**Response** `200`:

```json
{
  "events": [
    {
      "id": "evt-1",
      "title": "…",
      "description": "…",
      "image": "…",
      "type": "In-person",
      "category": "Technology",
      "startDate": "2026-05-15",
      "startTime": "18:00 UTC",
      "endDate": "2026-05-15",
      "endTime": "18:00 UTC",
      "status": "published",
      "price": 0,
      "location": "…",
      "attendees": 84,
      "date": "2026-05-15",
      "time": "18:00 UTC",
      "industry": "Technology",
      "swaapStream": "Swaap Connect",
      "hostUserId": null,
      "isRegistered": false,
      "reservationStatus": null
    }
  ]
}
```

When signed in with a profile, `isRegistered` is `true` if `reservationStatus` is `pending_confirmation` or `confirmed`.

**Example:**

```bash
curl -s https://YOUR_API/api/events \
  -H "Authorization: Bearer YOUR_ID_TOKEN"
```

---

#### `GET /api/events/:id`

**Auth:** optional Bearer (same behaviour as list for `isRegistered` / `reservationStatus`).

**Response** `200`: `{ "event": <EventDetail> }` — list fields plus `longDescription`, `agenda` (array of strings).  

**Errors:** `404`

---

#### `POST /api/events/:id/reserve`

Creates a reservation request (`pending_confirmation`).

**Auth:** Bearer  

**Body:** none  

**Response** `201`:

```json
{
  "ok": true,
  "eventId": "evt-1",
  "status": "pending_confirmation",
  "message": "Reservation request submitted"
}
```

**Errors:** `401`, `403` (no profile), `404` (unknown event), `409` (already reserved).

**Example:**

```bash
curl -s -X POST https://YOUR_API/api/events/evt-1/reserve \
  -H "Authorization: Bearer YOUR_ID_TOKEN"
```

---

### 5. Admin

Route prefix: `/api/admin`  

**Auth:** every route requires `Authorization: Bearer <idToken>` where the user’s `userType` in SQLite is **`Admin`**.  

**Errors:** `401` (token), `403` `{ "error": "Admin access required" }`.

---

#### `GET /api/admin/users`

**Response** `200`: `{ "users": [ <FullProfile>, ... ] }`  
Each object includes `id` (Firebase uid), `phone`, `email`, `userType`, etc.

---

#### `GET /api/admin/reservations`

**Response** `200`:

```json
{
  "reservations": [
    {
      "id": 1,
      "userId": "firebaseUid",
      "eventId": "evt-1",
      "eventTitle": "…",
      "name": "…",
      "phone": "…",
      "email": "…",
      "status": "pending_confirmation",
      "createdAt": "…"
    }
  ]
}
```

---

#### `GET /api/admin/events`

**Response** `200`: `{ "events": [ <EventListItem>, ... ] }`  
Same shape as public list items from the database (no `longDescription`/`agenda` in list mapper).

---

#### `GET /api/admin/events/:eventId/reservations`

**Errors:** `404` if `eventId` is unknown.

**Response** `200`: `{ "reservations": [ ... ] }`  
Same reservation shape as `/api/admin/reservations`, filtered to one event.

---

#### `GET /api/admin/events/:eventId/conversations/:attendeeUserId/messages`

Reads Firebase Realtime Database messages for the **event-scoped** thread between the event’s **`hostUserId`** and **`attendeeUserId`** (sorted path under `event_pair_messages/...`).

**Errors:** `404` if event not found.

**Response** `200` (normal):

```json
{
  "messages": [
    {
      "id": "-NxPushId",
      "text": "Hello",
      "senderId": "firebaseUid",
      "createdAt": 1710000000000
    }
  ]
}
```

**Response** `200` (no host on event):

```json
{
  "messages": [],
  "notice": "Assign a host to this event to collect host–guest messages."
}
```

---

#### `POST /api/admin/events`

Creates a new event. **`price`** is stored as a number (interpreted as **SAR** in the app UI).

**Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | Yes | Event title. |
| `startDate` | string | Yes | e.g. `2026-06-01`. |
| `startTime` | string | Yes | e.g. `18:00`. |
| `endDate` | string | Yes | |
| `endTime` | string | Yes | |
| `description` | string | No | Short description (defaults `""`). |
| `image` | string | No | Image URL. |
| `type` | string | No | e.g. `In-person`. |
| `category` | string | No | Stored as event category / industry. |
| `status` | string | No | Default `published`. |
| `price` | number | No | Default `0`. |
| `location` | string | No | |
| `longDescription` | string | No | Defaults to `description`. |
| `agenda` | string[] | No | Array of strings; stored as JSON. |
| `attendeesHint` | number | No | Shown as “attending” hint. |
| `swaapStream` | string | No | One of: `Swaap Connect`, `Swaap Grow`, `Swaap Business` (invalid values fall back to `Swaap Connect`). |
| `hostUserId` | string | No | Firebase uid of host (enables guest–host threads for this event). |

**Response** `201`: `{ "event": <EventDetail> }` with new `id` like `evt-<uuid>`.  

**Errors:** `400` (missing `title` or date/time fields).

**Example:**

```bash
curl -s -X POST https://YOUR_API/api/admin/events \
  -H "Authorization: Bearer ADMIN_ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title":"Meetup",
    "description":"Short text",
    "startDate":"2026-07-01",
    "startTime":"17:00",
    "endDate":"2026-07-01",
    "endTime":"19:00",
    "price":50,
    "location":"Riyadh",
    "swaapStream":"Swaap Grow",
    "hostUserId":"HOST_FIREBASE_UID"
  }'
```

---

### Reference: response shapes

#### Full profile (private / admin)

Returned from `/api/users/me`, `/api/users/profile` (POST/PATCH), `/api/auth/verify` (when `userExists`), and each element of `/api/admin/users`.

| Field | Type |
|-------|------|
| `id` | string (Firebase uid) |
| `phone` | string |
| `email` | string |
| `name` | string |
| `interest` | string |
| `professionArea` | string |
| `title` | string |
| `linkedinUrl` | string |
| `hearAbout` | string |
| `userType` | `"User"` \| `"Admin"` |
| `jobRole`, `companyName`, `industry`, `lookingFor`, `canOffer` | string |
| `businessOwner` | boolean |
| `businessWebsite`, `socialInstagram`, `socialFacebook`, `socialLinkedin`, `socialSnapchat`, `socialTiktok` | string |
| `createdAt` | string (ISO-ish sqlite datetime) |

#### Public profile (directory / shared links)

Used in `/api/users/directory` and `/api/users/:userId/public`. **Omits** `phone`, `email`, `userType`, `hearAbout`, `createdAt`. Includes `id`, `name`, `interest`, professional fields, social URLs, `businessOwner`, etc.

#### Event object

List responses use the fields shown under `GET /api/events`. **Detail** (`GET /api/events/:id`, create event response) also includes `longDescription` (string) and `agenda` (string array).

#### Allowed interest values

Exact strings in `src/data/dummy-events.js` (`ALLOWED_INTERESTS`), for example: `Startups`, `Business Growth`, `Fundraising`, `Marketing`, `Strategy`, `Sales`, `Innovation`, `AI in Business`, `Digital Transformation`, `Emerging Technologies`, `Public Speaking`, `Networking`, `Mentorship`, `Leadership Development`, `Partnerships`, `Collaboration`.

#### Swaap stream values (events)

`Swaap Connect`, `Swaap Grow`, `Swaap Business` (`SWAAP_STREAMS` in `src/data/dummy-events.js`).

---

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
