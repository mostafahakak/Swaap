"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiGetMyEventReservations, apiGetProfile, apiPatchProfile } from "@/lib/api";
import { INTEREST_OPTIONS, HEAR_ABOUT_OPTIONS, HEAR_ABOUT_OTHER } from "@/lib/constants";

function emptyFormFromProfile(p) {
  if (!p) return null;
  const interest =
    p.interest && INTEREST_OPTIONS.includes(p.interest) ? p.interest : INTEREST_OPTIONS[0];
  return {
    name: p.name ?? "",
    email: p.email ?? "",
    interest,
    hearAbout: p.hearAbout ?? HEAR_ABOUT_OPTIONS[0],
    hearAboutOther: "",
    professionArea: p.professionArea ?? "",
    title: p.title ?? "",
    linkedinUrl: p.linkedinUrl ?? "",
    jobRole: p.jobRole ?? "",
    companyName: p.companyName ?? "",
    industry: p.industry ?? "",
    lookingFor: p.lookingFor ?? "",
    canOffer: p.canOffer ?? "",
    businessOwner: Boolean(p.businessOwner),
    businessWebsite: p.businessWebsite ?? "",
    socialInstagram: p.socialInstagram ?? "",
    socialFacebook: p.socialFacebook ?? "",
    socialLinkedin: p.socialLinkedin ?? "",
    socialSnapchat: p.socialSnapchat ?? "",
    socialTiktok: p.socialTiktok ?? "",
  };
}

export default function ProfilePage() {
  const router = useRouter();
  const { firebaseUser, profile: ctxProfile, loading, getIdToken, apiConfigured, refreshSession } =
    useAuth();
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [form, setForm] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!firebaseUser) {
      router.replace("/login");
      return;
    }
    let cancelled = false;
    (async () => {
      if (ctxProfile) {
        setProfile(ctxProfile);
        setForm(emptyFormFromProfile(ctxProfile));
        setLoadingProfile(false);
        return;
      }
      const token = await getIdToken();
      if (!apiConfigured || !token) {
        if (!cancelled) {
          setProfile(null);
          setForm(null);
          setLoadingProfile(false);
        }
        return;
      }
      try {
        const p = await apiGetProfile(token);
        if (!cancelled) {
          setProfile(p);
          setForm(emptyFormFromProfile(p));
        }
      } catch {
        if (!cancelled) {
          setProfile(null);
          setForm(null);
        }
      } finally {
        if (!cancelled) setLoadingProfile(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loading, firebaseUser, ctxProfile, getIdToken, apiConfigured, router]);

  useEffect(() => {
    if (!firebaseUser || !profile || !apiConfigured) return;
    let cancelled = false;
    (async () => {
      try {
        const token = await getIdToken();
        if (!token) return;
        const r = await apiGetMyEventReservations(token);
        if (!cancelled) setReservations(r);
      } catch {
        if (!cancelled) setReservations([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [firebaseUser, profile, apiConfigured, getIdToken]);

  const showOtherHearAbout = form?.hearAbout === HEAR_ABOUT_OTHER;

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setMsg("");
    if (!apiConfigured || !form) {
      setErr("API is not configured.");
      return;
    }
    if (showOtherHearAbout && !form.hearAboutOther?.trim()) {
      setErr("Please add how you heard about SWAAP.");
      return;
    }
    const hearAboutPayload =
      form.hearAbout === HEAR_ABOUT_OTHER
        ? `Other: ${form.hearAboutOther.trim()}`
        : form.hearAbout;

    setBusy(true);
    try {
      const token = await getIdToken();
      if (!token) throw new Error("Not signed in");
      const updated = await apiPatchProfile(token, {
        name: form.name,
        email: form.email,
        interest: form.interest,
        hearAbout: hearAboutPayload,
        professionArea: form.professionArea,
        title: form.title,
        linkedinUrl: form.linkedinUrl,
        jobRole: form.jobRole,
        companyName: form.companyName,
        industry: form.industry,
        lookingFor: form.lookingFor,
        canOffer: form.canOffer,
        businessOwner: form.businessOwner,
        businessWebsite: form.businessWebsite,
        socialInstagram: form.socialInstagram,
        socialFacebook: form.socialFacebook,
        socialLinkedin: form.socialLinkedin,
        socialSnapchat: form.socialSnapchat,
        socialTiktok: form.socialTiktok,
      });
      setProfile(updated);
      setForm(emptyFormFromProfile(updated));
      if (firebaseUser) await refreshSession(firebaseUser);
      setMsg("Profile updated.");
    } catch (er) {
      setErr(er.message || "Could not save");
    } finally {
      setBusy(false);
    }
  };

  if (loading || loadingProfile) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-neutral-500">Loading…</div>
    );
  }

  if (!profile || !form) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-xl font-semibold text-[var(--swaap-ink)]">Complete your profile first</h1>
        <p className="mt-2 text-neutral-600">We need a few details before you can edit your full profile.</p>
        <Link
          href="/onboarding/enter-info"
          className="mt-6 inline-block rounded-xl bg-[var(--swaap-primary)] px-5 py-2.5 text-sm font-medium text-white"
        >
          Continue signup
        </Link>
      </div>
    );
  }

  const inputCls =
    "mt-1.5 w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-black focus:border-[var(--swaap-primary)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--swaap-primary)_25%,transparent)]";

  const initials = (form.name || profile.name || "?").trim().slice(0, 2).toUpperCase();

  return (
    <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="animate-orb absolute left-1/3 top-0 h-64 w-64 -translate-x-1/2 rounded-full bg-[color-mix(in_srgb,var(--swaap-sky)_38%,transparent)] blur-3xl" />
      </div>

      <div className="overflow-hidden rounded-3xl border border-[color-mix(in_srgb,var(--swaap-primary)_12%,white)] bg-gradient-to-br from-[color-mix(in_srgb,var(--swaap-primary)_12%,white)] via-white to-[color-mix(in_srgb,var(--swaap-sky)_14%,white)] shadow-lg shadow-[color-mix(in_srgb,var(--swaap-primary)_8%,transparent)]">
        <div className="flex flex-col gap-6 px-6 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-10 sm:py-10">
          <div className="flex items-center gap-4">
            <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-[var(--swaap-primary)] text-xl font-bold text-white shadow-md sm:size-20 sm:text-2xl">
              {initials}
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--swaap-ink)] sm:text-3xl">
                My profile
              </h1>
              <p className="mt-1 max-w-xl text-sm text-neutral-600 sm:text-base">
                Keep your SWAAP presence current—members see you on Explore with the details you share here.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 sm:justify-end">
            <Link
              href="/explore"
              className="rounded-xl border border-neutral-200/80 bg-white/90 px-4 py-2.5 text-sm font-semibold text-[var(--swaap-ink)] shadow-sm backdrop-blur-sm transition hover:bg-white"
            >
              Explore members
            </Link>
            <Link
              href="/events"
              className="rounded-xl bg-[var(--swaap-primary)] px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:opacity-95"
            >
              Browse events
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[280px_1fr] lg:items-start">
        <aside className="space-y-4 lg:sticky lg:top-24">
          <div className="rounded-2xl border border-neutral-200 bg-white/95 p-5 shadow-sm backdrop-blur-sm">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Snapshot</h2>
            <p className="mt-3 font-medium text-[var(--swaap-ink)]">{form.name}</p>
            <p className="mt-1 text-sm text-neutral-600">{form.email}</p>
            <div className="mt-4 space-y-2 border-t border-neutral-100 pt-4 text-sm">
              <p>
                <span className="text-neutral-500">Interest · </span>
                <span className="text-neutral-800">{form.interest}</span>
              </p>
              {form.industry ? (
                <p>
                  <span className="text-neutral-500">Industry · </span>
                  <span className="text-neutral-800">{form.industry}</span>
                </p>
              ) : null}
            </div>
          </div>
          <div className="rounded-2xl border border-dashed border-[color-mix(in_srgb,var(--swaap-primary)_20%,white)] bg-[color-mix(in_srgb,var(--swaap-sky)_10%,white)] p-5 text-sm text-neutral-600">
            <p className="font-medium text-[var(--swaap-ink)]">Share your profile</p>
            <p className="mt-2 leading-relaxed">
              Others can open your public page from Explore. Your phone number is never shown there.
            </p>
            <Link
              href={`/profile/view/?id=${encodeURIComponent(profile.id)}`}
              className="mt-3 inline-flex text-sm font-semibold text-[var(--swaap-primary)] hover:underline"
            >
              Preview public profile
            </Link>
          </div>
        </aside>

        <div className="min-w-0 space-y-8">
          <form onSubmit={submit} className="space-y-8">
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-lg font-semibold text-[var(--swaap-ink)]">Account & signup</h2>
              <p className="mt-1 text-sm text-neutral-600">Basics from your signup and how you heard about SWAAP.</p>
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-neutral-700">Name</label>
              <input
                className={inputCls}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-neutral-700">Email</label>
              <input
                type="email"
                className={inputCls}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-neutral-700">Phone</label>
                  <input className={`${inputCls} bg-neutral-50`} value={profile.phone || "—"} readOnly />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-neutral-700">Interest</label>
                  <select
                    className={`${inputCls} bg-white`}
                    value={form.interest}
                    onChange={(e) => setForm({ ...form, interest: e.target.value })}
                  >
                    {INTEREST_OPTIONS.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-neutral-700">How did you hear about SWAAP?</label>
                  <select
                    className={`${inputCls} bg-white`}
                    value={form.hearAbout}
                    onChange={(e) => setForm({ ...form, hearAbout: e.target.value })}
                  >
                    {HEAR_ABOUT_OPTIONS.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                  {showOtherHearAbout ? (
                    <input
                      className={`${inputCls} mt-3`}
                      value={form.hearAboutOther}
                      onChange={(e) => setForm({ ...form, hearAboutOther: e.target.value })}
                      placeholder="Tell us more…"
                    />
                  ) : null}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-lg font-semibold text-[var(--swaap-ink)]">Professional</h2>
              <p className="mt-1 text-sm text-neutral-600">How you work and what you want from the community.</p>
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-neutral-700">Job role</label>
              <input
                className={inputCls}
                value={form.jobRole}
                onChange={(e) => setForm({ ...form, jobRole: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700">Company name</label>
              <input
                className={inputCls}
                value={form.companyName}
                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-neutral-700">Industry</label>
              <input
                className={inputCls}
                value={form.industry}
                onChange={(e) => setForm({ ...form, industry: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-neutral-700">What you are looking for</label>
              <textarea
                className={inputCls}
                rows={3}
                value={form.lookingFor}
                onChange={(e) => setForm({ ...form, lookingFor: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-neutral-700">What you can offer</label>
              <textarea
                className={inputCls}
                rows={3}
                value={form.canOffer}
                onChange={(e) => setForm({ ...form, canOffer: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2 flex items-center gap-3">
              <input
                id="biz"
                type="checkbox"
                checked={form.businessOwner}
                onChange={(e) => setForm({ ...form, businessOwner: e.target.checked })}
                className="size-4 rounded border-neutral-300"
              />
              <label htmlFor="biz" className="text-sm font-medium text-neutral-700">
                I am a business owner (show business profile links)
              </label>
            </div>
            {form.businessOwner ? (
              <>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-neutral-700">Business website</label>
                  <input
                    className={inputCls}
                    value={form.businessWebsite}
                    onChange={(e) => setForm({ ...form, businessWebsite: e.target.value })}
                    placeholder="https://"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700">Instagram</label>
                  <input
                    className={inputCls}
                    value={form.socialInstagram}
                    onChange={(e) => setForm({ ...form, socialInstagram: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700">Facebook</label>
                  <input
                    className={inputCls}
                    value={form.socialFacebook}
                    onChange={(e) => setForm({ ...form, socialFacebook: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700">LinkedIn</label>
                  <input
                    className={inputCls}
                    value={form.socialLinkedin}
                    onChange={(e) => setForm({ ...form, socialLinkedin: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700">Snapchat</label>
                  <input
                    className={inputCls}
                    value={form.socialSnapchat}
                    onChange={(e) => setForm({ ...form, socialSnapchat: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700">TikTok</label>
                  <input
                    className={inputCls}
                    value={form.socialTiktok}
                    onChange={(e) => setForm({ ...form, socialTiktok: e.target.value })}
                  />
                </div>
              </>
            ) : null}
            <div>
              <label className="block text-sm font-medium text-neutral-700">Professional title (legacy)</label>
              <input
                className={inputCls}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700">Profession area (legacy)</label>
              <input
                className={inputCls}
                value={form.professionArea}
                onChange={(e) => setForm({ ...form, professionArea: e.target.value })}
              />
            </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-neutral-700">LinkedIn URL (legacy)</label>
                  <input
                    className={inputCls}
                    value={form.linkedinUrl}
                    onChange={(e) => setForm({ ...form, linkedinUrl: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {err ? <p className="text-sm text-red-600">{err}</p> : null}
            {msg ? <p className="text-sm text-green-700">{msg}</p> : null}
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl bg-[var(--swaap-primary)] px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[color-mix(in_srgb,var(--swaap-primary)_25%,transparent)] transition hover:opacity-95 disabled:opacity-50 sm:w-auto"
            >
              {busy ? "Saving…" : "Save changes"}
            </button>
          </form>

          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-lg font-semibold text-[var(--swaap-ink)]">My event sign-ups</h2>
        <p className="mt-1 text-sm text-neutral-600">Status updates appear here after you request a spot.</p>
        {reservations.length === 0 ? (
          <p className="mt-6 text-neutral-500">No event requests yet.</p>
        ) : (
          <ul className="mt-6 divide-y divide-neutral-100">
            {reservations.map((r) => (
              <li key={r.id} className="py-4 first:pt-0">
                <p className="font-medium text-black">{r.eventTitle}</p>
                <p className="mt-1 text-sm text-neutral-600">
                  {r.eventStartDate} · {r.eventStartTime}
                </p>
                <p className="mt-2 text-sm">
                  <span className="font-medium text-neutral-700">Status:</span>{" "}
                  <span className="rounded-full bg-[color-mix(in_srgb,var(--swaap-accent)_35%,white)] px-2 py-0.5 text-xs font-medium text-[var(--swaap-ink)]">
                    {r.status.replace(/_/g, " ")}
                  </span>
                </p>
              </li>
            ))}
          </ul>
        )}
          </div>
        </div>
      </div>
    </div>
  );
}
