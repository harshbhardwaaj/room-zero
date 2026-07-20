import type { Room } from "@/types/room";

/**
 * How much the drafted email is actually standing on.
 *
 * There is a failure mode this product has to own out loud. When a firm's site
 * is thin, or is a JS-rendered page the fetcher can only read one screen of,
 * the model still returns a grounded_fact, because a true-but-obvious sentence
 * feels safer to it than admitting there is nothing distinctive. The result is
 * an email opening with "I saw that you focus on M&A advisory for the
 * Mittelstand", which is true of literally every firm on the target list.
 *
 * That is worse than a blank. The whole promise is one *specific, observed*
 * fact, so a generic opener quietly breaks the promise while looking like it
 * kept it. The prompt already asks the model to return an empty fact in that
 * case and ask a question instead; it does not reliably comply, and a rule the
 * product depends on cannot live only in a prompt.
 *
 * So the judgement is made here, deterministically, from what the pipeline
 * actually managed to read. Not from the wording of the fact: judging prose for
 * "genericness" by keyword would be guesswork, and in German, where every noun
 * is capitalised, even proper-noun detection is unreliable. What is objective
 * is the size of the evidence base underneath the fact.
 *
 * A room is a thin read when the pipeline had almost nothing to work from:
 * fewer than three public pages, or no decision-makers *and* no dated signal.
 * Anything drafted on that footing gets shown as needing a human pass before
 * sending, with the specific gaps named.
 */

const MIN_SOURCES_FOR_CONFIDENCE = 3;

export type GroundingLevel = "grounded" | "thin" | "ungrounded";

export type GroundingAssessment = {
  level: GroundingLevel;
  /** Plain-language gaps, safe to render directly. Empty when fully grounded. */
  reasons: string[];
};

export function assessGrounding(room: Room): GroundingAssessment {
  if (!room.play.openingEmail.groundedFact) {
    return { level: "ungrounded", reasons: [] };
  }

  const reasons: string[] = [];

  if (room.sources.length < MIN_SOURCES_FOR_CONFIDENCE) {
    reasons.push(
      room.sources.length === 1
        ? "Only one public page could be read, so there was little to choose a distinctive fact from."
        : `Only ${room.sources.length} public pages could be read, so there was little to choose a distinctive fact from.`,
    );
  }

  if (room.people.length === 0 && room.signals.length === 0) {
    reasons.push(
      "No named decision-maker and no dated why-now signal were found, which are the two things that usually make an opener specific.",
    );
  }

  return reasons.length > 0
    ? { level: "thin", reasons }
    : { level: "grounded", reasons: [] };
}

/** Index-list version: the summary shape doesn't carry sources or people, so
 * the same judgement is precomputed onto the summary at read time. */
export function isThinRead(room: Room): boolean {
  return assessGrounding(room).level === "thin";
}
