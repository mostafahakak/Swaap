import admin from "firebase-admin";

let initialized = false;

export function initFirebaseAdmin() {
  if (initialized) return;

  const json = process.env.FIREBASE_SERVICE_ACCOUNT?.trim();
  if (json) {
    const cred = JSON.parse(json);
    admin.initializeApp({
      credential: admin.credential.cert(cred),
    });
    initialized = true;
    return;
  }

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
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
