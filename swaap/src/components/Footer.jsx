import Link from "next/link";
import { Logo } from "./Logo";

const links = [
  { href: "/about", label: "About Swap" },
  { href: "/events", label: "Events" },
  { href: "/discover", label: "Discover" },
  { href: "/contact", label: "Contact us" },
  { href: "/signup", label: "Sign up" },
  { href: "/login", label: "Log in" },
];

export function Footer() {
  return (
    <footer className="border-t border-neutral-200 bg-neutral-50">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <Logo variant="full" />
          <nav className="flex flex-wrap gap-x-6 gap-y-2">
            {links.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-sm text-neutral-600 hover:text-black"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
        <p className="mt-8 border-t border-neutral-200 pt-8 text-sm text-neutral-500">
          © {new Date().getFullYear()} SWAAP. Connect. Collaborate. Create Value.
        </p>
        <p className="mt-2 text-sm text-neutral-500">
          Powered by{" "}
          <a
            href="https://iolab.app"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-black"
          >
            IO LAB
          </a>
        </p>
      </div>
    </footer>
  );
}
