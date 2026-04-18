"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiGetUserDirectory } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { dummyProfiles } from "@/lib/dummy-data";

function ProfileCard({ p }) {
  const subtitle = [p.jobRole, p.companyName].filter(Boolean).join(" · ");
  const looking =
    typeof p.lookingFor === "string" ? p.lookingFor : (p.lookingFor || []).join(", ");
  const offer =
    typeof p.canOffer === "string" && p.canOffer
      ? p.canOffer
      : Array.isArray(p.expertise)
        ? p.expertise.join(", ")
        : "";

  return (
    <Link
      href={`/profile/view/?id=${encodeURIComponent(p.id)}`}
      className="group block rounded-2xl border border-[color-mix(in_srgb,var(--swaap-primary)_10%,white)] bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[color-mix(in_srgb,var(--swaap-primary)_22%,white)] hover:shadow-lg hover:shadow-[color-mix(in_srgb,var(--swaap-primary)_10%,transparent)]"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--swaap-primary)_16%,white)] text-lg font-semibold text-[var(--swaap-primary)]">
            {p.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h2 className="font-semibold text-[var(--swaap-ink)] group-hover:text-[var(--swaap-primary)]">
              {p.name}
            </h2>
            {p.title || subtitle ? (
              <p className="mt-0.5 truncate text-sm text-neutral-600">{p.title || subtitle}</p>
            ) : null}
          </div>
        </div>
        <span className="shrink-0 rounded-full bg-[color-mix(in_srgb,var(--swaap-accent)_40%,white)] px-3 py-1 text-xs font-medium text-[var(--swaap-ink)]">
          View profile
        </span>
      </div>
      <p className="mt-4 text-sm text-neutral-500">
        {p.industry}
        {p.interest ? ` · ${p.interest}` : ""}
      </p>
      {offer ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {String(offer)
            .split(",")
            .slice(0, 3)
            .map((e) => e.trim())
            .filter(Boolean)
            .map((e) => (
              <span
                key={e}
                className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-xs text-neutral-700"
              >
                {e}
              </span>
            ))}
        </div>
      ) : null}
      {looking ? (
        <div className="mt-3">
          <p className="text-xs font-medium text-neutral-500">Looking for</p>
          <p className="mt-1 line-clamp-2 text-sm text-neutral-600">{looking}</p>
        </div>
      ) : null}
    </Link>
  );
}

export default function ExplorePage() {
  const { apiConfigured } = useAuth();
  const [industry, setIndustry] = useState("all");
  const [list, setList] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!apiConfigured) {
        if (!cancelled) setList(dummyProfiles.map((d) => ({ ...d, title: d.headline })));
        return;
      }
      const users = await apiGetUserDirectory();
      if (!cancelled) setList(users && users.length ? users : []);
    })();
    return () => {
      cancelled = true;
    };
  }, [apiConfigured]);

  const rows = list ?? [];
  const industries = ["all", ...new Set(rows.map((p) => p.industry).filter(Boolean))];

  const filtered = rows.filter((p) => industry === "all" || p.industry === industry);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--swaap-ink)]">Explore</h1>
        <p className="mt-2 text-neutral-600">
          Browse SWAAP members and open a profile to connect. Listings come from your API when{" "}
          <code className="rounded bg-neutral-100 px-1 text-sm">NEXT_PUBLIC_API_URL</code> is set.
        </p>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <select
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm text-neutral-700 shadow-sm focus:border-[var(--swaap-primary)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--swaap-primary)_25%,transparent)]"
        >
          {industries.map((i) => (
            <option key={i} value={i}>
              {i === "all" ? "All industries" : i}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-10">
        <h2 className="text-lg font-semibold text-[var(--swaap-ink)]">Members</h2>
        <p className="mt-1 text-sm text-neutral-500">
          {filtered.length} {filtered.length === 1 ? "profile" : "profiles"}
        </p>
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((p) => (
          <ProfileCard key={p.id} p={p} />
        ))}
      </div>

      {apiConfigured && list && list.length === 0 ? (
        <p className="py-12 text-center text-neutral-500">No public profiles yet. Complete signup to appear here.</p>
      ) : null}

      {!apiConfigured && filtered.length === 0 ? (
        <p className="py-12 text-center text-neutral-500">No profiles to show.</p>
      ) : null}

      {filtered.length === 0 && list && list.length > 0 ? (
        <p className="py-12 text-center text-neutral-500">No profiles match your filters.</p>
      ) : null}
    </div>
  );
}
