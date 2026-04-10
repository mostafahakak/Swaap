"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { dummyEvents } from "@/lib/dummy-data";
import { apiGetEvent, apiRegisterEvent } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { ImagePlaceholder } from "@/components/ImagePlaceholder";

export default function EventDetailClient({ id }) {
  const router = useRouter();
  const { getIdToken, userExists, firebaseUser } = useAuth();
  const [event, setEvent] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [registerError, setRegisterError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const token = await getIdToken();
      const fromApi = await apiGetEvent(id, token);
      if (cancelled) return;
      if (fromApi) {
        setEvent(fromApi);
        return;
      }
      const local = dummyEvents.find((e) => e.id === id);
      if (local) {
        setEvent({ ...local, isRegistered: false });
      } else {
        setLoadError(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, getIdToken, firebaseUser]);

  if (loadError && !event) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center">
        <h1 className="text-xl font-semibold text-black">Event not found</h1>
        <Link href="/events" className="mt-4 inline-block text-violet-700 hover:underline">
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

  const priceLabel = event.price === 0 ? "Free" : `£${event.price}`;
  const longText = event.longDescription || event.description;
  const agenda = event.agenda;

  const handleRegister = async () => {
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
    if (event.price > 0) {
      router.push(`/events/${event.id}/checkout`);
      return;
    }
    setRegistering(true);
    try {
      await apiRegisterEvent(event.id, token);
      setEvent((prev) => ({ ...prev, isRegistered: true }));
      router.push(`/events/${event.id}/registered`);
    } catch (err) {
      setRegisterError(err.message || "Could not register");
    } finally {
      setRegistering(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <Link href="/events" className="inline-flex items-center gap-1 text-sm text-neutral-600 hover:text-violet-700">
        ← Events
      </Link>

      <div className="mt-8 overflow-hidden rounded-2xl border border-neutral-200 shadow-sm">
        <ImagePlaceholder
          className="aspect-[21/9] w-full sm:aspect-[2.4/1]"
          gradient="violet"
          label="Event hero — placeholder"
        />
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        <span className="rounded-full border border-neutral-200 px-2.5 py-1 text-xs font-medium text-neutral-600">
          {event.type}
        </span>
        <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700">
          {event.industry}
        </span>
        <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700">
          {priceLabel}
        </span>
        {event.isRegistered ? (
          <span className="rounded-full bg-violet-100 px-2.5 py-1 text-xs font-medium text-violet-800">
            You’re registered
          </span>
        ) : null}
      </div>

      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-black">{event.title}</h1>
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
          <p className="text-sm font-medium text-neutral-500">Date & time</p>
          <p className="mt-1 font-medium text-black">
            {event.date} · {event.time}
          </p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-medium text-neutral-500">Location</p>
          <p className="mt-1 font-medium text-black">{event.location}</p>
        </div>
      </div>

      <div className="mt-6 text-sm text-neutral-500">{event.attendees} attending</div>

      {registerError ? <p className="mt-4 text-sm text-red-600">{registerError}</p> : null}

      <div className="mt-10 flex flex-wrap gap-4">
        <button
          type="button"
          onClick={handleRegister}
          disabled={registering || event.isRegistered}
          className="rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-3 text-base font-medium text-white shadow-lg shadow-violet-500/20 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {event.isRegistered
            ? "Already registered"
            : registering
              ? "Registering…"
              : event.price === 0
                ? "Register free"
                : `Pay £${event.price} & register`}
        </button>
        <Link
          href="/events"
          className="rounded-xl border border-neutral-300 px-6 py-3 text-base font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
        >
          Back to events
        </Link>
      </div>
    </div>
  );
}
