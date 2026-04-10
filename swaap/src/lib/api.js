import { getApiBase } from "./constants";

async function parseJson(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { error: text || "Invalid response" };
  }
}

export async function apiAuthVerify(idToken) {
  const base = getApiBase();
  if (!base) {
    return {
      uid: null,
      phone: null,
      userExists: true,
      profile: null,
      _demoNoBackend: true,
    };
  }
  const res = await fetch(`${base}/api/auth/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  const data = await parseJson(res);
  if (!res.ok) throw new Error(data.error || "Verification failed");
  return data;
}

export async function apiGetProfile(idToken) {
  const base = getApiBase();
  if (!base) return null;
  const res = await fetch(`${base}/api/users/me`, {
    headers: { Authorization: `Bearer ${idToken}` },
  });
  if (res.status === 404) return null;
  const data = await parseJson(res);
  if (!res.ok) throw new Error(data.error || "Failed to load profile");
  return data.profile;
}

export async function apiCreateProfile(idToken, body) {
  const base = getApiBase();
  if (!base) throw new Error("NEXT_PUBLIC_API_URL is not set");
  const res = await fetch(`${base}/api/users/profile`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(body),
  });
  const data = await parseJson(res);
  if (!res.ok) throw new Error(data.error || "Could not save profile");
  return data.profile;
}

export async function apiGetEvents(idToken) {
  const base = getApiBase();
  if (!base) return null;
  const headers = {};
  if (idToken) headers.Authorization = `Bearer ${idToken}`;
  const res = await fetch(`${base}/api/events`, { headers });
  const data = await parseJson(res);
  if (!res.ok) return null;
  return data.events ?? null;
}

export async function apiGetEvent(id, idToken) {
  const base = getApiBase();
  if (!base) return null;
  const headers = {};
  if (idToken) headers.Authorization = `Bearer ${idToken}`;
  const res = await fetch(`${base}/api/events/${encodeURIComponent(id)}`, { headers });
  const data = await parseJson(res);
  if (!res.ok) return null;
  return data.event ?? null;
}

export async function apiRegisterEvent(id, idToken) {
  const base = getApiBase();
  if (!base) throw new Error("NEXT_PUBLIC_API_URL is not set");
  const res = await fetch(`${base}/api/events/${encodeURIComponent(id)}/register`, {
    method: "POST",
    headers: { Authorization: `Bearer ${idToken}` },
  });
  const data = await parseJson(res);
  if (!res.ok) throw new Error(data.error || "Registration failed");
  return data;
}
