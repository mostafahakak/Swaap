"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Legacy URL — navbar now uses Explore at `/explore`. */
export default function DiscoverRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/explore");
  }, [router]);
  return (
    <div className="flex min-h-[30vh] items-center justify-center text-neutral-500">Redirecting to Explore…</div>
  );
}
