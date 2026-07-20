/**
 * Deterministic prose clean-up on model output.
 *
 * The em dash is the loudest tell that a machine wrote something. The drafted
 * opening email is the most-read artefact this product makes, and it was
 * arriving with two or three em dashes in it, which is exactly the "obviously
 * AI" texture the whole pitch is trying to avoid. A firm that gets a cold email
 * punctuated like ChatGPT has already drawn a conclusion about the sender.
 *
 * The prompts now ask for no dashes, but a prompt is a request, not a
 * guarantee. Style rules the product depends on belong in code, the same way
 * `guardTechSignals` in ./index.ts refuses to trust the model's tech read
 * without literal evidence. This runs over every model-authored string on the
 * way out.
 *
 * Replacement rule: a comma, always.
 *
 * A period would read better in some places ("That's fair — Fintalo isn't…"),
 * but choosing between comma and period means guessing where a sentence ends,
 * and a wrong guess splits one sentence into two broken halves. A comma can at
 * worst produce a mild splice, which no reader will notice; an invented
 * sentence boundary is a visible error. Predictable beats clever here.
 *
 * Digit-flanked dashes are ranges ("2019–2024"), not punctuation, so they
 * become hyphens instead.
 */

const DASH_BETWEEN_DIGITS = /(\d)\s*[—–]\s*(\d)/g;
const DASH_AS_PUNCTUATION = /\s*[—–]\s*/g;
/** A dash directly after existing punctuation would leave ",," or ".," behind. */
const DOUBLED_PUNCTUATION = /([,.;:!?])\s*,/g;

/** Normalise one model-authored string. Safe to run twice. */
export function normalizeProse(value: string): string {
  return value
    .replace(DASH_BETWEEN_DIGITS, "$1-$2")
    .replace(DASH_AS_PUNCTUATION, ", ")
    .replace(DOUBLED_PUNCTUATION, "$1")
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

/**
 * Walk any JSON-shaped value and normalise every string in it. Used on whole
 * model responses so a new field added to a schema is covered by default rather
 * than being forgotten.
 */
export function normalizeProseDeep<T>(value: T): T {
  if (typeof value === "string") {
    return normalizeProse(value) as unknown as T;
  }
  if (Array.isArray(value)) {
    return value.map((item) => normalizeProseDeep(item)) as unknown as T;
  }
  if (value !== null && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      out[key] = normalizeProseDeep(item);
    }
    return out as unknown as T;
  }
  return value;
}
