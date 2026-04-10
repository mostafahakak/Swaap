"use client";

import { useState } from "react";
import Link from "next/link";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-black text-white">✓</div>
        <h1 className="mt-6 text-2xl font-semibold text-black">Message sent</h1>
        <p className="mt-3 text-neutral-600">
          Thanks for reaching out. We’ll get back to you as soon as we can.
        </p>
        <Link
          href="/"
          className="mt-8 inline-block rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
        >
          Back to home
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-semibold text-black">Contact us</h1>
      <p className="mt-4 text-neutral-600">
        Have a question or feedback? Send us a message and we’ll respond as soon as possible.
      </p>
      <form onSubmit={handleSubmit} className="mt-10 space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-neutral-700">
            Name
          </label>
          <input
            id="name"
            type="text"
            required
            className="mt-1.5 w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-black focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
            placeholder="Your name"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-neutral-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            className="mt-1.5 w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-black focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-neutral-700">
            Message
          </label>
          <textarea
            id="message"
            rows={5}
            required
            className="mt-1.5 w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-black focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
            placeholder="Your message..."
          />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-black px-6 py-3 text-base font-medium text-white transition-colors hover:bg-neutral-800"
        >
          Send message
        </button>
      </form>
    </div>
  );
}
