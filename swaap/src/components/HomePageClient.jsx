"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { ImagePlaceholder } from "@/components/ImagePlaceholder";
import { apiGetEvents } from "@/lib/api";
import { dummyEvents } from "@/lib/dummy-data";
import { useAuth } from "@/context/AuthContext";
import { displayEventMeta, isRemoteImage } from "@/lib/event-display";
import { formatEventPrice } from "@/lib/format-price";

function NextEventCard({ e, delay }) {
  const m = displayEventMeta(e);
  const priceLabel = formatEventPrice(m.price);
  return (
    <Link
      href={`/events/${m.id}`}
      className="group card-lift block overflow-hidden rounded-2xl border border-[color-mix(in_srgb,var(--swaap-primary)_14%,white)] bg-white shadow-sm animate-fade-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="overflow-hidden">
        {isRemoteImage(m.image) ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={m.image}
            alt=""
            className="aspect-[16/10] w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
        ) : (
          <ImagePlaceholder
            className="aspect-[16/10] w-full transition-transform duration-500 group-hover:scale-[1.02]"
            gradient="swaap"
            label="Event cover"
          />
        )}
      </div>
      <div className="p-5">
        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--swaap-primary)]">
          {m.type}
        </span>
        <h3 className="font-display mt-2 line-clamp-2 text-lg font-semibold text-[var(--swaap-ink)] group-hover:text-[var(--swaap-primary)]">
          {m.title}
        </h3>
        <p className="mt-2 text-sm text-neutral-600">
          {m.date} · {m.time} · {m.location}
        </p>
        <span className="mt-3 inline-block rounded-full bg-[color-mix(in_srgb,var(--swaap-accent)_55%,white)] px-2.5 py-1 text-xs font-semibold text-[var(--swaap-ink)]">
          {priceLabel}
        </span>
      </div>
    </Link>
  );
}

const KEYWORDS = ["Create", "Connect", "Collaborate"];

export default function HomePageClient() {
  const { getIdToken, firebaseUser } = useAuth();
  const [events, setEvents] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const token = await getIdToken();
      const fromApi = await apiGetEvents(token);
      if (!cancelled) setEvents(fromApi);
    })();
    return () => {
      cancelled = true;
    };
  }, [getIdToken, firebaseUser]);

  const nextEvents = useMemo(() => {
    const list = events ?? dummyEvents;
    return [...list].slice(0, 3);
  }, [events]);

  const steps = [
    {
      step: "1",
      title: "Create your profile",
      desc: "Phone-verified identity and your goals—so every introduction is intentional.",
    },
    {
      step: "2",
      title: "Connect at events",
      desc: "In-person, online, and hybrid sessions aligned with your industry and intent.",
    },
    {
      step: "3",
      title: "Collaborate & swap value",
      desc: "Trade expertise, hire, find roles, or build partnerships that last.",
    },
  ];

  return (
    <div className="overflow-hidden">
      {/* Hero — primary palette + guide line */}
      <section className="relative overflow-hidden border-b border-white/10 text-white" style={{ background: "var(--swaap-hero-gradient)" }}>
        <div className="pointer-events-none absolute inset-0">
          <div className="animate-mesh absolute inset-0 opacity-95" />
          <div className="hero-mesh absolute inset-0 opacity-80" />
        </div>
        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-12">
            <div className="animate-fade-up">
              <Logo variant="full" tone="dark" className="mb-8" />
              <p className="font-display text-sm font-semibold uppercase tracking-[0.25em] text-[var(--swaap-sky)]">
                {KEYWORDS.join(" · ")}
              </p>
              <h1 className="font-display mt-5 text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.35rem]">
                Meet the right people.
                <span className="mt-2 block text-[var(--swaap-accent)]">Swap value, not just cards.</span>
              </h1>
              <p className="mt-4 max-w-xl border-l-2 border-[var(--swaap-accent)] pl-4 text-lg font-medium italic text-white/95">
                Greatness awaits those who take the risk of pursuing it.
              </p>
              <p className="mt-6 max-w-xl text-lg text-white/85">
                SWAAP is where professionals create connections, connect with purpose, and collaborate through
                curated meetups and swaps.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                {KEYWORDS.map((word) => (
                  <span
                    key={word}
                    className="rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-sm font-semibold backdrop-blur-sm"
                  >
                    {word}
                  </span>
                ))}
                <span className="rounded-full border border-[var(--swaap-lime)]/50 bg-[var(--swaap-lime)]/20 px-4 py-1.5 text-sm font-semibold text-[var(--swaap-lime)]">
                  Easy
                </span>
              </div>
              <div className="mt-10 flex flex-wrap gap-4">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-xl bg-[var(--swaap-accent)] px-6 py-3 text-base font-semibold text-[var(--swaap-ink)] shadow-lg shadow-black/15 transition hover:brightness-105"
                >
                  Get started
                </Link>
                <Link
                  href="/events"
                  className="inline-flex items-center justify-center rounded-xl border-2 border-white/40 bg-white/10 px-6 py-3 text-base font-semibold text-white backdrop-blur transition hover:bg-white/18"
                >
                  Browse events
                </Link>
              </div>
            </div>
            <div className="relative animate-fade-up animation-delay-200">
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl border border-white/20 shadow-2xl shadow-black/25">
                <ImagePlaceholder className="h-full w-full" gradient="swaap" label="Hero visual" />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--swaap-deep)]/90 via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 flex flex-wrap gap-2">
                  {["Live meetups", "Hybrid", "Global"].map((t) => (
                    <span
                      key={t}
                      className="rounded-full border border-white/25 bg-black/25 px-3 py-1 text-xs font-semibold text-white backdrop-blur"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <div className="animate-float absolute -right-4 -top-4 hidden h-24 w-24 rounded-2xl border border-[var(--swaap-sky)]/40 bg-[var(--swaap-sky)]/15 backdrop-blur-md sm:block" />
              <div className="animate-float-delayed absolute -bottom-6 -left-6 hidden h-20 w-32 rounded-2xl border border-[var(--swaap-accent)]/35 bg-[var(--swaap-accent)]/10 backdrop-blur-md sm:block" />
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-[var(--border)] bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-xl animate-fade-up">
              <h2 className="font-display text-2xl font-bold tracking-tight text-[var(--swaap-ink)] sm:text-3xl">
                Next on the calendar
              </h2>
              <p className="mt-3 text-neutral-600">
                Upcoming SWAAP events—reserve a spot and we’ll confirm your request.
              </p>
            </div>
            <Link
              href="/events"
              className="shrink-0 text-sm font-semibold text-[var(--swaap-primary)] hover:underline animate-fade-up animation-delay-100"
            >
              View all events →
            </Link>
          </div>
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {nextEvents.map((e, i) => (
              <NextEventCard key={e.id} e={e} delay={120 + i * 80} />
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--swaap-sky)_12%,white)] py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="font-display text-center text-2xl font-bold tracking-tight text-[var(--swaap-ink)] sm:text-3xl animate-fade-up">
            How SWAAP works
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-neutral-600 animate-fade-up animation-delay-100">
            Verify with your phone, share what you want, then step into rooms built for real conversation.
          </p>
          <div className="mt-14 grid gap-8 sm:grid-cols-3">
            {steps.map(({ step, title, desc }, i) => (
              <div
                key={step}
                className="group relative overflow-hidden rounded-2xl border border-[color-mix(in_srgb,var(--swaap-primary)_12%,white)] bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg animate-fade-up"
                style={{ animationDelay: `${150 + i * 100}ms` }}
              >
                <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[color-mix(in_srgb,var(--swaap-sky)_35%,transparent)] transition-transform group-hover:scale-150" />
                <span className="relative inline-flex size-11 items-center justify-center rounded-xl bg-[var(--swaap-primary)] text-sm font-bold text-white">
                  {step}
                </span>
                <h3 className="font-display relative mt-4 text-lg font-semibold text-[var(--swaap-ink)]">{title}</h3>
                <p className="relative mt-2 text-neutral-600">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-[var(--border)] bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="animate-fade-up">
              <h2 className="font-display text-2xl font-bold tracking-tight text-[var(--swaap-ink)] sm:text-3xl">
                Built for professional meetups
              </h2>
              <p className="mt-3 text-neutral-600">
                Trust-first profiles, curated events, and a community focused on meaningful exchange—not endless feeds.
              </p>
              <ul className="mt-8 space-y-4 text-neutral-700">
                <li className="flex gap-3">
                  <span className="mt-1 size-2 shrink-0 rounded-full bg-[var(--swaap-lime)]" />
                  <span>
                    <strong className="text-[var(--swaap-ink)]">Verified access</strong> — phone sign-in and rich
                    profiles.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1 size-2 shrink-0 rounded-full bg-[var(--swaap-sky)]" />
                  <span>
                    <strong className="text-[var(--swaap-ink)]">Curated events</strong> — formats that encourage real
                    dialogue.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1 size-2 shrink-0 rounded-full bg-[var(--swaap-accent)]" />
                  <span>
                    <strong className="text-[var(--swaap-ink)]">Purpose-driven</strong> — hiring, collaboration,
                    mentorship, and more.
                  </span>
                </li>
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-4 animate-fade-up animation-delay-200">
              <ImagePlaceholder className="aspect-[3/4] w-full rounded-2xl" gradient="swaap" label="Community" />
              <ImagePlaceholder className="mt-8 aspect-[3/4] w-full rounded-2xl" gradient="lime" label="Venue" />
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div
            className="relative overflow-hidden rounded-3xl px-6 py-14 text-center sm:px-12 sm:py-16"
            style={{ background: "var(--swaap-hero-gradient)" }}
          >
            <div className="pointer-events-none absolute inset-0 opacity-60">
              <div className="animate-mesh absolute inset-0" />
            </div>
            <h2 className="font-display relative text-2xl font-bold text-white sm:text-3xl">Ready to collaborate?</h2>
            <p className="relative mx-auto mt-4 max-w-lg text-white/85">
              Sign in with your phone, complete your profile, and explore what’s next on SWAAP.
            </p>
            <div className="relative mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/login"
                className="rounded-xl bg-[var(--swaap-accent)] px-6 py-3 text-base font-semibold text-[var(--swaap-ink)] transition hover:brightness-105"
              >
                Sign in with phone
              </Link>
              <Link
                href="/explore"
                className="rounded-xl border-2 border-white/40 px-6 py-3 text-base font-semibold text-white transition hover:bg-white/10"
              >
                Explore professionals
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
