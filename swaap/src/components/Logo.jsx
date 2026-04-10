"use client";

import Link from "next/link";

export function Logo({ variant = "full", className = "" }) {
  const sizes = {
    full: { width: 180, height: 48 },
    navbar: { width: 85, height: 24 },
    compact: { width: 120, height: 32 },
    icon: { width: 40, height: 40 },
  };
  const { width, height } = sizes[variant] || sizes.full;
  const sizeClass = variant === "navbar" ? "max-h-6 max-w-[85px]" : "";

  const img = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/Logo.png"
      alt="SWAAP — Connect. Collaborate. Create Value."
      width={width}
      height={height}
      className={`h-auto w-auto object-contain object-left ${sizeClass}`}
      loading="eager"
    />
  );

  if (variant === "icon") {
    return (
      <Link href="/" className={`inline-flex items-center shrink-0 ${className}`}>
        {img}
      </Link>
    );
  }

  return (
    <Link href="/" className={`inline-flex shrink-0 items-center text-black no-underline ${className}`}>
      {img}
    </Link>
  );
}
