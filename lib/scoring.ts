import type { FirmIntel, FitScore, Person, ScoreBand, ScoreComponent, Signal } from "@/types/room";

/**
 * The fit score is a transparent weighted formula, deliberately NOT an
 * LLM-assigned number. Every point is traceable to an extracted fact, so you
 * can read why a firm scored what it did and adjust the weights here without
 * touching a prompt. The model extracts facts; this function judges them.
 *
 * 100 points across five readable buckets:
 *
 *   Tech-maturity fit ............ 35   the core Fintalo thesis
 *   Deal activity ................ 25   more transactions => more to gain
 *   Firm-size fit ................ 20   boutiques are the sweet spot
 *   Service / sector fit ......... 12   sell-side M&A advisory is the bullseye
 *   Timeliness (why-now) .........  8   a live signal + reachable people
 *
 * On the tech read: a firm that mentions a data room or client portal, or
 * describes an email-based process, is already living inside the exact workflow
 * Fintalo replaces, so each raises fit (email pain weighted highest). See the
 * case brief's tech-maturity note.
 */

const WEIGHTS = {
  techEmailBased: 15,
  techDataRoom: 10,
  techClientPortal: 10,
  dealActivity: 25,
  sizeFit: 20,
  serviceFit: 12,
  timeliness: 8,
} as const;

const SELLSIDE_TERMS = [
  "m&a",
  "mergers",
  "acquisition",
  "sell-side",
  "sellside",
  "buy-side",
  "buyside",
  "transaction",
  "corporate finance",
  "divestiture",
  "deal advisory",
  "company sale",
  "unternehmensverkauf",
  "nachfolge",
  "beteiligung",
];

function includesAny(haystack: string[], needles: string[]): boolean {
  const hay = haystack.join(" ").toLowerCase();
  return needles.some((n) => hay.includes(n));
}

function techComponent(firm: FirmIntel): ScoreComponent {
  const t = firm.techSignals;
  let points = 0;
  const hits: string[] = [];
  if (t.processEmailBased) {
    points += WEIGHTS.techEmailBased;
    hits.push("email/Excel-based process (the pain Fintalo removes)");
  }
  if (t.mentionsDataRoom) {
    points += WEIGHTS.techDataRoom;
    hits.push("runs data rooms (warm to the category)");
  }
  if (t.hasClientPortal) {
    points += WEIGHTS.techClientPortal;
    hits.push("invests in a client portal (deal-tech buyer)");
  }
  const max = WEIGHTS.techEmailBased + WEIGHTS.techDataRoom + WEIGHTS.techClientPortal;
  const rationale = hits.length
    ? hits.join("; ")
    : "No tech-maturity signals found on the public site.";
  return { key: "tech", label: "Tech-maturity fit", points, max, rationale };
}

function dealActivityComponent(firm: FirmIntel): ScoreComponent {
  const n = firm.tombstoneCount;
  let points: number;
  let rationale: string;
  if (n == null) {
    points = 3;
    rationale = "Deal count not stated on the public site.";
  } else if (n >= 20) {
    points = 25;
    rationale = `${n}+ tombstones: a busy, active dealmaker.`;
  } else if (n >= 10) {
    points = 20;
    rationale = `${n} deals shown: steady deal flow.`;
  } else if (n >= 5) {
    points = 14;
    rationale = `${n} deals shown: moderate volume.`;
  } else if (n >= 1) {
    points = 8;
    rationale = `${n} deal(s) shown: light public track record.`;
  } else {
    points = 3;
    rationale = "No deals shown publicly.";
  }
  return { key: "deals", label: "Deal activity", points, max: WEIGHTS.dealActivity, rationale };
}

/**
 * Bands run smallest to largest so every size has an obvious home. The previous
 * order tested 5-25, then 26-60, then 2-4, and let everything else fall to a
 * final `else` that assumed "bigger". A one-person firm therefore matched no
 * range and was described as "~1 people: a larger firm, so a longer, more
 * committee-driven sale", which is both wrong and ungrammatical. Solo advisors
 * are common in this market, so that was a live case, not a theoretical one.
 */
function sizeFitComponent(firm: FirmIntel): ScoreComponent {
  const n = firm.teamSizeEstimate;
  let points: number;
  let rationale: string;
  if (n == null) {
    points = 5;
    rationale = "Team size not stated.";
  } else if (n <= 1) {
    points = 8;
    rationale = "A solo advisor: one seat to sell, and the least coordination to remove.";
  } else if (n <= 4) {
    points = 10;
    rationale = `~${n} people: very small, so fewer seats and a faster decision.`;
  } else if (n <= 25) {
    points = 20;
    rationale = `~${n} people: the boutique sweet spot for Fintalo.`;
  } else if (n <= 60) {
    points = 14;
    rationale = `~${n} people: mid-size, still a strong fit.`;
  } else {
    points = 8;
    rationale = `~${n} people: a larger firm, so a longer, more committee-driven sale.`;
  }
  return { key: "size", label: "Firm-size fit", points, max: WEIGHTS.sizeFit, rationale };
}

function serviceFitComponent(firm: FirmIntel): ScoreComponent {
  const corpus = [...firm.services, ...firm.sectors, firm.oneLiner];
  const isSellSide = includesAny(corpus, SELLSIDE_TERMS);
  let points: number;
  let rationale: string;
  if (isSellSide) {
    points = 12;
    rationale = "Core M&A / corporate-finance advisory: the bullseye.";
  } else if (firm.services.length > 0) {
    points = 5;
    rationale = "Adjacent advisory work; M&A not the clear centre.";
  } else {
    points = 3;
    rationale = "Services not clearly stated.";
  }
  return { key: "service", label: "Service / sector fit", points, max: WEIGHTS.serviceFit, rationale };
}

function timelinessComponent(signals: Signal[], people: Person[]): ScoreComponent {
  let points = 0;
  const hits: string[] = [];
  if (signals.length > 0) {
    points += 5;
    hits.push(`${signals.length} live "why now" signal(s)`);
  }
  const reachable = people.filter((p) => p.footprint.length > 0).length;
  if (reachable > 0) {
    points += 3;
    hits.push(`${reachable} decision-maker(s) with a public footprint to reference`);
  }
  const rationale = hits.length ? hits.join("; ") : "No recent signals or public footprint found.";
  return { key: "timeliness", label: "Timeliness (why-now)", points, max: WEIGHTS.timeliness, rationale };
}

export function bandFor(total: number): ScoreBand {
  if (total >= 70) return "strong";
  if (total >= 45) return "promising";
  return "long_shot";
}

/**
 * Compute the fit score from extracted facts. Pure and deterministic: same
 * facts in, same score out, every time.
 */
export function scoreFirm(firm: FirmIntel, people: Person[], signals: Signal[]): FitScore {
  const components: ScoreComponent[] = [
    techComponent(firm),
    dealActivityComponent(firm),
    sizeFitComponent(firm),
    serviceFitComponent(firm),
    timelinessComponent(signals, people),
  ];
  const total = components.reduce((sum, c) => sum + c.points, 0);
  return { total, band: bandFor(total), components };
}

export const SCORE_WEIGHTS = WEIGHTS;
