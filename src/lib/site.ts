/**
 * Brand and app settings in one place.
 * Change the name, wordmark, tagline, contacts or links here and the whole site follows.
 */
export const site = {
  /** Brand name used in text, e.g. "Pay on Rezlify". */
  name: "Rezlify",
  /** How the name is written in the logo. */
  wordmark: "rezlify",
  domain: "rezlify.com",

  tagline: "Buy it. No wahala.",
  /** The homepage headline, split so the second part can be highlighted. */
  headline: { lead: "Buy it.", accent: "No wahala." },
  description:
    "Buy and sell phones, laptops, books, generators and more across Nigeria. Verified sellers and safe payments, so you never get scammed.",

  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api",

  /** Prefix for order references, e.g. RZ-7KQ2M9 (must match the Laravel API). */
  orderPrefix: "RZ",

  owner: {
    name: "Radius Tech Solutions",
    legalName: "Radius Tech Solutions Limited",
    url: "https://www.radiustechsolutions.com",
  },

  // TODO: confirm before launch
  support: {
    email: "support@rezlify.com",
  },

  socials: {
    instagram: "https://instagram.com/rezlify",
    tiktok: "https://tiktok.com/@rezlify",
    x: "https://x.com/rezlify",
    facebook: "https://facebook.com/rezlify",
  },
} as const;
