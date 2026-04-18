"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { dummyEvents } from "@/lib/dummy-data";
import { formatEventPrice } from "@/lib/format-price";

export default function CheckoutClient({ id }) {
  const router = useRouter();
  const event = dummyEvents.find((e) => e.id === id);
  const [processing, setProcessing] = useState(false);

  if (!event) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center">
        <h1 className="text-xl font-semibold text-black">Event not found</h1>
        <Link href="/events" className="mt-4 inline-block text-black hover:underline">← Back to events</Link>
      </div>
    );
  }

  const handlePay = (e) => {
    e.preventDefault();
    setProcessing(true);
    setTimeout(() => {
      router.push(`/events/${id}/payment-success`);
    }, 1200);
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <Link href={`/events/${id}`} className="inline-flex items-center gap-1 text-sm text-neutral-600 hover:text-black">
        ← Back to event
      </Link>

      <h1 className="mt-8 text-2xl font-semibold text-black">Complete payment</h1>
      <p className="mt-2 text-neutral-600">
        Secure checkout for <strong>{event.title}</strong> — {formatEventPrice(event.price)}
      </p>

      <div className="mt-10 rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8">
        <div className="mb-6 flex items-center justify-between border-b border-neutral-200 pb-4">
          <span className="text-neutral-600">Event</span>
          <span className="font-medium text-black">{formatEventPrice(event.price)}</span>
        </div>

        <form onSubmit={handlePay} className="space-y-5">
          <div>
            <label htmlFor="card" className="block text-sm font-medium text-neutral-700">Card number</label>
            <input
              id="card"
              type="text"
              placeholder="4242 4242 4242 4242"
              className="mt-1.5 w-full rounded-lg border border-neutral-300 px-4 py-2.5 font-mono focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              required
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="exp" className="block text-sm font-medium text-neutral-700">Expiry</label>
              <input
                id="exp"
                type="text"
                placeholder="MM/YY"
                className="mt-1.5 w-full rounded-lg border border-neutral-300 px-4 py-2.5 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                required
              />
            </div>
            <div>
              <label htmlFor="cvc" className="block text-sm font-medium text-neutral-700">CVC</label>
              <input
                id="cvc"
                type="text"
                placeholder="123"
                className="mt-1.5 w-full rounded-lg border border-neutral-300 px-4 py-2.5 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                required
              />
            </div>
          </div>
          <p className="text-xs text-neutral-500">Dummy checkout. Use any values to simulate payment.</p>
          <button
            type="submit"
            disabled={processing}
            className="w-full rounded-lg bg-black py-3 text-base font-medium text-white transition-colors hover:bg-neutral-800 disabled:opacity-60"
          >
            {processing ? "Processing…" : `Pay ${formatEventPrice(event.price)}`}
          </button>
        </form>
      </div>
    </div>
  );
}
