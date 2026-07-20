import { fetchFirmPages, FetchError } from "@/lib/pipeline/fetch";
import { extractFirm, type Extraction } from "@/lib/pipeline/extract";
import { generatePlay } from "@/lib/pipeline/play";
import { LlmError } from "@/lib/pipeline/openai";
import { normalizeProseDeep } from "@/lib/pipeline/prose";
import { scoreFirm } from "@/lib/scoring";
import { saveRoom } from "@/lib/rooms";
import type { FirmIntel, Person, Provenance, Room, Signal } from "@/types/room";

export { FetchError, LlmError };

/**
 * Deterministic guard on the tech signals. The model tends to read generic
 * advisory language ("we handle every transaction personally", "we coordinate
 * the process") as an email/manual workflow — which is an over-read, and this
 * is the highest-weighted signal, so a false positive skews the score and, worse,
 * puts a wrong claim in front of a real firm. So a signal only survives if its
 * own evidence literally contains the wording that defines it. This never adds a
 * signal, only removes unsupported ones, and every removal is surfaced.
 */
const TECH_KEYWORDS = {
  email: /(e-?mail|excel|spreadsheet|tabelle|manuell\b|manually|by hand|per e-?mail|google sheets|word doc)/i,
  dataRoom: /(data\s?room|datenraum|\bvdr\b|virtual data)/i,
  portal: /(portal|client login|kundenlogin|mandantenportal|deal platform|client area|client platform)/i,
};

function guardTechSignals(ts: Extraction["tech_signals"]): {
  corrected: { processEmailBased: boolean; mentionsDataRoom: boolean; hasClientPortal: boolean; evidence: string[] };
  notes: string[];
} {
  const supports = (re: RegExp) => ts.evidence.filter((e) => re.test(e));
  const emailEv = ts.process_email_based ? supports(TECH_KEYWORDS.email) : [];
  const drEv = ts.mentions_data_room ? supports(TECH_KEYWORDS.dataRoom) : [];
  const portalEv = ts.has_client_portal ? supports(TECH_KEYWORDS.portal) : [];

  const processEmailBased = emailEv.length > 0;
  const mentionsDataRoom = drEv.length > 0;
  const hasClientPortal = portalEv.length > 0;
  const evidence = [...new Set([...emailEv, ...drEv, ...portalEv])];

  const notes: string[] = [];
  if (ts.process_email_based && !processEmailBased) {
    notes.push(
      "process_email_based: the site describes hands-on advisory but never names email, Excel or spreadsheets as the deal-management tool; not counted as an email-based process.",
    );
  }
  if (ts.mentions_data_room && !mentionsDataRoom) {
    notes.push("mentions_data_room: flag dropped, no explicit data-room wording in the evidence.");
  }
  if (ts.has_client_portal && !hasClientPortal) {
    notes.push("has_client_portal: flag dropped, no explicit client-portal/login wording in the evidence.");
  }
  return { corrected: { processEmailBased, mentionsDataRoom, hasClientPortal, evidence }, notes };
}

function slugFromHost(baseUrl: string): string {
  try {
    const host = new URL(baseUrl).host.replace(/^www\./, "");
    return host.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase();
  } catch {
    return `room-${Date.now()}`;
  }
}

/** Keep a source_url only if it's a page we actually fetched. Anything else is
 * the model's claim we can't vouch for — drop it to null rather than present an
 * unverified link as sourced. */
function validatedUrl(url: string | null, fetchedSet: Set<string>): string | undefined {
  if (!url) return undefined;
  return fetchedSet.has(url) ? url : undefined;
}

function assembleRoom(
  extraction: Extraction,
  baseUrl: string,
  fetchedUrls: string[],
  generatedAt: string,
): Room {
  const fetchedSet = new Set(fetchedUrls);
  const homeUrl = fetchedUrls[0] ?? baseUrl;

  const firmProvenance: Provenance = { sourceUrl: homeUrl, verified: true };

  const { corrected: techSignals, notes: techNotes } = guardTechSignals(extraction.tech_signals);

  const firm: FirmIntel = {
    name: extraction.name || new URL(baseUrl).host,
    url: baseUrl,
    oneLiner: extraction.one_liner,
    teamSizeEstimate: extraction.team_size_estimate,
    cities: extraction.cities,
    services: extraction.services,
    sectors: extraction.sectors,
    tombstoneCount: extraction.tombstone_count,
    techSignals,
    fitNotes: extraction.fit_notes,
    provenance: firmProvenance,
  };

  const people: Person[] = extraction.people.map((p) => ({
    name: p.name,
    role: p.role,
    focus: p.focus ?? undefined,
    footprint: p.footprint.map((f) => ({
      kind: f.kind,
      title: f.title,
      summary: f.summary,
      sourceUrl: validatedUrl(f.source_url, fetchedSet),
      date: f.date ?? undefined,
    })),
    likelyPriorities: p.likely_priorities,
    provenance: {
      sourceUrl: homeUrl,
      verified: true,
      note: p.footprint.length === 0 ? "Name and role from the site; no further public footprint found." : undefined,
    },
  }));

  const signals: Signal[] = extraction.signals.map((s) => ({
    type: s.type,
    title: s.title,
    detail: s.detail ?? undefined,
    date: s.date ?? undefined,
    sourceUrl: validatedUrl(s.source_url, fetchedSet),
  }));

  const score = scoreFirm(firm, people, signals);

  return {
    id: slugFromHost(baseUrl),
    firm,
    people,
    signals,
    // play filled in by caller after scoring (it needs the score band)
    play: {
      angle: "",
      objections: [],
      openingEmail: { subject: "", body: "", groundedFact: "" },
    },
    score,
    status: "new",
    generatedAt,
    sources: fetchedUrls,
    unverified: [...extraction.unverified, ...techNotes],
    isSample: false,
  };
}

export type GenerateProgress = (stage: string) => void;

/**
 * The full pipeline: fetch public pages → extract to schema → deterministic
 * score → grounded play → assemble + persist. Returns the finished room.
 *
 * `generatedAt` is passed in by the caller (route handler) so this module has
 * no wall-clock dependency of its own.
 */
export async function generateRoom(input: string, generatedAt: string): Promise<Room> {
  // 1. Fetch (throws FetchError on a bad/unreachable URL)
  const fetchResult = await fetchFirmPages(input);
  const fetchedUrls = fetchResult.pages.map((p) => p.url);

  // 2. Extract (throws LlmError). Normalised on the way out: everything below
  // this line, including the score rationales built from these fields, is then
  // free of model punctuation tics.
  const extraction = normalizeProseDeep(await extractFirm(fetchResult));

  // 3. Assemble + deterministic score
  const room = assembleRoom(extraction, fetchResult.baseUrl, fetchedUrls, generatedAt);

  // 4. Play, grounded, using the computed band
  try {
    const play = normalizeProseDeep(await generatePlay(extraction, room.score));
    const fetchedSet = new Set(fetchedUrls);
    room.play = {
      angle: play.angle,
      objections: play.objections,
      openingEmail: {
        subject: play.opening_email.subject,
        body: play.opening_email.body,
        groundedFact: play.opening_email.grounded_fact,
        groundedFactSourceUrl: validatedUrl(play.opening_email.grounded_fact_source_url, fetchedSet),
      },
    };
  } catch {
    // The play is the one pass we can lose without losing the room: firm intel,
    // people, signals and the score all still stand. Leave a clear, non-sendable
    // placeholder rather than failing the whole generation.
    room.play = {
      angle: "The play pass failed. Firm intel and the score above are still valid. Retry to draft the angle and email.",
      objections: [],
      openingEmail: { subject: "", body: "", groundedFact: "" },
    };
    room.unverified = [...room.unverified, "the play (angle/objections/email): generation failed, retry to produce it"];
  }

  // 5. Persist. A write failure must not lose the room: by this point the site
  // has been fetched and two model calls have been paid for, and the caller can
  // still render everything. Most hosts give a serverless function a read-only
  // filesystem, so on a deployed build this is the expected path rather than an
  // exotic one, and throwing here would turn a working result into an error
  // page. It is logged loudly because a room that did not persist will not be
  // in the index afterwards.
  try {
    await saveRoom(room);
  } catch (err) {
    console.error(`[pipeline] room ${room.id} generated but could not be saved:`, err);
  }

  return room;
}
