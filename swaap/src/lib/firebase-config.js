/**
 * Web client config (same project as Firebase Console → Project settings).
 *
 * If phone sign-in throws `auth/invalid-app-credential`, check:
 * 1. Firebase Console → Authentication → Sign-in method → Phone → Enabled.
 * 2. Authentication → Settings → Authorized domains → include `localhost` (covers any port).
 * 3. Google Cloud Console → APIs & Services → Credentials → your Browser API key:
 *    - If "Website restrictions" is set, add `http://localhost:3001/*` and `http://127.0.0.1:3001/*`
 *      (and your production origins).
 *    - Under "API restrictions", allow at least Identity Toolkit API (or use "Don't restrict" while testing).
 * 4. If App Check is enforced for Authentication, add a web debug token or turn enforcement off for dev.
 *
 * Analytics is optional; phone auth uses `src/lib/firebase-app.js` only.
 */
export const firebaseConfig = {
  apiKey: "AIzaSyAbp0B9Z2RnJ54KwK_O_hzCBjJnOSmpxe4",
  authDomain: "swaapevents.firebaseapp.com",
  projectId: "swaapevents",
  storageBucket: "swaapevents.firebasestorage.app",
  messagingSenderId: "272021569606",
  appId: "1:272021569606:web:6037efcc94900aa6f24a47",
  measurementId: "G-X68LG5L4LK",
};
