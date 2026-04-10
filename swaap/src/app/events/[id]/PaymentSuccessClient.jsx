"use client";

import Link from "next/link";
import { dummyEvents } from "@/lib/dummy-data";

export default function PaymentSuccessClient({ id }) {
  const event = id ? dummyEvents.find((e) => e.id === id) : null;

  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-black text-white">✓</div>
      <h1 className="mt-6 text-2xl font-semibold text-black">Payment successful</h1>
      <p className="mt-3 text-neutral-600">
        You're registered for {event ? <strong>{event.title}</strong> : "this event"}. We'll send a confirmation and
        reminder before it starts.
      </p>
      <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link
          href="/events"
          className="rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
        >
          Browse more events
        </Link>
        <Link
          href="/profile"
          className="rounded-lg border border-neutral-300 px-5 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
        >
          My profile
        </Link>
      </div>
    </div>
  );
}
