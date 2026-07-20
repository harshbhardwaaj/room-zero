import type { FetchResult } from "@/lib/pipeline/fetch";
import { structuredCompletion } from "@/lib/pipeline/openai";
import type { FootprintKind, SignalType } from "@/types/room";

/** The raw shape the model returns. Assembled into a Room afterwards; the score
 * is added by the deterministic formula, not by the model. */
export type Extraction = {
  name: string;
  one_liner: string;
  team_size_estimate: number | null;
  cities: string[];
  services: string[];
  sectors: string[];
  tombstone_count: number | null;
  tech_signals: {
    process_email_based: boolean;
    mentions_data_room: boolean;
    has_client_portal: boolean;
    evidence: string[];
  };
  fit_notes: string[];
  people: {
    name: string;
    role: string;
    focus: string | null;
    footprint: {
      kind: FootprintKind;
      title: string;
      summary: string;
      source_url: string | null;
      date: string | null;
    }[];
    likely_priorities: string[];
  }[];
  signals: {
    type: SignalType;
    title: string;
    detail: string | null;
    date: string | null;
    source_url: string | null;
  }[];
  unverified: string[];
};

const FOOTPRINT_KINDS: FootprintKind[] = [
  "interview",
  "talk",
  "article",
  "quote",
  "panel",
  "podcast",
  "award",
  "role_note",
];

const SIGNAL_TYPES: SignalType[] = [
  "new_mandate",
  "new_hire",
  "site_relaunch",
  "award",
  "office_move",
  "fund_close",
  "press",
  "content",
  "other",
];

const EXTRACTION_SCHEMA: Record<string, unknown> = {
  type: "object",
  additionalProperties: false,
  required: [
    "name",
    "one_liner",
    "team_size_estimate",
    "cities",
    "services",
    "sectors",
    "tombstone_count",
    "tech_signals",
    "fit_notes",
    "people",
    "signals",
    "unverified",
  ],
  properties: {
    name: { type: "string" },
    one_liner: { type: "string" },
    team_size_estimate: { type: ["integer", "null"] },
    cities: { type: "array", items: { type: "string" } },
    services: { type: "array", items: { type: "string" } },
    sectors: { type: "array", items: { type: "string" } },
    tombstone_count: { type: ["integer", "null"] },
    tech_signals: {
      type: "object",
      additionalProperties: false,
      required: ["process_email_based", "mentions_data_room", "has_client_portal", "evidence"],
      properties: {
        process_email_based: { type: "boolean" },
        mentions_data_room: { type: "boolean" },
        has_client_portal: { type: "boolean" },
        evidence: { type: "array", items: { type: "string" } },
      },
    },
    fit_notes: { type: "array", items: { type: "string" } },
    people: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "role", "focus", "footprint", "likely_priorities"],
        properties: {
          name: { type: "string" },
          role: { type: "string" },
          focus: { type: ["string", "null"] },
          footprint: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["kind", "title", "summary", "source_url", "date"],
              properties: {
                kind: { type: "string", enum: FOOTPRINT_KINDS },
                title: { type: "string" },
                summary: { type: "string" },
                source_url: { type: ["string", "null"] },
                date: { type: ["string", "null"] },
              },
            },
          },
          likely_priorities: { type: "array", items: { type: "string" } },
        },
      },
    },
    signals: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["type", "title", "detail", "date", "source_url"],
        properties: {
          type: { type: "string", enum: SIGNAL_TYPES },
          title: { type: "string" },
          detail: { type: ["string", "null"] },
          date: { type: ["string", "null"] },
          source_url: { type: ["string", "null"] },
        },
      },
    },
    unverified: { type: "array", items: { type: "string" } },
  },
};

const SYSTEM_PROMPT = `You are the extraction engine for Room Zero, an outbound sales-intelligence tool that builds a research "deal room" on an M&A advisory firm from its own public website. You will be given the text of several pages from one firm's site. Turn them into the exact JSON schema provided.

HARD RULES. These are product requirements, not preferences:
1. PUBLIC PROFESSIONAL DATA ONLY. Use only what this firm publishes about itself on these pages. Never add private or personal information about any individual. A person's "footprint" is their public professional record only (published talks, interviews, bylines, on-the-record quotes about their work). If a page only lists a name and role, that is all you record for them.
2. NEVER INVENT. If a fact is not on the pages, do not guess it. Numbers you can't find are null. Lists you can't fill are empty. A blank field is correct; a plausible-but-unsourced field is a bug that could sink a real sales email.
3. EVIDENCE MUST BE REAL AND ON-POINT. Every string in tech_signals.evidence must be a short quote or close paraphrase of text that actually appears on the pages AND that genuinely supports the specific signal it backs. Do not manufacture quotes, and do not list generic contact details as evidence of a process.
4. CITE FROM THE GIVEN PAGES. Any source_url must be one of the page URLs provided in the input. If you are unsure which page a fact came from, use null.
5. FLAG GAPS. Put a short, specific line in "unverified" for every field you left null or empty because the site didn't state it (e.g. "team_size_estimate, headcount not stated"; "why-now signals, nothing dated found").
6. PUNCTUATION. Never use an em dash or an en dash in any output field. Use a comma, a period or a colon. Ordinary hyphens inside words ("sell-side", "mid-market") are fine. This text is read by a prospect, and em-dash-heavy prose reads as machine-written.

FIELD GUIDANCE:
- name: the firm's common name as it presents itself, ONE clean name, not two variants joined by a slash, and drop the legal suffix (GmbH, AG, & Co. KG) unless that is genuinely how they are known.
- one_liner: one sentence on what the firm does, grounded in their own words.
- team_size_estimate: the size of the whole firm, count EVERYONE shown on the team/about page (not just the 2-3 senior partners you put in "people"), or use a stated headcount if given. Only null if the pages give no way to count or state it.
- cities: the actual city names where the firm has offices (e.g. "Frankfurt", "München", "Berlin"), just the city, never a phrase like "close to Frankfurt" or "near Munich".
- services / sectors: what they advise on and the industries they focus on.
- tombstone_count: if the firm states a total number of completed transactions (e.g. "over 200 transactions", "50+ deals closed", "more than 250 successful"), use that stated number. Otherwise count the distinct deal tombstones actually shown. null if neither is available. (Prefer the stated total, a visible-tombstone count usually undercounts a firm's real track record.)
- tech_signals.process_email_based: TRUE only if the site EXPLICITLY describes how they RUN a transaction/deal, managing buyers, documents, or the process, manually, by email, phone, spreadsheets, or "personally / by hand". This is a statement about their DEAL WORKFLOW. A contact form, a "write to us" email address, an office phone number, or an email newsletter signup are NOT evidence of this and MUST be ignored for this flag, every firm has those. If the only email/phone references are ways to contact the firm, set this to FALSE. When in doubt, FALSE. The evidence string, if true, must be the actual process-describing sentence, not a contact detail.
- tech_signals.mentions_data_room: true if they mention a data room / Datenraum / VDR / secure document room used in their deals.
- tech_signals.has_client_portal: true if the site has a client login / portal / deal platform for clients (not a generic contact form or newsletter).
- fit_notes: 2-4 short notes on why this firm is (or isn't) a fit for an AI-native M&A deal platform, grounded in the extracted facts.
- people: the 2-3 most senior decision-makers named (partners, managing directors, founders). likely_priorities are clearly-labelled inferences about what they'd care about in a buying conversation, reasonable, but framed as inference, never asserted as fact.
- signals: dated "why now" events (new mandate, new hire, site relaunch, award, press, published content). Only include ones actually present; date can be null if the event is shown but undated.

Return ONLY the JSON object.`;

export async function extractFirm(fetchResult: FetchResult): Promise<Extraction> {
  const pageList = fetchResult.pages
    .map((p) => `- [${p.label}] ${p.url}`)
    .join("\n");

  const pageTexts = fetchResult.pages
    .map((p) => `===== PAGE (${p.label}): ${p.url} =====\n${p.text}`)
    .join("\n\n");

  const user = `Firm base URL: ${fetchResult.baseUrl}

Pages fetched (use these exact URLs for any source_url):
${pageList}

--- PAGE CONTENT ---
${pageTexts}`;

  return structuredCompletion<Extraction>({
    system: SYSTEM_PROMPT,
    user,
    schemaName: "firm_extraction",
    schema: EXTRACTION_SCHEMA,
  });
}
