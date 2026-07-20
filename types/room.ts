/**
 * The Room schema.
 *
 * One shape, used three ways:
 *   - Phase 1 hand-authored sample rooms (data/rooms/*) design against it.
 *   - Phase 2 LLM extraction is forced to emit exactly this (Structured Output).
 *   - The room UI renders it.
 *
 * The hard rule baked into the types: every non-trivial claim about a real firm
 * or person is a *public professional* fact and carries provenance. A fact we
 * could not source is flagged in `Room.unverified`, never invented. See
 * how-it-works ("The public-data line") — this is a product boundary, not a
 * preference.
 */

/** Where a claim came from. `verified` is true only when `sourceUrl` points at
 * a public page the fact actually appears on. When we can't source something we
 * keep the field but mark it unverified and say why, rather than guessing. */
export type Provenance = {
  sourceUrl?: string;
  verified: boolean;
  note?: string;
};

/**
 * The tech-maturity read. Per the case: a firm that mentions a data room or a
 * client portal, or describes an email-based process, is actively living in the
 * exact workflow Fintalo replaces — so each of these raises fit. `evidence`
 * holds the short site quote/paraphrase behind each flag, so the read is
 * auditable rather than asserted.
 */
export type TechSignals = {
  mentionsDataRoom: boolean;
  hasClientPortal: boolean;
  processEmailBased: boolean;
  evidence: string[];
};

export type FootprintKind =
  | "interview"
  | "talk"
  | "article"
  | "quote"
  | "panel"
  | "podcast"
  | "award"
  | "role_note";

/** A single item of someone's PUBLIC PROFESSIONAL footprint: a published
 * interview, a conference talk, a byline, an on-the-record quote about their own
 * process. Never anything private or personal. */
export type FootprintItem = {
  kind: FootprintKind;
  title: string;
  summary: string;
  sourceUrl?: string;
  date?: string;
};

export type Person = {
  name: string;
  role: string;
  /** Their public deal focus / remit, if stated. */
  focus?: string;
  footprint: FootprintItem[];
  /** What this person likely cares about in a buying conversation. Clearly an
   * inference from public signals, presented as such — not a claimed fact. */
  likelyPriorities: string[];
  provenance: Provenance;
};

export type SignalType =
  | "new_mandate"
  | "new_hire"
  | "site_relaunch"
  | "award"
  | "office_move"
  | "fund_close"
  | "press"
  | "content"
  | "other";

/** A "why now" event — the timeline that makes an outreach timely. */
export type Signal = {
  type: SignalType;
  title: string;
  detail?: string;
  date?: string;
  sourceUrl?: string;
};

export type Objection = {
  objection: string;
  counter: string;
};

export type OpeningEmail = {
  subject: string;
  body: string;
  /** The single real, observed fact about the firm the email is built on.
   * If this is empty, the play is not grounded and the email must not be sent. */
  groundedFact: string;
  groundedFactSourceUrl?: string;
};

export type Play = {
  angle: string;
  objections: Objection[];
  openingEmail: OpeningEmail;
};

/** One line of the deterministic score. `points`/`max` are computed by a
 * readable formula in lib/scoring.ts — never assigned by the model. */
export type ScoreComponent = {
  key: string;
  label: string;
  points: number;
  max: number;
  rationale: string;
};

export type ScoreBand = "strong" | "promising" | "long_shot";

export type FitScore = {
  total: number;
  band: ScoreBand;
  components: ScoreComponent[];
};

export type RoomStatus = "new" | "contacted" | "replied" | "demo_booked";

export type FirmIntel = {
  name: string;
  url: string;
  /** What they do, one sourced line. */
  oneLiner: string;
  teamSizeEstimate: number | null;
  cities: string[];
  services: string[];
  sectors: string[];
  /** Count of deals / tombstones found on the public site. */
  tombstoneCount: number | null;
  techSignals: TechSignals;
  /** Why this firm fits (or doesn't) for Fintalo. */
  fitNotes: string[];
  provenance: Provenance;
};

export type Room = {
  /** URL-safe slug, also the room id. */
  id: string;
  firm: FirmIntel;
  people: Person[];
  signals: Signal[];
  play: Play;
  score: FitScore;
  status: RoomStatus;
  /** ISO timestamp the room was generated (or authored). */
  generatedAt: string;
  /** Every public URL fetched to build this room. */
  sources: string[];
  /** Fields we could NOT source from public pages — surfaced, never invented. */
  unverified: string[];
  /** Hand-authored sample (Phase 1) vs live-generated from a real site. */
  isSample?: boolean;
};

/** The compact shape the index list needs — avoids shipping full rooms to the
 * list view. */
export type RoomSummary = {
  id: string;
  firmName: string;
  oneLiner: string;
  cities: string[];
  fitScore: number;
  band: ScoreBand;
  status: RoomStatus;
  generatedAt: string;
  isSample?: boolean;
  /** Precomputed on the server: the summary has no sources/people to judge
   * from, and a reviewer should see that a room is weakly grounded before
   * spending a click on it. See lib/grounding.ts. */
  isThinRead?: boolean;
};

export function toRoomSummary(room: Room, isThinRead?: boolean): RoomSummary {
  return {
    id: room.id,
    firmName: room.firm.name,
    oneLiner: room.firm.oneLiner,
    cities: room.firm.cities,
    fitScore: room.score.total,
    band: room.score.band,
    status: room.status,
    generatedAt: room.generatedAt,
    isSample: room.isSample,
    isThinRead,
  };
}
