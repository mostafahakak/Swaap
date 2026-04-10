# SWAAP Backend

Node.js (Express) API for SWAAP: Firebase phone authentication verification, user profiles stored in SQLite, and dummy events with registration.

## Setup

1. Copy `.env.example` to `.env` and set variables.
2. In [Firebase Console](https://console.firebase.google.com/) → your project → **Project settings** → **Service accounts** → **Generate new private key**. Put the entire JSON object into `FIREBASE_SERVICE_ACCOUNT` as a single line in `.env`, **or** set `GOOGLE_APPLICATION_CREDENTIALS` to the path of that JSON file.
3. Enable **Phone** sign-in under **Authentication** → **Sign-in method** (client app uses the same Firebase project as in `swaap/src/lib/firebase-config.js`).
4. Install and run:

```bash
npm install
npm run dev
```

Default URL: `http://localhost:4000`. Set `CORS_ORIGIN` to your Next dev/prod origins (comma-separated). The frontend in this repo runs on **port 3001** by default (`npm run dev` in `swaap`), so include `http://localhost:3001` in `CORS_ORIGIN`.

## Deploy to GitHub + Render

Target repo: [github.com/mostafahakak/Swaap](https://github.com/mostafahakak/Swaap).

### 1. Push this project to GitHub

From your machine (adjust if your folder layout differs):

```bash
cd /path/to/Swap
git init
git add .
git commit -m "Initial commit: SWAAP frontend and backend"
git branch -M main
git remote add origin https://github.com/mostafahakak/Swaap.git
git push -u origin main
```

- Do **not** commit `.env` files or `swaap-backend/data/*.db`.
- If you prefer the GitHub repo to contain **only** the API, copy `swaap-backend/` to a new folder, `git init` there, and push; then on Render set **Root Directory** to blank (or remove `rootDir` from the blueprint).

### 2. Create a Web Service on Render

1. [Render Dashboard](https://dashboard.render.com/) → **New** → **Web Service** → connect `mostafahakak/Swaap`.
2. **Root Directory**: `swaap-backend` (if the repo is this monorepo). If the repo is backend-only at the root, leave empty.
3. **Runtime**: Node.
4. **Build Command**: `npm install`
5. **Start Command**: `npm start`
6. **Instance type**: Persistent disks require a **paid** instance (e.g. **Starter**). The free web tier does **not** keep SQLite across deploys reliably without a disk.

### 3. Persistent disk (SQLite)

1. In the service → **Disks** → **Add disk**.
2. **Name**: e.g. `swaap-sqlite`
3. **Mount path**: `/var/data` (recommended; matches the blueprint in `render.yaml`).
4. **Size**: 1 GB is enough to start.

Set this environment variable so the app writes the database on the disk:

| Key | Value |
|-----|--------|
| `DATA_DIR` | `/var/data` |

SQLite file will be `/var/data/swaap.db`. Without `DATA_DIR`, the app uses `./data` inside the container (ephemeral — lost on redeploy).

### 4. Environment variables on Render

| Key | Required | Description |
|-----|----------|-------------|
| `PORT` | No | Render injects `PORT` automatically; the app already uses `process.env.PORT`. |
| `DATA_DIR` | **Yes** (with disk) | `/var/data` — must match the disk mount path. |
| `CORS_ORIGIN` | **Yes** | Comma-separated frontend origins, **no trailing slashes**, e.g. `https://your-app.vercel.app,https://your-app.web.app` |
| `FIREBASE_SERVICE_ACCOUNT` | **Yes** | Full **Firebase service account JSON** as a **single line** (same as local `.env`). From [Firebase Console](https://console.firebase.google.com/) → Project → **Project settings** → **Service accounts** → **Generate new private key**. |

Optional: `GOOGLE_APPLICATION_CREDENTIALS` is **not** needed on Render if you use `FIREBASE_SERVICE_ACCOUNT`.

### 5. Firebase (what you need besides env)

- **Service account JSON** → only on the **server** as `FIREBASE_SERVICE_ACCOUNT` (never in the Next.js repo or client bundle).
- **Same Firebase project** as the web app’s `firebase-config.js` (`apiKey`, `projectId`, etc.). The **web** config stays public in the frontend; Admin SDK uses the service account.
- **Authentication** → **Phone** provider enabled; **Authorized domains** must include every domain you use for the frontend (e.g. Vercel, Firebase Hosting, `localhost` for dev).
- **Google Cloud** → the **Browser** API key used in the web app should allow your production **HTTP referrers** (see comments in `swaap/src/lib/firebase-config.js`).

### 6. Point the frontend at Render

In your deployed frontend (e.g. Vercel / Firebase Hosting env):

```env
NEXT_PUBLIC_API_URL=https://swaap-backend.onrender.com
```

Use your **actual** Render service URL (HTTPS, no trailing slash).

### 7. Blueprint (optional)

This repo includes [`render.yaml`](../render.yaml) at the monorepo root for **Infrastructure as Code**. You can use **New** → **Blueprint** on Render and select the repo; then add secret env vars in the UI after the service is created.

---

## Data

- **SQLite** file: `data/swaap.db` locally, or `$DATA_DIR/swaap.db` when `DATA_DIR` is set (e.g. on Render).
- **Tables**: `users` (profile keyed by Firebase `uid`), `event_registrations` (`user_id`, `event_id`).
- **Events**: In-memory dummy list in `src/data/dummy-events.js` (replace with a real data source later).

## API reference

All JSON bodies use `Content-Type: application/json`. Unless noted, errors return `{ "error": "message" }` with an appropriate status code.

### Health

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | `{ ok, service }` — liveness check. |

### Auth

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/auth/verify` | **Body:** `{ "idToken": "<Firebase ID token>" }`. Verifies the token with Firebase Admin. **Response:** `{ uid, phone, userExists, profile? }`. `profile` is present when a row exists in `users` for that `uid`. Use this after the client completes phone OTP to decide whether to send the user to onboarding (`userExists: false`) or home. |

### Users

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/users/me` | `Authorization: Bearer <idToken>` | Returns `{ profile }`. **404** if no profile row (user not onboarded). |
| `POST` | `/api/users/profile` | `Authorization: Bearer <idToken>` | **Body:** `{ name, email, interest, hearAbout }`. Creates the `users` row for `uid` from the token. **409** if profile already exists. `interest` must be one of the allowed values (see below). `hearAbout` is free text (2–500 chars), e.g. how they found SWAAP. Optional legacy fields: `professionArea`, `title`, `linkedinUrl` (stored if sent). |

**Allowed `interest` values** (professional meetup goals):

- `Connect with people`
- `Hire someone`
- `Seeking job`
- `Find collaborators / partners`
- `Offer or find mentorship`
- `Explore new opportunities`

### Events (dummy data)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/events` | Optional `Bearer` | Returns `{ events }` — list with public fields. If a valid Bearer is sent **and** the user has a profile, each item includes `isRegistered` (boolean). |
| `GET` | `/api/events/:id` | Optional `Bearer` | Returns `{ event }` — full detail (`longDescription`, `agenda`, `coverImage`, etc.) plus `isRegistered` when applicable (same rules as list). |
| `POST` | `/api/events/:id/register` | Required `Bearer` | Registers the user for the event. **403** if the user has no profile. **404** if `id` is unknown. **Response:** `{ ok, eventId, message }`. |

## Client integration (Next.js)

The SWAAP web app uses static export. It calls this API from the browser using `NEXT_PUBLIC_API_URL` (e.g. `http://localhost:4000`). Phone OTP runs in the client with the Firebase Web SDK; only the **ID token** is sent to this backend for verification and protected routes.

## Security notes

- Never expose the service account in client code; keep it only in backend environment variables or a secure file on the server.
- In production, use HTTPS, restrict `CORS_ORIGIN`, and consider rate limiting on `/api/auth/verify` and registration endpoints.
