import Link from "next/link";
import { Logo } from "./Logo";

const links = [
  { href: "/about", label: "About Swap" },
  { href: "/events", label: "Events" },
  { href: "/explore", label: "Explore" },
  { href: "/contact", label: "Contact us" },
  { href: "/signup", label: "Sign up" },
  { href: "/login", label: "Log in" },
];

export function Footer() {
  return (
    <footer className="border-t border-[color-mix(in_srgb,var(--swaap-primary)_12%,white)] bg-[color-mix(in_srgb,var(--swaap-primary)_6%,white)]">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Logo variant="full" />
            <p className="font-display mt-4 text-sm font-semibold tracking-wide text-[var(--swaap-primary)]">
              Create · Connect · Collaborate
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-2">
            {links.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-sm font-medium text-neutral-600 hover:text-[var(--swaap-primary)]"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
        <p className="mt-8 border-t border-[var(--border)] pt-8 text-sm text-neutral-600">
          © {new Date().getFullYear()} SWAAP. Create. Connect. Collaborate.
        </p>
        <p className="mt-2 text-sm text-neutral-500">
          Powered by{" "}
          <a
            href="https://iolab.app"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-[var(--swaap-primary)] underline hover:opacity-90"
          >
            IO LAB
          </a>
        </p>
      </div>
    </footer>
  );
}
