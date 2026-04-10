"use client";

import { useState } from "react";
import { dummyProfiles, industries, regions } from "@/lib/dummy-data";

function ProfileCard({ p, onConnect, connected }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 transition-shadow hover:shadow-md">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-lg font-semibold text-neutral-600">
            {p.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-semibold text-black">{p.name}</h2>
              {p.verified && (
                <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600">
                  Verified
                </span>
              )}
            </div>
            <p className="mt-0.5 truncate text-sm text-neutral-600">{p.headline}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onConnect}
          disabled={connected}
          className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            connected
              ? "cursor-default border border-neutral-200 bg-neutral-50 text-neutral-500"
              : "bg-black text-white hover:bg-neutral-800"
          }`}
        >
          {connected ? "Connected" : "Connect"}
        </button>
      </div>
      <p className="mt-4 text-sm text-neutral-500">{p.industry} · {p.region}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {p.expertise.slice(0, 3).map((e) => (
          <span key={e} className="rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-xs text-neutral-700">
            {e}
          </span>
        ))}
      </div>
      <div className="mt-3">
        <p className="text-xs font-medium text-neutral-500">Looking for</p>
        <p className="mt-1 text-sm text-neutral-600">{p.lookingFor.join(", ")}</p>
      </div>
      <p className="mt-3 text-xs text-neutral-400">{p.connectionCount} connections</p>
    </div>
  );
}

export default function DiscoverPage() {
  const [industry, setIndustry] = useState("all");
  const [region, setRegion] = useState("all");
  const [connected, setConnected] = useState(new Set());
  const [showAiOnly, setShowAiOnly] = useState(false);

  const industryOpts = ["all", ...industries];
  const regionOpts = ["all", ...regions];

  const filtered = dummyProfiles.filter((p) => {
    const matchIndustry = industry === "all" || p.industry === industry;
    const matchRegion = region === "all" || p.region === region;
    return matchIndustry && matchRegion;
  });

  const aiRecommended = showAiOnly ? filtered.slice(0, 3) : filtered;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div>
        <h1 className="text-2xl font-semibold text-black">Discover</h1>
        <p className="mt-1 text-neutral-600">
          AI-powered matchmaking. Find professionals who align with your goals and swap expertise.
        </p>
      </div>

      <div className="mt-8 rounded-2xl border border-neutral-200 bg-neutral-50 p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-black px-2.5 py-1 text-xs font-medium text-white">AI</span>
          <span className="text-sm font-medium text-black">Matchmaking</span>
        </div>
        <p className="mt-2 text-sm text-neutral-600">
          Recommendations are based on your profile, expertise, and what you're looking for. The more
          complete your profile, the better the matches.
        </p>
        <label className="mt-4 flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={showAiOnly}
            onChange={(e) => setShowAiOnly(e.target.checked)}
            className="rounded border-neutral-300 text-black focus:ring-black"
          />
          <span className="text-sm text-neutral-700">Show only top AI-recommended matches</span>
        </label>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <select
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm text-neutral-700 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
        >
          {industryOpts.map((i) => (
            <option key={i} value={i}>{i === "all" ? "All industries" : i}</option>
          ))}
        </select>
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm text-neutral-700 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
        >
          {regionOpts.map((r) => (
            <option key={r} value={r}>{r === "all" ? "All regions" : r}</option>
          ))}
        </select>
      </div>

      <div className="mt-10">
        <h2 className="text-lg font-semibold text-black">
          {showAiOnly ? "Top AI matches for you" : "Professionals to connect with"}
        </h2>
        <p className="mt-1 text-sm text-neutral-500">
          {aiRecommended.length} {aiRecommended.length === 1 ? "profile" : "profiles"}
        </p>
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {aiRecommended.map((p) => (
          <ProfileCard
            key={p.id}
            p={p}
            onConnect={() => setConnected((prev) => new Set(prev).add(p.id))}
            connected={connected.has(p.id)}
          />
        ))}
      </div>

      {aiRecommended.length === 0 && (
        <p className="py-12 text-center text-neutral-500">No profiles match your filters.</p>
      )}
    </div>
  );
}
