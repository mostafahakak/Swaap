"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  apiAdminCreateEvent,
  apiAdminListReservations,
  apiAdminListUsers,
} from "@/lib/api";

export default function AdminPage() {
  const router = useRouter();
  const { firebaseUser, isAdmin, loading, getIdToken, apiConfigured } = useAuth();
  const [users, setUsers] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [tab, setTab] = useState("users");
  const [loadErr, setLoadErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [formMsg, setFormMsg] = useState("");
  const [eventForm, setEventForm] = useState({
    title: "",
    description: "",
    image: "",
    type: "In-person",
    category: "Technology",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    status: "published",
    price: 0,
    location: "",
    longDescription: "",
    attendeesHint: 0,
  });

  useEffect(() => {
    if (loading) return;
    if (!firebaseUser) {
      router.replace("/login?next=/admin");
      return;
    }
    if (!isAdmin) {
      router.replace("/");
    }
  }, [loading, firebaseUser, isAdmin, router]);

  useEffect(() => {
    if (!firebaseUser || !isAdmin || !apiConfigured) return;
    let cancelled = false;
    (async () => {
      setLoadErr("");
      try {
        const token = await getIdToken();
        if (!token) return;
        const [u, r] = await Promise.all([
          apiAdminListUsers(token),
          apiAdminListReservations(token),
        ]);
        if (!cancelled) {
          setUsers(u);
          setReservations(r);
        }
      } catch (e) {
        if (!cancelled) setLoadErr(e.message || "Could not load admin data");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [firebaseUser, isAdmin, apiConfigured, getIdToken]);

  const refreshAdmin = async () => {
    const token = await getIdToken();
    if (!token) return;
    const [u, r] = await Promise.all([
      apiAdminListUsers(token),
      apiAdminListReservations(token),
    ]);
    setUsers(u);
    setReservations(r);
  };

  const submitEvent = async (e) => {
    e.preventDefault();
    setFormMsg("");
    setBusy(true);
    try {
      const token = await getIdToken();
      await apiAdminCreateEvent(token, {
        title: eventForm.title,
        description: eventForm.description,
        image: eventForm.image,
        type: eventForm.type,
        category: eventForm.category,
        startDate: eventForm.startDate,
        startTime: eventForm.startTime,
        endDate: eventForm.endDate,
        endTime: eventForm.endTime,
        status: eventForm.status,
        price: Number(eventForm.price),
        location: eventForm.location,
        longDescription: eventForm.longDescription || eventForm.description,
        agenda: [],
        attendeesHint: Number(eventForm.attendeesHint),
      });
      setFormMsg("Event created.");
      setEventForm((f) => ({
        ...f,
        title: "",
        description: "",
        image: "",
        longDescription: "",
      }));
    } catch (err) {
      setFormMsg(err.message || "Failed");
    } finally {
      setBusy(false);
    }
  };

  if (loading || !firebaseUser || !isAdmin) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-neutral-500">Loading…</div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--swaap-ink)]">Admin panel</h1>
          <p className="mt-1 text-neutral-600">Registered users, reservation requests, and new events.</p>
        </div>
        <Link
          href="/"
          className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
        >
          ← Home
        </Link>
      </div>

      {!apiConfigured ? (
        <p className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Set <code className="rounded bg-amber-100/80 px-1">NEXT_PUBLIC_API_URL</code> to use admin APIs.
        </p>
      ) : null}

      {loadErr ? (
        <p className="mt-6 text-sm text-red-600">{loadErr}</p>
      ) : (
        <div className="mt-6 flex gap-2 rounded-xl border border-neutral-200 bg-white p-1 shadow-sm">
          {[
            { id: "users", label: "Users" },
            { id: "reservations", label: "Reservation requests" },
            { id: "events", label: "Add event" },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                tab === t.id
                  ? "bg-[var(--swaap-primary)] text-white"
                  : "text-neutral-600 hover:bg-neutral-100"
              }`}
            >
              {t.label}
            </button>
          ))}
          <button
            type="button"
            onClick={refreshAdmin}
            className="ml-auto rounded-lg px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-100"
          >
            Refresh lists
          </button>
        </div>
      )}

      {tab === "users" && (
        <div className="mt-8 overflow-x-auto rounded-2xl border border-neutral-200 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50/80">
              <tr>
                <th className="px-4 py-3 font-medium text-neutral-700">Name</th>
                <th className="px-4 py-3 font-medium text-neutral-700">Email</th>
                <th className="px-4 py-3 font-medium text-neutral-700">Phone</th>
                <th className="px-4 py-3 font-medium text-neutral-700">Type</th>
                <th className="px-4 py-3 font-medium text-neutral-700">Interest</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-neutral-100 last:border-0">
                  <td className="px-4 py-3 text-black">{u.name}</td>
                  <td className="px-4 py-3 text-neutral-700">{u.email}</td>
                  <td className="px-4 py-3 text-neutral-700">{u.phone || "—"}</td>
                  <td className="px-4 py-3 text-neutral-700">{u.userType}</td>
                  <td className="px-4 py-3 text-neutral-700">{u.interest}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 ? (
            <p className="px-4 py-8 text-center text-neutral-500">No users yet.</p>
          ) : null}
        </div>
      )}

      {tab === "reservations" && (
        <div className="mt-8 overflow-x-auto rounded-2xl border border-neutral-200 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50/80">
              <tr>
                <th className="px-4 py-3 font-medium text-neutral-700">Event</th>
                <th className="px-4 py-3 font-medium text-neutral-700">Name</th>
                <th className="px-4 py-3 font-medium text-neutral-700">Phone</th>
                <th className="px-4 py-3 font-medium text-neutral-700">Email</th>
                <th className="px-4 py-3 font-medium text-neutral-700">Status</th>
                <th className="px-4 py-3 font-medium text-neutral-700">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((r) => (
                <tr key={r.id} className="border-b border-neutral-100 last:border-0">
                  <td className="px-4 py-3 text-black">{r.eventTitle}</td>
                  <td className="px-4 py-3 text-neutral-700">{r.name}</td>
                  <td className="px-4 py-3 text-neutral-700">{r.phone}</td>
                  <td className="px-4 py-3 text-neutral-700">{r.email}</td>
                  <td className="px-4 py-3 text-neutral-700">{r.status}</td>
                  <td className="px-4 py-3 text-neutral-700">{r.createdAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {reservations.length === 0 ? (
            <p className="px-4 py-8 text-center text-neutral-500">No reservation requests yet.</p>
          ) : null}
        </div>
      )}

      {tab === "events" && (
        <form
          onSubmit={submitEvent}
          className="mt-8 grid gap-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:grid-cols-2"
        >
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-neutral-700">Title</label>
            <input
              className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2"
              value={eventForm.title}
              onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
              required
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-neutral-700">Short description</label>
            <textarea
              className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2"
              rows={3}
              value={eventForm.description}
              onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
              required
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-neutral-700">Image URL</label>
            <input
              className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2"
              value={eventForm.image}
              onChange={(e) => setEventForm({ ...eventForm, image: e.target.value })}
              placeholder="https://…"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700">Type</label>
            <input
              className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2"
              value={eventForm.type}
              onChange={(e) => setEventForm({ ...eventForm, type: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700">Category</label>
            <input
              className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2"
              value={eventForm.category}
              onChange={(e) => setEventForm({ ...eventForm, category: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700">Start date</label>
            <input
              type="date"
              className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2"
              value={eventForm.startDate}
              onChange={(e) => setEventForm({ ...eventForm, startDate: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700">Start time</label>
            <input
              className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2"
              value={eventForm.startTime}
              onChange={(e) => setEventForm({ ...eventForm, startTime: e.target.value })}
              placeholder="18:00"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700">End date</label>
            <input
              type="date"
              className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2"
              value={eventForm.endDate}
              onChange={(e) => setEventForm({ ...eventForm, endDate: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700">End time</label>
            <input
              className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2"
              value={eventForm.endTime}
              onChange={(e) => setEventForm({ ...eventForm, endTime: e.target.value })}
              placeholder="20:00"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700">Status</label>
            <input
              className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2"
              value={eventForm.status}
              onChange={(e) => setEventForm({ ...eventForm, status: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700">Price (£)</label>
            <input
              type="number"
              min={0}
              step={1}
              className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2"
              value={eventForm.price}
              onChange={(e) => setEventForm({ ...eventForm, price: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-neutral-700">Location</label>
            <input
              className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2"
              value={eventForm.location}
              onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700">Attendees hint</label>
            <input
              type="number"
              min={0}
              className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2"
              value={eventForm.attendeesHint}
              onChange={(e) => setEventForm({ ...eventForm, attendeesHint: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-neutral-700">Long description (optional)</label>
            <textarea
              className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2"
              rows={4}
              value={eventForm.longDescription}
              onChange={(e) => setEventForm({ ...eventForm, longDescription: e.target.value })}
            />
          </div>
          {formMsg ? <p className="sm:col-span-2 text-sm text-neutral-700">{formMsg}</p> : null}
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={busy}
              className="rounded-xl bg-[var(--swaap-primary)] px-6 py-3 text-sm font-medium text-white hover:opacity-95 disabled:opacity-50"
            >
              {busy ? "Saving…" : "Create event"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
