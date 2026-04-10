"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/context/AuthContext";
import { apiCreateProfile } from "@/lib/api";
import { HEAR_ABOUT_OPTIONS, HEAR_ABOUT_OTHER, INTEREST_OPTIONS } from "@/lib/constants";

export default function EnterInfoPage() {
  const router = useRouter();
  const { firebaseUser, userExists, loading, refreshSession, getIdToken, apiConfigured } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    interest: INTEREST_OPTIONS[0],
    hearAbout: HEAR_ABOUT_OPTIONS[0],
    hearAboutOther: "",
  });

  const showOtherHearAbout = form.hearAbout === HEAR_ABOUT_OTHER;

  const hearAboutPayload = useMemo(() => {
    if (form.hearAbout === HEAR_ABOUT_OTHER) {
      const detail = form.hearAboutOther.trim();
      return detail.length ? `Other: ${detail}` : "";
    }
    return form.hearAbout;
  }, [form.hearAbout, form.hearAboutOther]);

  useEffect(() => {
    if (loading) return;
    if (!firebaseUser) router.replace("/login");
    else if (userExists) router.replace("/");
  }, [loading, firebaseUser, userExists, router]);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!apiConfigured) {
      setError("Set NEXT_PUBLIC_API_URL in .env.local to save your profile.");
      return;
    }
    if (showOtherHearAbout && !form.hearAboutOther.trim()) {
      setError("Please tell us how you heard about SWAAP.");
      return;
    }
    setBusy(true);
    try {
      const token = await getIdToken();
      if (!token) throw new Error("Not signed in");
      await apiCreateProfile(token, {
        name: form.name,
        email: form.email,
        interest: form.interest,
        hearAbout: hearAboutPayload,
      });
      const u = firebaseUser;
      if (u) await refreshSession(u);
      router.replace("/");
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  if (loading || !firebaseUser) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-neutral-500">Loading…</div>
    );
  }

  return (
    <div className="relative mx-auto max-w-lg px-4 py-12 sm:px-6">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="animate-orb absolute left-1/4 top-0 h-56 w-56 -translate-x-1/2 rounded-full bg-fuchsia-500/15 blur-3xl" />
      </div>

      <Logo variant="compact" className="mb-8" />
      <h1 className="text-2xl font-semibold tracking-tight text-black">Complete your signup</h1>
      <p className="mt-2 text-neutral-600">
        A few details so we can tailor events and introductions on SWAAP.
      </p>

      <form
        onSubmit={submit}
        className="mt-10 space-y-5 rounded-2xl border border-neutral-200/80 bg-white/80 p-6 shadow-xl shadow-violet-500/5 backdrop-blur-sm animate-fade-up"
      >
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-neutral-700">
            Name
          </label>
          <input
            id="name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="mt-1.5 w-full rounded-xl border border-neutral-200 px-4 py-2.5 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
            required
            autoComplete="name"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-neutral-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="mt-1.5 w-full rounded-xl border border-neutral-200 px-4 py-2.5 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
            required
            autoComplete="email"
          />
        </div>
        <div>
          <label htmlFor="interest" className="block text-sm font-medium text-neutral-700">
            Interest
          </label>
          <select
            id="interest"
            value={form.interest}
            onChange={(e) => setForm({ ...form, interest: e.target.value })}
            className="mt-1.5 w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
          >
            {INTEREST_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="hearAbout" className="block text-sm font-medium text-neutral-700">
            How did you hear about SWAAP?
          </label>
          <select
            id="hearAbout"
            value={form.hearAbout}
            onChange={(e) => setForm({ ...form, hearAbout: e.target.value })}
            className="mt-1.5 w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
          >
            {HEAR_ABOUT_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
          {showOtherHearAbout ? (
            <input
              type="text"
              value={form.hearAboutOther}
              onChange={(e) => setForm({ ...form, hearAboutOther: e.target.value })}
              placeholder="Tell us more…"
              className="mt-3 w-full rounded-xl border border-neutral-200 px-4 py-2.5 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
              aria-label="How did you hear about SWAAP — details"
            />
          ) : null}
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 py-3 font-medium text-white shadow-lg shadow-violet-500/25 transition hover:brightness-105 disabled:opacity-60"
        >
          {busy ? "Saving…" : "Submit & go to home"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-neutral-500">
        <Link href="/" className="text-violet-700 hover:underline">
          Back to home
        </Link>
      </p>
    </div>
  );
}
