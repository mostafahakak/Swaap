"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { dummyEvents } from "@/lib/dummy-data";
import { apiGetEvent, apiGetPublicProfile, apiReserveEvent } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { HostChatPanel } from "@/components/HostChatPanel";
import { ImagePlaceholder } from "@/components/ImagePlaceholder";
import { displayEventMeta, isRemoteImage } from "@/lib/event-display";
import { formatEventPrice } from "@/lib/format-price";

export default function EventDetailClient({ id }) {
  const router = useRouter();
  const { getIdToken, userExists, firebaseUser } = useAuth();
  const [event, setEvent] = useState(null);
  const [hostProfile, setHostProfile] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [reserving, setReserving] = useState(false);
  const [registerError, setRegisterError] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [justReserved, setJustReserved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const token = await getIdToken();
      const fromApi = await apiGetEvent(id, token);
      if (cancelled) return;
      if (fromApi) {
        setEvent(displayEventMeta(fromApi));
        return;
      }
      const local = dummyEvents.find((e) => e.id === id);
      if (local) {
        setEvent(displayEventMeta({ ...local, isRegistered: false, reservationStatus: null }));
      } else {
        setLoadError(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, getIdToken, firebaseUser]);

  useEffect(() => {
    const hid = event?.hostUserId;
    if (!hid) {
      setHostProfile(null);
      return undefined;
    }
    let cancelled = false;
    (async () => {
      const token = await getIdToken();
      const p = await apiGetPublicProfile(hid, token);
      if (!cancelled) setHostProfile(p);
    })();
    return () => {
      cancelled = true;
    };
  }, [event?.hostUserId, getIdToken]);

  if (loadError && !event) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center">
        <h1 className="text-xl font-semibold text-black">Event not found</h1>
        <Link href="/events" className="mt-4 inline-block text-[var(--swaap-primary)] hover:underline">
          ← Back to events
        </Link>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center text-neutral-500">
        Loading event…
      </div>
    );
  }

  const meta = displayEventMeta(event);
  const priceLabel = formatEventPrice(meta.price);
  const longText = meta.longDescription || meta.description;
  const agenda = meta.agenda;
  const statusLabel = meta.status ? String(meta.status) : null;
  const reservationLabel = meta.reservationStatus
    ? String(meta.reservationStatus).replace(/_/g, " ")
    : null;

  const openReserve = async () => {
    setRegisterError("");
    const token = await getIdToken();
    if (!token) {
      router.push(`/login?next=/events/${id}`);
      return;
    }
    if (!userExists) {
      router.push("/onboarding/enter-info");
      return;
    }
    setConfirmOpen(true);
  };

  const confirmReserve = async () => {
    setRegisterError("");
    const token = await getIdToken();
    if (!token) return;
    setReserving(true);
    try {
      await apiReserveEvent(meta.id, token);
      setConfirmOpen(false);
      setJustReserved(true);
      setEvent((prev) =>
        prev
          ? {
              ...prev,
              isRegistered: true,
              reservationStatus: "pending_confirmation",
            }
          : prev
      );
    } catch (err) {
      setRegisterError(err.message || "Could not submit request");
    } finally {
      setReserving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <Link
        href="/events"
        className="inline-flex items-center gap-1 text-sm text-neutral-600 hover:text-[var(--swaap-primary)]"
      >
        ← Events
      </Link>

      <div className="mt-8 overflow-hidden rounded-2xl border border-neutral-200 shadow-sm">
        {isRemoteImage(meta.image) ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={meta.image}
            alt=""
            className="aspect-[21/9] w-full object-cover sm:aspect-[2.4/1]"
          />
        ) : (
          <ImagePlaceholder
            className="aspect-[21/9] w-full sm:aspect-[2.4/1]"
            gradient="swaap"
            label="Event image"
          />
        )}
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        <span className="rounded-full border border-neutral-200 px-2.5 py-1 text-xs font-medium text-neutral-600">
          {meta.type}
        </span>
        <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700">
          {meta.category ?? meta.industry}
        </span>
        <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700">
          {priceLabel}
        </span>
        {meta.swaapStream ? (
          <span className="rounded-full bg-[color-mix(in_srgb,var(--swaap-primary)_14%,white)] px-2.5 py-1 text-xs font-semibold text-[var(--swaap-primary)]">
            {meta.swaapStream}
          </span>
        ) : null}
        {statusLabel ? (
          <span className="rounded-full bg-[color-mix(in_srgb,var(--swaap-sky)_40%,white)] px-2.5 py-1 text-xs font-medium text-[var(--swaap-ink)]">
            {statusLabel}
          </span>
        ) : null}
        {meta.isRegistered ? (
          <span className="rounded-full bg-[color-mix(in_srgb,var(--swaap-primary)_18%,white)] px-2.5 py-1 text-xs font-medium text-[var(--swaap-ink)]">
            Request submitted{reservationLabel ? ` · ${reservationLabel}` : ""}
          </span>
        ) : null}
      </div>

      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[var(--swaap-ink)]">{meta.title}</h1>
      <p className="mt-4 text-neutral-600">{longText}</p>

      {agenda?.length ? (
        <div className="mt-8 rounded-xl border border-neutral-200 bg-neutral-50/80 p-5">
          <p className="text-sm font-semibold text-black">Agenda</p>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-neutral-700">
            {agenda.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </div>
      ) : null}

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-medium text-neutral-500">Starts</p>
          <p className="mt-1 font-medium text-black">
            {meta.startDate ?? meta.date} · {meta.startTime ?? meta.time}
          </p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-medium text-neutral-500">Ends</p>
          <p className="mt-1 font-medium text-black">
            {meta.endDate ?? meta.date} · {meta.endTime ?? meta.time}
          </p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm sm:col-span-2">
          <p className="text-sm font-medium text-neutral-500">Location</p>
          <p className="mt-1 font-medium text-black">{meta.location}</p>
        </div>
      </div>

      <div className="mt-6 text-sm text-neutral-500">{meta.attendees} attending</div>

      {meta.hostUserId ? (
        <div className="mt-10 rounded-2xl border border-[color-mix(in_srgb,var(--swaap-primary)_12%,white)] bg-[color-mix(in_srgb,var(--swaap-sky)_12%,white)] p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-[var(--swaap-ink)]">Event host</h2>
          <p className="mt-1 text-sm text-neutral-600">
            {hostProfile?.name ? (
              <>
                <span className="font-medium text-[var(--swaap-ink)]">{hostProfile.name}</span>
                {hostProfile.title ? ` · ${hostProfile.title}` : ""}
              </>
            ) : (
              "Loading host…"
            )}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href={`/profile/view/?id=${encodeURIComponent(meta.hostUserId)}`}
              className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-800 shadow-sm transition hover:bg-neutral-50"
            >
              View host profile
            </Link>
          </div>
          <div className="mt-6">
            <p className="text-sm font-medium text-[var(--swaap-ink)]">Message the host</p>
            <p className="mt-1 text-xs text-neutral-500">Uses in-app chat (Firebase Realtime Database).</p>
            <div className="mt-3">
                <HostChatPanel myUid={firebaseUser?.uid}
                peerUid={meta.hostUserId}
                peerLabel={hostProfile?.name || "the host"}
                title="Message the host"
                eventId={meta.id}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-10 rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/80 p-6 text-sm text-neutral-600">
          <p className="font-medium text-[var(--swaap-ink)]">Host messaging</p>
          <p className="mt-2">
            A host will be listed here once an organiser assigns one in the admin tools. You can still request a
            spot below.
          </p>
        </div>
      )}

      {justReserved ? (
        <div className="mt-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900">
          Request submitted. Your signup is <strong>pending confirmation</strong>—check status anytime in{" "}
          <Link href="/profile" className="font-medium underline">
            My profile
          </Link>
          .
        </div>
      ) : null}

      {registerError ? <p className="mt-4 text-sm text-red-600">{registerError}</p> : null}

      <div className="mt-10 flex flex-wrap gap-4">
        <button
          type="button"
          onClick={openReserve}
          disabled={reserving || meta.isRegistered}
          className="rounded-xl bg-[var(--swaap-primary)] px-6 py-3 text-base font-medium text-white shadow-lg shadow-black/10 transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {meta.isRegistered
            ? "Request already submitted"
            : reserving
              ? "Submitting…"
              : meta.price === 0
                ? "Request a free spot"
                : `Request a spot (${formatEventPrice(meta.price)})`}
        </button>
        <Link
          href="/events"
          className="rounded-xl border border-neutral-300 px-6 py-3 text-base font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
        >
          Back to events
        </Link>
      </div>

      {confirmOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
          <div className="max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-[var(--swaap-ink)]">Confirm your request</h2>
            <p className="mt-2 text-sm text-neutral-600">
              We’ll send your name, phone, and email to the SWAAP team. Your status will be{" "}
              <strong>pending confirmation</strong> until an admin approves it.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmReserve}
                disabled={reserving}
                className="rounded-xl bg-[var(--swaap-primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-95 disabled:opacity-50"
              >
                {reserving ? "Submitting…" : "Yes, submit request"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
