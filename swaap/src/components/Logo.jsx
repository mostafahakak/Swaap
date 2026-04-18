"use client";

import Link from "next/link";

/** Paths under /public/Logo — wordmarks + icon marks from brand kit */
export const LOGO_ASSETS = {
  wordmarkLight: "/Logo/logo_txt_bl.png",
  wordmarkDark: "/Logo/logo_txt_wh.png",
  wordmarkBlue: "/Logo/logo_txt_b.png",
  wordmarkBlack: "/Logo/logo_black.png",
  iconBlue: "/Logo/logo_blue.png",
  iconWhite: "/Logo/logo_white.png",
};

/**
 * @param {"full"|"navbar"|"compact"|"icon"} variant
 * @param {"light"|"dark"|"blue"} tone — light bg → dark wordmark; dark bg → white wordmark; blue → blue wordmark + icon
 */
export function Logo({ variant = "full", tone = "light", className = "" }) {
  const isIcon = variant === "icon";

  const src = (() => {
    if (isIcon) {
      if (tone === "dark") return LOGO_ASSETS.iconWhite;
      if (tone === "blue") return LOGO_ASSETS.iconBlue;
      return LOGO_ASSETS.iconBlue;
    }
    if (tone === "dark") return LOGO_ASSETS.wordmarkDark;
    if (tone === "blue") return LOGO_ASSETS.wordmarkBlue;
    return LOGO_ASSETS.wordmarkLight;
  })();

  const heightClass = (() => {
    if (isIcon) return "h-9 w-9 sm:h-10 sm:w-10";
    if (variant === "navbar") return "h-8 w-auto max-h-9 max-w-[200px] sm:h-9";
    if (variant === "compact") return "h-9 w-auto max-w-[200px] sm:h-10";
    return "h-11 w-auto max-w-[min(100%,280px)] sm:h-12 md:h-14";
  })();

  const img = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt="SWAAP — Connect. Collaborate. Create Value."
      width={isIcon ? 40 : 220}
      height={isIcon ? 40 : 48}
      className={`object-contain object-left ${heightClass}`}
      loading="eager"
    />
  );

  if (isIcon) {
    return (
      <Link href="/" className={`inline-flex items-center shrink-0 ${className}`}>
        {img}
      </Link>
    );
  }

  return (
    <Link href="/" className={`inline-flex shrink-0 items-center no-underline ${className}`}>
      {img}
    </Link>
  );
}
