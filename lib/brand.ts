/**
 * Who this build is addressed to, and how it looks as a result.
 *
 * Same idea as the rest of this codebase's lineage: one build ships to a named
 * company (a private link addressed to them), another to nobody (a public
 * link). They differ only in skin and salutation, never behaviour, so they are
 * one codebase chosen at build time by NEXT_PUBLIC_BRAND — not a fork.
 *
 * The default is "neutral" on purpose. If the env var is missing or misspelt,
 * the safe failure is a public page that never wore someone else's logo. The
 * addressed build carries Fintalo's mark as the *addressee* — the letter is
 * written to them. The byline is always Harsh's.
 *
 * Palette lives in app/globals.css, keyed on data-brand.
 */

export type BrandId = "neutral" | "fintalo";

export type Brand = {
  id: BrandId;
  /** The company this is addressed to, or null for the public build. Addressee,
   * never author. */
  addressee: string | null;
  /** The addressee's wordmark, shown once in the hero as the salutation. Never
   * the byline, never on the public build. */
  addresseeLogo: string | null;

  navTitle: string;
  navSubtitle: string;

  hero: {
    eyebrow: string;
    headlineTop: string;
    /** Optional middle line. Keep every line short enough to survive on one
     * line at the hero's clamp size: a headline that wraps mid-clause leaves a
     * stranded word and reads as an accident. */
    headlineMid?: string;
    headlineLead: string;
    headlineAccent: string;
    headlineTail: string;
    subtitle: string;
  };

  /** CTA label on the hero. */
  heroCta: string;

  contactHeadline: string;
  /** The actual ask, on the last page. Copy principles are explicit that the
   * ending must not be timid or vague, and "book a call, whichever is easiest"
   * is logistics, not an ask. */
  contactAsk: string;
  metaDescription: string;

  /** Fills "Relevant here because ___ needs…" on the proof page. */
  proofAudience: string;

  /** Eyebrow above the problem statement. */
  problemEyebrow: string;
};

/**
 * The public build. No client, no salutation, no borrowed palette. The product
 * has to introduce itself cold, so the headline names what it is before it gets
 * clever.
 */
const NEUTRAL: Brand = {
  id: "neutral",
  addressee: null,
  addresseeLogo: null,
  navTitle: "Room Zero",
  navSubtitle: "Prototype by Harsh",
  hero: {
    eyebrow: "A prototype by Harsh Bhardwaj",
    headlineTop: "A researched deal room for every prospect.",
    headlineLead: "Grounded in ",
    headlineAccent: "one real fact",
    headlineTail: ". Never a guess.",
    subtitle:
      "Point it at a boutique's website. It reads their public pages, scores the fit with a formula you can read, and drafts the opening. Every claim traces back to a page. Anything it can't source, it flags.",
  },
  heroCta: "Open a room",
  contactHeadline: "Let's talk.",
  contactAsk:
    "If this direction is useful, I'd like to build the real version with your team. Twenty minutes on a call is the quickest way to find out whether it fits.",
  metaDescription:
    "Room Zero auto-generates a researched outbound deal room for every M&A boutique worth winning: firm intel, the people who decide, why-now signals, and a first email grounded in one real fact. Built by Harsh Bhardwaj.",
  proofAudience: "this kind of product",
  problemEyebrow: "The problem",
};

/**
 * The private link addressed to Fintalo. Their palette and their wordmark,
 * because the page is a deliverable written to them — a working answer to the
 * outbound problem their own product implies. Authorship stays unmistakable:
 * the byline is Harsh's on every screen, their mark is only ever the addressee.
 *
 * Fintalo sells deal rooms for M&A transactions. This borrows that mental model
 * and turns it on their own go-to-market: Room Zero is the deal room for the
 * deal that comes before all of theirs — winning the customer.
 */
const FINTALO: Brand = {
  id: "fintalo",
  addressee: "Fintalo",
  addresseeLogo: "/fintalo-logo.svg",
  navTitle: "Fintalo",
  navSubtitle: "Prototype by Harsh",
  hero: {
    eyebrow: "A prototype by Harsh Bhardwaj, for",
    headlineTop: "You sell deal rooms for M&A.",
    headlineMid: "So I built the one that comes first.",
    headlineLead: "The room for ",
    headlineAccent: "winning each customer",
    headlineTail: ".",
    subtitle:
      "Point it at any M&A boutique. It reads their public pages and builds the room: who they are, who makes the call, why now, and an opening email grounded in one real fact about them.",
  },
  heroCta: "Open a room",
  contactHeadline: "Let's talk about Fintalo's outbound.",
  contactAsk:
    "I built this because I want to build the real version with your team. If the direction is useful, twenty minutes on a call is the quickest way to find out whether it fits.",
  metaDescription:
    "Room Zero: an auto-generated outbound deal room for every M&A boutique Fintalo would want as a customer. Firm intel, decision-makers, why-now signals, and a grounded first email. Built by Harsh Bhardwaj for Fintalo.",
  proofAudience: "Fintalo",
  problemEyebrow: "The problem, for Fintalo",
};

/**
 * A direct comparison against the inlined env var, not a registry lookup, on
 * purpose. NEXT_PUBLIC_* is substituted at build time, so this folds to the one
 * brand that ships and the minifier drops the other — Fintalo's name and logo
 * path never sit in the public bundle. (Same reason BrandMark switches on the
 * raw env var.)
 */
export const brand: Brand =
  process.env.NEXT_PUBLIC_BRAND === "fintalo" ? FINTALO : NEUTRAL;

export const isAddressedBuild = brand.addressee !== null;
