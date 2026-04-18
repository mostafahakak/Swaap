import admin from "firebase-admin";

let initialized = false;

function resolveDatabaseURL(serviceAccountProjectId) {
  const fromEnv = process.env.FIREBASE_DATABASE_URL?.trim();
  if (fromEnv) return fromEnv;
  if (serviceAccountProjectId) {
    return `https://${serviceAccountProjectId}-default-rtdb.firebaseio.com`;
  }
  return "https://swaapevents-default-rtdb.firebaseio.com";
}

export function initFirebaseAdmin() {
  if (initialized) return;

  const json = process.env.FIREBASE_SERVICE_ACCOUNT?.trim();
  if (json) {
    const cred = JSON.parse(json);
    const databaseURL = resolveDatabaseURL(cred.project_id);
    admin.initializeApp({
      credential: admin.credential.cert(cred),
      databaseURL,
    });
    initialized = true;
    return;
  }

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    const databaseURL = resolveDatabaseURL(process.env.GOOGLE_CLOUD_PROJECT?.trim() || null);
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      databaseURL,
    });
    initialized = true;
    return;
  }

  console.warn(
    "[swaap-backend] FIREBASE_SERVICE_ACCOUNT or GOOGLE_APPLICATION_CREDENTIALS not set. Auth endpoints will fail until configured."
  );
}

export async function verifyIdToken(idToken) {
  if (!initialized) {
    throw new Error("Firebase Admin is not initialized. Set FIREBASE_SERVICE_ACCOUNT.");
  }
  return admin.auth().verifyIdToken(idToken);
}

/** Read event-scoped host ↔ attendee thread (Firebase Admin bypasses RTDB rules). */
export async function readEventHostAttendeeMessages(eventId, hostUid, attendeeUid) {
  if (!initialized) return [];
  try {
    const [a, b] = [hostUid, attendeeUid].sort();
    const path = `event_pair_messages/${eventId}/${a}/${b}/items`;
    const snap = await admin.database().ref(path).once("value");
    const v = snap.val();
    if (!v) return [];
    return Object.entries(v)
      .map(([id, m]) => ({ id, ...m }))
      .sort((x, y) => (x.createdAt || 0) - (y.createdAt || 0));
  } catch (e) {
    console.error("[swaap-backend] RTDB read failed:", e?.message || e);
    return [];
  }
}
