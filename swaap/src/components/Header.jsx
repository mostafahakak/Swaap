"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Logo } from "./Logo";
import { useAuth } from "@/context/AuthContext";

const nav = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About Swap" },
  { href: "/events", label: "Events" },
  { href: "/explore", label: "Explore" },
  { href: "/contact", label: "Contact us" },
  { href: "/admin", label: "Admin", adminOnly: true },
];

export function Header() {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { firebaseUser, userExists, loading, signOut, isAdmin } = useAuth();

  const isAuthed = Boolean(firebaseUser);
  const needsOnboarding = isAuthed && !userExists;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  useEffect(() => {
    const onEscape = (e) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };
    if (drawerOpen) {
      document.addEventListener("keydown", onEscape);
      return () => document.removeEventListener("keydown", onEscape);
    }
  }, [drawerOpen]);

  const handleLogout = async () => {
    await signOut();
    setDrawerOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-[color-mix(in_srgb,var(--swaap-primary)_14%,white)] bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo variant="navbar" />

        <nav className="hidden items-center gap-1 md:flex">
          {nav
            .filter((item) => !item.adminOnly || isAdmin)
            .map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  pathname === href
                    ? "bg-[color-mix(in_srgb,var(--swaap-primary)_14%,white)] text-[var(--swaap-primary)]"
                    : "text-neutral-600 hover:bg-neutral-50 hover:text-[var(--swaap-ink)]"
                }`}
              >
                {label}
              </Link>
            ))}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden gap-2 md:flex">
            {loading ? (
              <span className="h-9 w-24 animate-pulse rounded-lg bg-neutral-100" aria-hidden />
            ) : isAuthed ? (
              <>
                {needsOnboarding ? (
                  <Link
                    href="/onboarding/enter-info"
                    className="rounded-lg border border-[color-mix(in_srgb,var(--swaap-primary)_25%,white)] bg-[color-mix(in_srgb,var(--swaap-sky)_18%,white)] px-4 py-2 text-sm font-semibold text-[var(--swaap-primary)] transition-colors hover:bg-[color-mix(in_srgb,var(--swaap-sky)_28%,white)]"
                  >
                    Complete profile
                  </Link>
                ) : (
                  <Link
                    href="/profile"
                    className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
                  >
                    My Profile
                  </Link>
                )}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-lg bg-[var(--swaap-primary)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:opacity-95"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-lg px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
                >
                  Log in
                </Link>
                <Link
                  href="/login"
                  className="rounded-lg bg-[var(--swaap-accent)] px-4 py-2 text-sm font-semibold text-[var(--swaap-ink)] shadow-sm transition hover:brightness-105"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="flex size-10 items-center justify-center rounded-lg text-neutral-600 hover:bg-neutral-100 md:hidden"
            aria-label="Open menu"
          >
            <svg className="size-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {mounted &&
        typeof document !== "undefined" &&
        createPortal(
          <>
            <div
              role="presentation"
              onClick={() => setDrawerOpen(false)}
              className={`fixed inset-0 z-[9998] bg-black/20 transition-opacity md:hidden ${
                drawerOpen ? "visible opacity-100" : "invisible opacity-0 pointer-events-none"
              }`}
              aria-hidden="true"
            />

            <div
              role="dialog"
              aria-modal="true"
              aria-label="Main menu"
              aria-hidden={!drawerOpen}
              style={{ backgroundColor: "#ffffff" }}
              className={`fixed top-0 right-0 z-[9999] flex h-full w-72 max-w-[85vw] flex-col gap-1 border-l border-neutral-200 p-4 shadow-xl transition-transform duration-200 ease-out md:hidden ${
                drawerOpen ? "translate-x-0" : "translate-x-full pointer-events-none"
              }`}
            >
              <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
                <span className="font-semibold text-[var(--swaap-ink)]">Menu</span>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="flex size-10 items-center justify-center rounded-lg text-neutral-600 hover:bg-neutral-100"
                  aria-label="Close menu"
                >
                  <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <nav className="flex flex-col gap-1 pt-4">
                {nav
                  .filter((item) => !item.adminOnly || isAdmin)
                  .map(({ href, label }) => (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setDrawerOpen(false)}
                      className={`rounded-lg px-4 py-3 text-base font-medium transition-colors ${
                        pathname === href
                          ? "bg-[color-mix(in_srgb,var(--swaap-primary)_12%,white)] text-[var(--swaap-primary)]"
                          : "text-neutral-700 hover:bg-neutral-50"
                      }`}
                    >
                      {label}
                    </Link>
                  ))}
              </nav>
              <div className="mt-auto flex flex-col gap-2 border-t border-neutral-200 pt-4">
                {loading ? null : isAuthed ? (
                  <>
                    {needsOnboarding ? (
                      <Link
                        href="/onboarding/enter-info"
                        onClick={() => setDrawerOpen(false)}
                        className="rounded-lg border border-[color-mix(in_srgb,var(--swaap-primary)_22%,white)] bg-[color-mix(in_srgb,var(--swaap-sky)_16%,white)] px-4 py-3 text-center text-sm font-semibold text-[var(--swaap-primary)]"
                      >
                        Complete profile
                      </Link>
                    ) : (
                      <Link
                        href="/profile"
                        onClick={() => setDrawerOpen(false)}
                        className="rounded-lg border border-neutral-200 px-4 py-3 text-center text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                      >
                        My Profile
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="rounded-lg bg-[var(--swaap-primary)] px-4 py-3 text-center text-sm font-semibold text-white hover:opacity-95"
                    >
                      Log out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setDrawerOpen(false)}
                      className="rounded-lg border border-neutral-200 px-4 py-3 text-center text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                    >
                      Log in
                    </Link>
                    <Link
                      href="/login"
                      onClick={() => setDrawerOpen(false)}
                      className="rounded-lg bg-[var(--swaap-accent)] px-4 py-3 text-center text-sm font-semibold text-[var(--swaap-ink)]"
                    >
                      Sign up
                    </Link>
                  </>
                )}
              </div>
            </div>
          </>,
          document.body
        )}
    </header>
  );
}
