/** Match backend `ALLOWED_INTERESTS` in swaap-backend/src/data/dummy-events.js */
export const INTEREST_OPTIONS = [
  "Connect with people",
  "Hire someone",
  "Seeking job",
  "Find collaborators / partners",
  "Offer or find mentorship",
  "Explore new opportunities",
];

/** Match signup / onboarding — how users found SWAAP */
export const HEAR_ABOUT_OPTIONS = [
  "Friend or colleague",
  "LinkedIn",
  "Google / search",
  "Attended a SWAAP event",
  "Social media",
  "News or article",
  "Podcast or video",
  "Other",
];

export const HEAR_ABOUT_OTHER = "Other";

export const PROFESSION_AREAS = [
  "Technology",
  "Marketing",
  "Finance",
  "Healthcare",
  "Education",
  "Consulting",
  "Design",
  "Legal",
  "Product",
  "Operations",
  "Sales",
  "Other",
];

/** Same value on server and client (from NEXT_PUBLIC_* at build time) — avoids hydration mismatches. */
export function getApiBase() {
  return (process.env.NEXT_PUBLIC_API_URL || "").trim().replace(/\/$/, "");
}
