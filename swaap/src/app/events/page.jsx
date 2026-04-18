"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiGetEvents } from "@/lib/api";
import { dummyEvents } from "@/lib/dummy-data";
import { useAuth } from "@/context/AuthContext";
import { ImagePlaceholder } from "@/components/ImagePlaceholder";
import { displayEventMeta, isRemoteImage } from "@/lib/event-display";
import { SWAAP_STREAMS } from "@/lib/constants";

function EventCard({ e }) {
  const m = displayEventMeta(e);
  const priceLabel = m.price === 0 ? "Free" : `£${m.price}`;
  return (
    <Link
      href={`/events/${m.id}`}
      className="group block overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/10"
    >
      <div className="overflow-hidden">
        {isRemoteImage(m.image) ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={m.image}
            alt=""
            className="aspect-[16/9] w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
        ) : (
          <ImagePlaceholder
            className="aspect-[16/9] w-full transition-transform duration-500 group-hover:scale-[1.02]"
            gradient="swaap"
            label="Event image"
          />
        )}
      </div>
      <div className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <span className="rounded-full border border-neutral-200 px-2.5 py-1 text-xs font-medium text-neutral-600">
            {m.type}
          </span>
          <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700">
            {priceLabel}
          </span>
        </div>
        <h2 className="mt-4 text-lg font-semibold text-[var(--swaap-ink)] group-hover:text-[var(--swaap-primary)]">
          {m.title}
        </h2>
        <p className="mt-2 line-clamp-2 text-sm text-neutral-600">{m.description}</p>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-neutral-500">
          <span>{m.date}</span>
          <span>·</span>
          <span>{m.time}</span>
          <span>·</span>
          <span>{m.location}</span>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
          {m.swaapStream ? (
            <span className="rounded-full bg-[color-mix(in_srgb,var(--swaap-primary)_14%,white)] px-2 py-0.5 font-medium text-[var(--swaap-primary)]">
              {m.swaapStream}
            </span>
          ) : null}
          <span>{m.industry}</span>
          {m.status ? (
            <>
              <span className="text-neutral-300">·</span>
              <span>{m.status}</span>
            </>
          ) : null}
          <span className="text-neutral-300">·</span>
          <span>{m.attendees} attending</span>
          {m.isRegistered ? (
            <span className="rounded-full bg-[color-mix(in_srgb,var(--swaap-primary)_18%,white)] px-2 py-0.5 font-medium text-[var(--swaap-ink)]">
              Requested
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

export default function EventsPage() {
  const { getIdToken, firebaseUser } = useAuth();
  const [filter, setFilter] = useState("all");
  const [industry, setIndustry] = useState("all");
  const [stream, setStream] = useState("all");
  const [list, setList] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const token = await getIdToken();
      const fromApi = await apiGetEvents(token);
      if (!cancelled) setList(fromApi);
    })();
    return () => {
      cancelled = true;
    };
  }, [getIdToken, firebaseUser]);

  const events = (list ?? dummyEvents).map((e) => displayEventMeta(e));

  const industries = useMemo(() => ["all", ...new Set(events.map((e) => e.industry))], [events]);

  const filtered = events.filter((e) => {
    const matchPrice =
      filter === "all" || (filter === "free" && e.price === 0) || (filter === "paid" && e.price > 0);
    const matchIndustry = industry === "all" || e.industry === industry;
    const matchStream = stream === "all" || e.swaapStream === stream;
    return matchPrice && matchIndustry && matchStream;
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--swaap-ink)]">Events</h1>
        <p className="mt-1 text-neutral-600">
          Explore SWAAP events. Listings load from your API when{" "}
          <code className="rounded bg-neutral-100 px-1 text-sm">NEXT_PUBLIC_API_URL</code> is set.
        </p>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <div className="flex rounded-xl border border-neutral-200 bg-white p-1 shadow-sm">
          {["all", "free", "paid"].map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-lg px-4 py-2 text-sm font-medium capitalize transition-colors ${
                filter === f ? "bg-[var(--swaap-ink)] text-white" : "text-neutral-600 hover:bg-neutral-100"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
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
        <select
          value={stream}
          onChange={(e) => setStream(e.target.value)}
          className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm text-neutral-700 shadow-sm focus:border-[var(--swaap-primary)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--swaap-primary)_25%,transparent)]"
        >
          <option value="all">All Swaap streams</option>
          {SWAAP_STREAMS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((e) => (
          <EventCard key={e.id} e={e} />
        ))}
      </div>
      {filtered.length === 0 && (
        <p className="py-12 text-center text-neutral-500">No events match your filters.</p>
      )}
    </div>
  );
}
