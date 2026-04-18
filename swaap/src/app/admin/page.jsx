"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  apiAdminCreateEvent,
  apiAdminEventConversation,
  apiAdminEventReservations,
  apiAdminListEvents,
  apiAdminListReservations,
  apiAdminListUsers,
} from "@/lib/api";
import { SWAAP_STREAMS } from "@/lib/constants";
import { formatEventPrice } from "@/lib/format-price";

export default function AdminPage() {
  const router = useRouter();
  const { firebaseUser, isAdmin, loading, getIdToken, apiConfigured } = useAuth();
  const [users, setUsers] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [events, setEvents] = useState([]);
  const [tab, setTab] = useState("users");
  const [userSearch, setUserSearch] = useState("");
  const [loadErr, setLoadErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [formMsg, setFormMsg] = useState("");

  const [selectedEventId, setSelectedEventId] = useState("");
  const [eventReservations, setEventReservations] = useState([]);
  const [loadingSignups, setLoadingSignups] = useState(false);

  const [chatOpen, setChatOpen] = useState(false);
  const [chatCtx, setChatCtx] = useState({ eventId: "", attendeeId: "", name: "" });
  const [chatMessages, setChatMessages] = useState([]);
  const [chatNotice, setChatNotice] = useState("");
  const [loadingChat, setLoadingChat] = useState(false);

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
    swaapStream: SWAAP_STREAMS[0],
    hostUserId: "",
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

  const refreshAdmin = async () => {
    const token = await getIdToken();
    if (!token) return;
    const [u, r, ev] = await Promise.all([
      apiAdminListUsers(token),
      apiAdminListReservations(token),
      apiAdminListEvents(token).catch(() => []),
    ]);
    setUsers(u);
    setReservations(r);
    setEvents(ev);
  };

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
        let ev = [];
        try {
          ev = await apiAdminListEvents(token);
        } catch {
          ev = [];
        }
        if (!cancelled) {
          setUsers(u);
          setReservations(r);
          setEvents(ev);
        }
      } catch (e) {
        if (!cancelled) setLoadErr(e.message || "Could not load admin data");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [firebaseUser, isAdmin, apiConfigured, getIdToken]);

  useEffect(() => {
    if (tab !== "signups" || !selectedEventId || !apiConfigured || !firebaseUser || !isAdmin) return;
    let cancelled = false;
    (async () => {
      setLoadingSignups(true);
      try {
        const token = await getIdToken();
        if (!token) return;
        const list = await apiAdminEventReservations(token, selectedEventId);
        if (!cancelled) setEventReservations(list);
      } catch {
        if (!cancelled) setEventReservations([]);
      } finally {
        if (!cancelled) setLoadingSignups(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tab, selectedEventId, apiConfigured, firebaseUser, isAdmin, getIdToken]);

  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => {
      const name = (u.name || "").toLowerCase();
      const phone = (u.phone || "").toLowerCase().replace(/\s/g, "");
      const qPhone = q.replace(/\s/g, "");
      return name.includes(q) || phone.includes(qPhone);
    });
  }, [users, userSearch]);

  const openChat = async (eventId, attendeeId, name) => {
    setChatCtx({ eventId, attendeeId, name });
    setChatOpen(true);
    setChatMessages([]);
    setChatNotice("");
    setLoadingChat(true);
    try {
      const token = await getIdToken();
      if (!token) return;
      const { messages, notice } = await apiAdminEventConversation(token, eventId, attendeeId);
      setChatMessages(messages);
      setChatNotice(notice || "");
    } catch (e) {
      setChatNotice(e.message || "Could not load messages");
    } finally {
      setLoadingChat(false);
    }
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
        swaapStream: eventForm.swaapStream,
        hostUserId: eventForm.hostUserId.trim() || undefined,
      });
      setFormMsg("Event created.");
      setEventForm((f) => ({
        ...f,
        title: "",
        description: "",
        image: "",
        longDescription: "",
        hostUserId: "",
      }));
      await refreshAdmin();
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

  const selectedEvent = events.find((ev) => ev.id === selectedEventId);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--swaap-ink)]">Admin panel</h1>
          <p className="mt-1 text-neutral-600">
            Organiser accounts (+966 58 127 7377 and +201282160015) receive Admin after login. Prices are shown in{" "}
            <strong>SAR</strong>.
          </p>
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
        <div className="mt-6 flex flex-wrap gap-2 rounded-xl border border-neutral-200 bg-white p-1 shadow-sm">
          {[
            { id: "users", label: "Users" },
            { id: "signups", label: "Event signups & chats" },
            { id: "reservations", label: "All requests" },
            { id: "events", label: "Create event" },
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
            Refresh data
          </button>
        </div>
      )}

      {tab === "users" && (
        <div className="mt-8 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-sm font-medium text-neutral-700">Search by name or phone</label>
            <input
              type="search"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="Name or phone number…"
              className="min-w-[240px] flex-1 rounded-xl border border-neutral-200 px-4 py-2 text-sm focus:border-[var(--swaap-primary)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--swaap-primary)_22%,transparent)]"
            />
            <span className="text-sm text-neutral-500">
              {filteredUsers.length} of {users.length} users
            </span>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white shadow-sm">
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
                {filteredUsers.map((u) => (
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
            {filteredUsers.length === 0 ? (
              <p className="px-4 py-8 text-center text-neutral-500">No users match this search.</p>
            ) : null}
          </div>
        </div>
      )}

      {tab === "signups" && (
        <div className="mt-8 space-y-6">
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <label className="block text-sm font-medium text-neutral-700">Select event</label>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="mt-2 w-full max-w-xl rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm focus:border-[var(--swaap-primary)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--swaap-primary)_22%,transparent)]"
            >
              <option value="">Choose an event…</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.title} · {ev.startDate || ev.date} · {formatEventPrice(ev.price)}
                  {ev.hostUserId ? "" : " (no host)"}
                </option>
              ))}
            </select>
            {selectedEvent ? (
              <p className="mt-3 text-xs text-neutral-500">
                Stream: <strong>{selectedEvent.swaapStream}</strong>
                {selectedEvent.hostUserId ? (
                  <>
                    {" "}
                    · Host uid: <code className="rounded bg-neutral-100 px-1">{selectedEvent.hostUserId}</code>
                  </>
                ) : (
                  <span className="text-amber-700"> · Assign a host on the next event you create so guest chats are tied to this event.</span>
                )}
              </p>
            ) : null}
          </div>

          {!selectedEventId ? (
            <p className="text-sm text-neutral-500">Pick an event to load signups.</p>
          ) : loadingSignups ? (
            <p className="text-sm text-neutral-500">Loading signups…</p>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white shadow-sm">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-neutral-200 bg-neutral-50/80">
                  <tr>
                    <th className="px-4 py-3 font-medium text-neutral-700">Name</th>
                    <th className="px-4 py-3 font-medium text-neutral-700">Phone</th>
                    <th className="px-4 py-3 font-medium text-neutral-700">Email</th>
                    <th className="px-4 py-3 font-medium text-neutral-700">Status</th>
                    <th className="px-4 py-3 font-medium text-neutral-700">Submitted</th>
                    <th className="px-4 py-3 font-medium text-neutral-700">Host ↔ guest chat</th>
                  </tr>
                </thead>
                <tbody>
                  {eventReservations.map((r) => (
                    <tr key={r.id} className="border-b border-neutral-100 last:border-0">
                      <td className="px-4 py-3 text-black">{r.name}</td>
                      <td className="px-4 py-3 text-neutral-700">{r.phone}</td>
                      <td className="px-4 py-3 text-neutral-700">{r.email}</td>
                      <td className="px-4 py-3 text-neutral-700">{r.status}</td>
                      <td className="px-4 py-3 text-neutral-700">{r.createdAt}</td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => openChat(selectedEventId, r.userId, r.name)}
                          className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-[var(--swaap-primary)] hover:bg-neutral-50"
                        >
                          View chat
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {eventReservations.length === 0 ? (
                <p className="px-4 py-8 text-center text-neutral-500">No signups for this event yet.</p>
              ) : null}
            </div>
          )}
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
            <label className="block text-sm font-medium text-neutral-700">Swaap stream</label>
            <select
              className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2"
              value={eventForm.swaapStream}
              onChange={(e) => setEventForm({ ...eventForm, swaapStream: e.target.value })}
            >
              {SWAAP_STREAMS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700">Host Firebase uid</label>
            <input
              className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 font-mono text-sm"
              value={eventForm.hostUserId}
              onChange={(e) => setEventForm({ ...eventForm, hostUserId: e.target.value })}
              placeholder="Optional — required for per-event guest messaging"
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
            <label className="block text-sm font-medium text-neutral-700">Price (SAR)</label>
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

      {chatOpen ? (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/45 p-4">
          <div className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl bg-white shadow-xl">
            <div className="flex items-start justify-between border-b border-neutral-100 px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold text-[var(--swaap-ink)]">Chat with {chatCtx.name}</h2>
                <p className="mt-1 text-xs text-neutral-500">
                  Event-scoped thread between this guest and the event host (Firebase RTDB). Backend reads via Admin
                  SDK.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setChatOpen(false)}
                className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            {chatNotice ? (
              <p className="border-b border-amber-100 bg-amber-50 px-5 py-2 text-xs text-amber-900">{chatNotice}</p>
            ) : null}
            <div className="flex-1 space-y-2 overflow-y-auto px-5 py-4">
              {loadingChat ? (
                <p className="text-sm text-neutral-500">Loading messages…</p>
              ) : chatMessages.length === 0 ? (
                <p className="text-sm text-neutral-500">No messages in this thread yet.</p>
              ) : (
                chatMessages.map((m) => (
                  <div
                    key={m.id}
                    className={`rounded-xl px-3 py-2 text-sm ${
                      m.senderId === chatCtx.attendeeId
                        ? "ml-8 bg-[color-mix(in_srgb,var(--swaap-sky)_35%,white)] text-neutral-900"
                        : "mr-8 border border-neutral-200 bg-neutral-50 text-neutral-900"
                    }`}
                  >
                    <span className="text-xs text-neutral-500">
                      {m.senderId === chatCtx.attendeeId ? "Guest" : "Host"}
                    </span>
                    <p className="mt-1 whitespace-pre-wrap">{m.text}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
