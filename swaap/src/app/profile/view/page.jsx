"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { HostChatPanel } from "@/components/HostChatPanel";
import { useAuth } from "@/context/AuthContext";
import { apiGetPublicProfile } from "@/lib/api";
import { dummyProfiles } from "@/lib/dummy-data";

function mapDummyToPublic(p) {
  if (!p) return null;
  return {
    id: p.id,
    name: p.name,
    title: p.headline,
    industry: p.industry,
    interest: "",
    professionArea: "",
    jobRole: "",
    companyName: "",
    lookingFor: Array.isArray(p.lookingFor) ? p.lookingFor.join(", ") : "",
    canOffer: Array.isArray(p.expertise) ? p.expertise.join(", ") : "",
    linkedinUrl: "",
    businessOwner: false,
    businessWebsite: "",
    socialInstagram: "",
    socialFacebook: "",
    socialLinkedin: "",
    socialSnapchat: "",
    socialTiktok: "",
    _demo: true,
  };
}

function ProfileViewInner() {
  const search = useSearchParams();
  const userId = search.get("id")?.trim() || "";
  const { firebaseUser, getIdToken, apiConfigured } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!userId) {
        setProfile(null);
        setLoading(false);
        return;
      }
      if (apiConfigured) {
        const token = await getIdToken();
        const p = await apiGetPublicProfile(userId, token);
        if (!cancelled) {
          setProfile(p);
          setLoading(false);
        }
        return;
      }
      const dummy = dummyProfiles.find((x) => x.id === userId);
      if (!cancelled) {
        setProfile(mapDummyToPublic(dummy));
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, apiConfigured, getIdToken]);

  if (!userId) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-xl font-semibold text-[var(--swaap-ink)]">Missing profile</h1>
        <p className="mt-2 text-neutral-600">Open a profile from Explore or use a valid link.</p>
        <Link href="/explore" className="mt-6 inline-block font-medium text-[var(--swaap-primary)] hover:underline">
          Go to Explore
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-neutral-500">Loading profile…</div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-xl font-semibold text-[var(--swaap-ink)]">Profile not found</h1>
        <Link href="/explore" className="mt-6 inline-block font-medium text-[var(--swaap-primary)] hover:underline">
          Back to Explore
        </Link>
      </div>
    );
  }

  const showMsg = Boolean(firebaseUser?.uid && profile.id && !profile._demo);

  return (
    <div className="relative mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="animate-orb absolute right-1/4 top-0 h-48 w-48 rounded-full bg-[color-mix(in_srgb,var(--swaap-sky)_40%,transparent)] blur-3xl" />
      </div>

      <Link
        href="/explore"
        className="inline-flex items-center gap-1 text-sm text-neutral-600 hover:text-[var(--swaap-primary)]"
      >
        ← Explore
      </Link>

      <div className="mt-8 overflow-hidden rounded-3xl border border-[color-mix(in_srgb,var(--swaap-primary)_12%,white)] bg-white shadow-lg shadow-[color-mix(in_srgb,var(--swaap-primary)_8%,transparent)]">
        <div className="bg-gradient-to-br from-[color-mix(in_srgb,var(--swaap-primary)_18%,white)] to-white px-8 pb-10 pt-10 sm:px-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex size-20 shrink-0 items-center justify-center rounded-2xl bg-[var(--swaap-primary)] text-2xl font-bold text-white shadow-md">
                {profile.name?.slice(0, 2).toUpperCase() || "?"}
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--swaap-ink)]">
                  {profile.name}
                </h1>
                {profile.title ? <p className="mt-1 text-neutral-600">{profile.title}</p> : null}
                {profile.companyName || profile.industry ? (
                  <p className="mt-2 text-sm text-neutral-500">
                    {[profile.jobRole, profile.companyName].filter(Boolean).join(" · ")}
                    {profile.industry ? ` · ${profile.industry}` : ""}
                  </p>
                ) : null}
              </div>
            </div>
            {profile._demo ? (
              <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-900">
                Demo profile (connect the API for live members)
              </span>
            ) : null}
          </div>
        </div>

        <div className="space-y-6 px-8 py-8 sm:px-10">
          {profile.interest ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Interest</p>
              <p className="mt-1 text-[var(--swaap-ink)]">{profile.interest}</p>
            </div>
          ) : null}
          {profile.lookingFor ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Looking for</p>
              <p className="mt-1 text-neutral-700">{profile.lookingFor}</p>
            </div>
          ) : null}
          {profile.canOffer ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Can offer</p>
              <p className="mt-1 text-neutral-700">{profile.canOffer}</p>
            </div>
          ) : null}
          {profile.linkedinUrl ? (
            <a
              href={profile.linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex text-sm font-medium text-[var(--swaap-primary)] hover:underline"
            >
              LinkedIn profile
            </a>
          ) : null}

          {showMsg ? (
            <div className="pt-2">
              <h2 className="text-sm font-semibold text-[var(--swaap-ink)]">Message</h2>
              <p className="mt-1 text-xs text-neutral-500">Conversation is private between you and {profile.name}.</p>
              <div className="mt-4">
                <HostChatPanel
                  myUid={firebaseUser.uid}
                  peerUid={profile.id}
                  peerLabel={profile.name}
                  title={`Message ${profile.name}`}
                />
              </div>
            </div>
          ) : profile._demo ? (
            <p className="text-sm text-neutral-500">Sign in with the API connected to message real members.</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function ProfileViewPage() {
  return (
    <Suspense
      fallback={<div className="flex min-h-[40vh] items-center justify-center text-neutral-500">Loading…</div>}
    >
      <ProfileViewInner />
    </Suspense>
  );
}
