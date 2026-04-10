import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-semibold text-black">About Swap</h1>
      <p className="mt-4 text-lg text-neutral-600">
        SWAAP (S-W-A-A-P) is a professional business networking and AI-powered matchmaking platform
        designed to help individuals and organizations exchange the value of business connections,
        ideas, and opportunities.
      </p>
      <p className="mt-4 text-neutral-600">
        We connect professionals and recommend meaningful business relationships using AI-driven
        insights. Create verified profiles, discover global events, swap expertise with like-minded
        professionals, and access secure payments for events and services.
      </p>
      <p className="mt-4 text-neutral-600">
        Our mission is to build a trusted, scalable, and secure digital ecosystem for professional
        collaboration and business relationship building—enhanced by AI-based matchmaking
        intelligence.
      </p>
      <div className="mt-10">
        <Link
          href="/discover"
          className="rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
        >
          Discover professionals
        </Link>
      </div>
    </div>
  );
}
