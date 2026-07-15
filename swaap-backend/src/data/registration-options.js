/** Shared registration / onboarding option lists (keep in sync with swaap/src/lib/constants.js). */

export const SWAAP_STREAMS = ["Swaap Connect", "Swaap Grow", "Swaap Business"];

/** Experiences / programmes a member can select at signup. */
export const EXPERIENCE_ATTEND_OPTIONS = [
  "SWAAP Social",
  "Swaap Connect",
  "Swaap Grow",
  "Swaap Business",
];

export const DESCRIBES_YOU_OPTIONS = [
  "Founder / Co-founder",
  "Entrepreneur",
  "Executive / C-level",
  "Manager / Team lead",
  "Individual contributor",
  "Freelancer / Consultant",
  "Investor",
  "Student",
  "Other",
];

export const INDUSTRY_OPTIONS = [
  "Technology",
  "Marketing & Advertising",
  "Finance & Fintech",
  "Healthcare",
  "Education",
  "Consulting",
  "Design & Creative",
  "Legal",
  "Product",
  "Operations",
  "Sales",
  "Real estate",
  "Media & Entertainment",
  "Retail & E-commerce",
  "Non-profit",
  "Other",
];

export const CURRENT_STAGE_OPTIONS = [
  "Exploring ideas",
  "Pre-seed / early stage",
  "Growth stage",
  "Established business",
  "Career transition",
  "Employed professional",
  "Investing / advising",
  "Other",
];

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

export const NEED_SUPPORT_OPTIONS = [
  "Finding clients for my business",
  "Expanding my professional network",
  "Career opportunities or job transition",
  "Partnerships and collaborations",
  "Mentorship or guidance",
  "Marketing and brand visibility",
  "Business strategy",
  "Funding or investment",
  "Technology or AI support",
  "Skill development",
  "Exploring new ideas",
  "Other",
];

export const CAN_OFFER_OPTIONS = [
  "Mentorship",
  "Referring useful connections",
  "Business advice",
  "Industry knowledge",
  "Collaboration opportunities",
  "Technical support",
  "Marketing support",
  "Career guidance",
  "Volunteering",
  "Investment insight",
  "Creative support",
  "Other",
];

export const TOPICS_INTEREST_OPTIONS = [
  "Entrepreneurship",
  "Business growth",
  "Innovation",
  "Marketing",
  "AI in business",
  "Startups",
  "Leadership",
  "Career development",
  "Networking",
  "Investment",
  "Technology",
  "Personal branding",
  "Other",
];

export const CONNECT_AREAS_OPTIONS = [
  "Business partnerships",
  "Career opportunities",
  "Knowledge exchange",
  "Mentorship",
  "Client referrals",
  "Investment opportunities",
  "Collaboration on projects",
  "Professional networking",
  "Learning and development",
  "Community building",
  "Other",
];

/** Legacy single-interest allowlist (profile / explore). */
export const ALLOWED_INTERESTS = [
  "Startups",
  "Business Growth",
  "Fundraising",
  "Marketing",
  "Strategy",
  "Sales",
  "Innovation",
  "AI in Business",
  "Digital Transformation",
  "Emerging Technologies",
  "Public Speaking",
  "Networking",
  "Mentorship",
  "Leadership Development",
  "Partnerships",
  "Collaboration",
  ...TOPICS_INTEREST_OPTIONS.filter(
    (t) =>
      ![
        "Startups",
        "Marketing",
        "Innovation",
        "Networking",
        "Mentorship",
      ].includes(t)
  ),
];

export const REGISTRATION_MAX_SELECTIONS = 5;

/**
 * Validate a multi-select list: array of strings, each in allowlist, length 1..max.
 * @returns {{ ok: true, values: string[] } | { ok: false, error: string }}
 */
export function validateMultiSelect(raw, allowlist, { fieldName, required = true, max = REGISTRATION_MAX_SELECTIONS } = {}) {
  let list = [];
  if (Array.isArray(raw)) {
    list = raw.map((x) => String(x).trim()).filter(Boolean);
  } else if (typeof raw === "string" && raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) list = parsed.map((x) => String(x).trim()).filter(Boolean);
      else list = [raw.trim()];
    } catch {
      list = [raw.trim()];
    }
  }

  const unique = [...new Set(list)];
  if (required && unique.length < 1) {
    return { ok: false, error: `${fieldName} requires at least 1 selection` };
  }
  if (unique.length > max) {
    return { ok: false, error: `${fieldName} allows at most ${max} selections` };
  }
  for (const v of unique) {
    if (!allowlist.includes(v)) {
      return { ok: false, error: `Invalid ${fieldName} value: ${v}` };
    }
  }
  return { ok: true, values: unique };
}

export function encodeMultiSelect(values) {
  return JSON.stringify(Array.isArray(values) ? values : []);
}

export function decodeMultiSelect(stored) {
  if (stored == null || stored === "") return [];
  if (Array.isArray(stored)) return stored.map((x) => String(x));
  const s = String(stored);
  try {
    const parsed = JSON.parse(s);
    if (Array.isArray(parsed)) return parsed.map((x) => String(x));
  } catch {
    /* plain text from legacy rows */
  }
  return s.trim() ? [s.trim()] : [];
}
