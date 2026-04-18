/** Swaap programme streams — used for filtering and event labels */
export const SWAAP_STREAMS = ["Swaap Connect", "Swaap Grow", "Swaap Business"];

/** Dummy events served by GET /api/events and GET /api/events/:id */
export const dummyEvents = [
  {
    id: "evt-1",
    swaapStream: "Swaap Connect",
    title: "SWAAP Tech & Marketing Exchange",
    description:
      "Quarterly meetup for tech and marketing professionals to swap expertise. Bring your skills, leave with new connections.",
    longDescription:
      "Join peers for lightning talks, curated breakout swaps, and structured networking. Perfect if you want to trade technical depth for go-to-market insight—or the reverse.",
    date: "2026-05-15",
    time: "18:00 UTC",
    location: "London, UK",
    type: "In-person",
    industry: "Technology",
    attendees: 84,
    price: 0,
    coverImage: "/placeholder-event-1",
    agenda: ["Welcome & intros", "Expertise swap rounds", "Open networking"],
  },
  {
    id: "evt-2",
    swaapStream: "Swaap Grow",
    title: "AI in Business Networking",
    description:
      "Explore how AI-driven matchmaking is transforming professional connections. Workshops and networking.",
    longDescription:
      "Hands-on sessions on responsible AI for introductions, profile enrichment, and follow-ups—plus live demos of matchmaking flows.",
    date: "2026-05-22",
    time: "14:00 UTC",
    location: "Virtual",
    type: "Online",
    industry: "Technology",
    attendees: 256,
    price: 29,
    coverImage: "/placeholder-event-2",
    agenda: ["Keynote", "Workshop: matchmaking UX", "Office hours"],
  },
  {
    id: "evt-3",
    swaapStream: "Swaap Business",
    title: "Design × Dev Swap Lounge",
    description:
      "Designers and developers exchange services. Need a logo? Swap with code. Need a landing page? Swap with branding.",
    longDescription:
      "Pair programming meets design critique. Bring a concrete ask; leave with a tangible deliverable or clear next steps.",
    date: "2026-06-02",
    time: "17:00 CEST",
    location: "Berlin, Germany",
    type: "In-person",
    industry: "Design",
    attendees: 42,
    price: 15,
    coverImage: "/placeholder-event-3",
    agenda: ["Pairing mixer", "Swap sprints", "Show & tell"],
  },
  {
    id: "evt-4",
    swaapStream: "Swaap Connect",
    title: "Startup Founders Knowledge Swap",
    description:
      "Founders share lessons on growth, fundraising, and ops. One-on-one swap sessions included.",
    longDescription:
      "Small-group founder circles plus 1:1 swap slots. Topics: GTM, hiring, cap table basics, and burnout prevention.",
    date: "2026-06-10",
    time: "10:00 EDT",
    location: "New York, USA",
    type: "Hybrid",
    industry: "Consulting",
    attendees: 120,
    price: 49,
    coverImage: "/placeholder-event-4",
    agenda: ["Founder circles", "1:1 swaps", "Investor AMA (guest)"],
  },
  {
    id: "evt-5",
    swaapStream: "Swaap Grow",
    title: "Marketing for Developers",
    description:
      "Devs learn basic marketing; marketers learn basic dev. Structured swap workshops.",
    longDescription:
      "Beginner-friendly tracks: positioning, landing pages, analytics for engineers; HTML/CSS and no-code tools for marketers.",
    date: "2026-06-18",
    time: "16:00 UTC",
    location: "Virtual",
    type: "Online",
    industry: "Marketing",
    attendees: 189,
    price: 0,
    coverImage: "/placeholder-event-5",
    agenda: ["Track kickoffs", "Cross-discipline pairs", "Retro"],
  },
];

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
];
