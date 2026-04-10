"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { ImagePlaceholder } from "@/components/ImagePlaceholder";
import { apiGetEvents } from "@/lib/api";
import { dummyEvents } from "@/lib/dummy-data";
import { useAuth } from "@/context/AuthContext";

function NextEventCard({ e, delay }) {
  const priceLabel = e.price === 0 ? "Free" : `£${e.price}`;
  return (
    <Link
      href={`/events/${e.id}`}
      className="group block overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-violet-500/10 animate-fade-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="overflow-hidden">
        <ImagePlaceholder
          className="aspect-[16/10] w-full transition-transform duration-500 group-hover:scale-[1.02]"
          gradient="warm"
          label="Event cover — replace with photo"
        />
      </div>
      <div className="p-5">
        <span className="text-xs font-medium uppercase tracking-wider text-violet-600">{e.type}</span>
        <h3 className="mt-2 line-clamp-2 text-lg font-semibold text-black group-hover:text-violet-700">{e.title}</h3>
        <p className="mt-2 text-sm text-neutral-500">
          {e.date} · {e.time} · {e.location}
        </p>
        <span className="mt-3 inline-block rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700">
          {priceLabel}
        </span>
      </div>
    </Link>
  );
}

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
      desc: "Phone-verified identity, your goals, and what you offer—so every introduction counts.",
    },
    {
      step: "2",
      title: "Discover events",
      desc: "Meetups, swaps, and hybrid sessions matched to your industry and intent.",
    },
    {
      step: "3",
      title: "Swap & connect",
      desc: "Trade expertise, hire, collaborate, or find your next role—face to face or online.",
    },
  ];

  const pillars = [
    { title: "Verified profiles", desc: "Phone sign-in and rich profiles build trust fast." },
    { title: "Curated events", desc: "Dummy schedules for now—swap in your real calendar later." },
    { title: "Purpose-driven matching", desc: "Interests like hiring, job seeking, and collaboration." },
    { title: "Professional layer", desc: "Titles, industries, and LinkedIn—built for serious meetups." },
  ];

  return (
    <div className="overflow-hidden">
      <section className="relative border-b border-white/10 bg-zinc-950 text-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="animate-mesh absolute inset-0 opacity-90" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(139,92,246,0.35),transparent)]" />
        </div>
        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-10">
            <div className="animate-fade-up">
              <Logo variant="full" className="mb-8 [&_img]:brightness-0 [&_img]:invert" />
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-violet-300/90">
                Professional meetups · Smart intros · Knowledge swap
              </p>
              <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
                Meet the right people.
                <span className="block bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">
                  Swap value, not just cards.
                </span>
              </h1>
              <p className="mt-6 max-w-xl text-lg text-zinc-400">
                SWAAP is a professional meetup platform: verify with your phone, say what you want—connect,
                hire, find a job, or collaborate—then step into events built for real conversations.
              </p>
              <div className="mt-10 flex flex-wrap gap-4">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 text-base font-semibold text-zinc-900 shadow-lg shadow-black/20 transition hover:bg-zinc-100"
                >
                  Get started
                </Link>
                <Link
                  href="/events"
                  className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/5 px-6 py-3 text-base font-medium text-white backdrop-blur transition hover:bg-white/10"
                >
                  Browse events
                </Link>
              </div>
            </div>
            <div className="relative animate-fade-up animation-delay-200">
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl border border-white/10 shadow-2xl shadow-violet-500/10">
                <ImagePlaceholder className="h-full w-full" gradient="violet" label="Hero visual — replace with photography" />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 flex flex-wrap gap-3">
                  {["Live meetups", "Hybrid", "Global"].map((t) => (
                    <span
                      key={t}
                      className="rounded-full border border-white/20 bg-black/30 px-3 py-1 text-xs font-medium text-white backdrop-blur"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <div className="animate-float absolute -right-4 -top-4 hidden h-24 w-24 rounded-2xl border border-white/10 bg-white/10 backdrop-blur-md sm:block" />
              <div className="animate-float-delayed absolute -bottom-6 -left-6 hidden h-20 w-32 rounded-2xl border border-violet-500/30 bg-violet-500/10 backdrop-blur-md sm:block" />
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-neutral-200 bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-xl animate-fade-up">
              <h2 className="text-2xl font-semibold tracking-tight text-black sm:text-3xl">Next on the calendar</h2>
              <p className="mt-3 text-neutral-600">
                Preview events (dummy data for now). Wire your CMS or database when you are ready.
              </p>
            </div>
            <Link
              href="/events"
              className="shrink-0 text-sm font-medium text-violet-700 hover:underline animate-fade-up animation-delay-100"
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

      <section className="border-b border-neutral-200 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center text-2xl font-semibold tracking-tight text-black sm:text-3xl animate-fade-up">
            How SWAAP works
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-neutral-600 animate-fade-up animation-delay-100">
            Phone verification first—then your goals—then the room where introductions happen.
          </p>
          <div className="mt-14 grid gap-8 sm:grid-cols-3">
            {steps.map(({ step, title, desc }, i) => (
              <div
                key={step}
                className="group relative overflow-hidden rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-violet-500/10 animate-fade-up"
                style={{ animationDelay: `${150 + i * 100}ms` }}
              >
                <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 transition-transform group-hover:scale-150" />
                <span className="relative inline-flex size-11 items-center justify-center rounded-xl bg-zinc-900 text-sm font-bold text-white">
                  {step}
                </span>
                <h3 className="relative mt-4 text-lg font-semibold text-black">{title}</h3>
                <p className="relative mt-2 text-neutral-600">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-neutral-200 bg-gradient-to-b from-violet-50/80 to-white py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="animate-fade-up">
              <h2 className="text-2xl font-semibold tracking-tight text-black sm:text-3xl">Built for professional meetups</h2>
              <p className="mt-3 text-neutral-600">
                Visual placeholders stand in for photography and video—drop in brand assets when your creative is ready.
              </p>
              <div className="mt-10 grid gap-4 sm:grid-cols-2">
                {pillars.map(({ title, desc }, i) => (
                  <div
                    key={title}
                    className="rounded-xl border border-violet-100 bg-white/80 p-5 shadow-sm backdrop-blur animate-fade-up"
                    style={{ animationDelay: `${100 + i * 60}ms` }}
                  >
                    <h3 className="font-semibold text-black">{title}</h3>
                    <p className="mt-2 text-sm text-neutral-600">{desc}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 animate-fade-up animation-delay-200">
              <ImagePlaceholder className="aspect-[3/4] w-full rounded-2xl" gradient="violet" label="Community" />
              <ImagePlaceholder className="mt-8 aspect-[3/4] w-full rounded-2xl" gradient="warm" label="Venue / stage" />
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="relative overflow-hidden rounded-3xl bg-zinc-900 px-6 py-14 text-center sm:px-12 sm:py-16">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(139,92,246,0.25),transparent_50%)]" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(6,182,212,0.15),transparent_45%)]" />
            <h2 className="relative text-2xl font-semibold text-white sm:text-3xl">Ready to swap?</h2>
            <p className="relative mx-auto mt-4 max-w-lg text-zinc-400">
              Sign in with your phone, complete your professional profile, and explore what is next on SWAAP.
            </p>
            <div className="relative mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/login"
                className="rounded-xl bg-white px-6 py-3 text-base font-semibold text-zinc-900 transition hover:bg-zinc-100"
              >
                Sign in with phone
              </Link>
              <Link
                href="/discover"
                className="rounded-xl border border-white/20 px-6 py-3 text-base font-medium text-white transition hover:bg-white/10"
              >
                Discover professionals
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
