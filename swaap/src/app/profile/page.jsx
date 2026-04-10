"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiGetProfile } from "@/lib/api";
import { dummyUserProfile } from "@/lib/dummy-data";

export default function ProfilePage() {
  const router = useRouter();
  const { firebaseUser, profile: ctxProfile, loading, getIdToken, apiConfigured } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

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
        setLoadingProfile(false);
        return;
      }
      const token = await getIdToken();
      if (!apiConfigured || !token) {
        if (!cancelled) {
          setProfile(null);
          setLoadingProfile(false);
        }
        return;
      }
      try {
        const p = await apiGetProfile(token);
        if (!cancelled) setProfile(p);
      } catch {
        if (!cancelled) setProfile(null);
      } finally {
        if (!cancelled) setLoadingProfile(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loading, firebaseUser, ctxProfile, getIdToken, apiConfigured, router]);

  const display = profile
    ? {
        name: profile.name,
        headline: profile.title?.trim() || profile.interest,
        industry: profile.professionArea?.trim() || null,
        region: "—",
        bio: profile.interest,
        hearAbout: profile.hearAbout?.trim() || null,
        email: profile.email,
        linkedinUrl: profile.linkedinUrl?.trim() || null,
        phone: profile.phone,
        verified: true,
        connectionCount: dummyUserProfile.connectionCount,
        eventsAttended: dummyUserProfile.eventsAttended,
      }
    : {
        name: dummyUserProfile.name,
        headline: dummyUserProfile.headline,
        industry: dummyUserProfile.industry,
        region: dummyUserProfile.region,
        bio: dummyUserProfile.bio,
        hearAbout: null,
        email: dummyUserProfile.email,
        linkedinUrl: null,
        phone: null,
        verified: dummyUserProfile.verified,
        connectionCount: dummyUserProfile.connectionCount,
        eventsAttended: dummyUserProfile.eventsAttended,
      };

  if (loading || loadingProfile) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-neutral-500">Loading…</div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-black">My profile</h1>
          <p className="mt-1 text-neutral-600">
            {profile
              ? "Synced from your SWAAP account."
              : "Showing sample data until your API profile is available."}
          </p>
        </div>
        {!profile ? (
          <Link
            href="/onboarding/enter-info"
            className="shrink-0 rounded-xl border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-medium text-violet-900 transition-colors hover:bg-violet-100"
          >
            Complete profile
          </Link>
        ) : null}
      </div>

      <div className="mt-10 space-y-8">
        <div className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-gradient-to-r from-violet-50/80 to-white p-4">
          <span className="flex size-10 items-center justify-center rounded-full bg-zinc-900 text-white">✓</span>
          <div>
            <p className="font-medium text-black">Verified access</p>
            <p className="text-sm text-neutral-600">
              Phone sign-in via Firebase. Complete your backend profile for full matchmaking later.
            </p>
          </div>
        </div>

        <div className="space-y-6 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-black">{display.name}</h2>
            {display.verified ? (
              <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-800">
                Verified
              </span>
            ) : null}
          </div>
          <p className="text-neutral-600">{display.headline}</p>
          <p className="text-neutral-600">
            <span className="font-medium text-neutral-700">Interest:</span> {display.bio}
          </p>
          {display.hearAbout ? (
            <p className="text-neutral-600">
              <span className="font-medium text-neutral-700">Heard about SWAAP:</span> {display.hearAbout}
            </p>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-neutral-500">Email</p>
              <p className="text-black">{display.email}</p>
            </div>
            {display.industry ? (
              <div>
                <p className="text-sm font-medium text-neutral-500">Industry / area</p>
                <p className="text-black">{display.industry}</p>
              </div>
            ) : null}
            {display.linkedinUrl ? (
              <div className="sm:col-span-2">
                <p className="text-sm font-medium text-neutral-500">LinkedIn</p>
                <a
                  href={display.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-violet-700 hover:underline"
                >
                  {display.linkedinUrl}
                </a>
              </div>
            ) : null}
            {display.phone ? (
              <div>
                <p className="text-sm font-medium text-neutral-500">Phone</p>
                <p className="text-black">{display.phone}</p>
              </div>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-4 border-t border-neutral-200 pt-6">
            <div>
              <p className="text-2xl font-semibold text-black">{display.connectionCount}</p>
              <p className="text-sm text-neutral-500">Connections</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-black">{display.eventsAttended}</p>
              <p className="text-sm text-neutral-500">Events attended</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10 flex flex-wrap gap-4">
        <Link
          href="/discover"
          className="rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
        >
          Discover professionals
        </Link>
        <Link
          href="/events"
          className="rounded-xl border border-neutral-300 px-5 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
        >
          Browse events
        </Link>
      </div>
    </div>
  );
}
