import type { Extraction } from "@/lib/pipeline/extract";
import { structuredCompletion } from "@/lib/pipeline/openai";
import type { FitScore } from "@/types/room";

export type PlayResult = {
  angle: string;
  objections: { objection: string; counter: string }[];
  opening_email: {
    subject: string;
    body: string;
    grounded_fact: string;
    grounded_fact_source_url: string | null;
  };
};

const PLAY_SCHEMA: Record<string, unknown> = {
  type: "object",
  additionalProperties: false,
  required: ["angle", "objections", "opening_email"],
  properties: {
    angle: { type: "string" },
    objections: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["objection", "counter"],
        properties: {
          objection: { type: "string" },
          counter: { type: "string" },
        },
      },
    },
    opening_email: {
      type: "object",
      additionalProperties: false,
      required: ["subject", "body", "grounded_fact", "grounded_fact_source_url"],
      properties: {
        subject: { type: "string" },
        body: { type: "string" },
        grounded_fact: { type: "string" },
        grounded_fact_source_url: { type: ["string", "null"] },
      },
    },
  },
};

const SYSTEM_PROMPT = `You write the outbound "play" for Room Zero. You are handed everything already extracted about one M&A advisory firm, and you write how to approach them on behalf of Fintalo.

ABOUT FINTALO (what you're selling): Fintalo is an AI-native M&A operating system, one platform that replaces the email, Excel and scattered-data-room sprawl of running a deal. It handles NDA workflows, buyer/investor management, stage-gated document release, deal intelligence, AI-powered outreach and secure collaboration, built for M&A advisors, boutiques and PE. The goal of the outreach is a short demo.

YOUR OUTPUT:
- angle: 2-4 sentences on how to approach THIS firm, grounded in their specific extracted facts (especially the tech signals and any why-now signal). Be concrete about what to lead with and what to avoid.
- objections: 1-3 objections this specific firm would likely raise, each with a short, honest counter. No strawmen.
- opening_email: a short first email (4-6 sentences).

THE ONE HARD RULE, GROUNDING:
The email must be built on exactly ONE real, specific, observed fact about this firm, taken from the extracted data.
- Prefer the most SPECIFIC and DISTINCTIVE fact available: a named why-now signal, a membership or alliance, a quote from their site, a specific stated service or sector, a concrete number of transactions. Only fall back to something generic like team size if nothing more distinctive exists.
- grounded_fact must read as a natural sentence a person would actually say ("KP Tech is a member of the VMA and part of the Cornerstone alliance"), NEVER a raw field name or key:value like "team_size_estimate: 15".
- Put that fact in grounded_fact, and the page URL it came from in grounded_fact_source_url (or null if unknown).
- If, and only if, there is genuinely no specific observed fact to anchor on (a thin, generic site), set grounded_fact to an empty string "", and write the email to ASK a question rather than assert anything. Never fabricate a fact to fill the gap; an ungrounded email will be flagged "do not send".

EMAIL STYLE: specific, brief, respectful of a busy senior partner's time. Open with a real greeting. If one person in the data is clearly the senior lead (a founder or managing partner), greet them by first name; otherwise greet the firm's team (e.g. "Hi Steinbeis team,"). Never use a name that isn't in the data, and never leave the greeting blank. Lead with the grounded fact. End with a soft ask for a short call/demo, then a simple sign-off ("Best,"). Do not invent a sender name or fake credentials. Do not over-claim.

PUNCTUATION, STRICT: never use an em dash or an en dash in any output field. Use a comma, a period or a colon instead. A cold email punctuated with em dashes reads as machine-written, and the recipient is an M&A partner who deletes machine-written email. Ordinary hyphens inside words ("sell-side", "mid-market") are fine.

Return ONLY the JSON object.`;

export async function generatePlay(extraction: Extraction, score: FitScore): Promise<PlayResult> {
  const facts = {
    name: extraction.name,
    one_liner: extraction.one_liner,
    cities: extraction.cities,
    services: extraction.services,
    sectors: extraction.sectors,
    team_size_estimate: extraction.team_size_estimate,
    tombstone_count: extraction.tombstone_count,
    tech_signals: extraction.tech_signals,
    people: extraction.people.map((p) => ({
      name: p.name,
      role: p.role,
      focus: p.focus,
      likely_priorities: p.likely_priorities,
    })),
    signals: extraction.signals,
    fit_band: score.band,
    fit_score: score.total,
  };

  const user = `Everything extracted about the firm (JSON). Ground the email in exactly one real fact from here:

${JSON.stringify(facts, null, 2)}`;

  return structuredCompletion<PlayResult>({
    system: SYSTEM_PROMPT,
    user,
    schemaName: "outbound_play",
    schema: PLAY_SCHEMA,
    temperature: 0.4,
  });
}
