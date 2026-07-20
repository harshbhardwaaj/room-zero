import { describe, expect, it } from "vitest";

import { normalizeProse, normalizeProseDeep } from "@/lib/pipeline/prose";

/**
 * This is the guard that stops the product's most-read artefact, the drafted
 * cold email, from arriving punctuated like a machine wrote it. The prompts ask
 * for the same thing, but a prompt is a request; this is the enforcement, so it
 * needs to actually hold.
 */

describe("normalizeProse", () => {
  it("replaces a spaced em dash with a comma", () => {
    expect(normalizeProse("That's fair — Fintalo isn't meant to replace judgment.")).toBe(
      "That's fair, Fintalo isn't meant to replace judgment.",
    );
  });

  it("replaces an unspaced em dash too", () => {
    expect(normalizeProse("exactly the point—Fintalo sits underneath")).toBe(
      "exactly the point, Fintalo sits underneath",
    );
  });

  it("handles en dashes the same way", () => {
    expect(normalizeProse("senior-led boutique – we don't want a heavy system")).toBe(
      "senior-led boutique, we don't want a heavy system",
    );
  });

  it("treats a dash between digits as a range, not punctuation", () => {
    expect(normalizeProse("active 2019–2024 across the region")).toBe(
      "active 2019-2024 across the region",
    );
    expect(normalizeProse("10 — 100 million euros")).toBe("10-100 million euros");
  });

  it("leaves ordinary hyphenated words alone", () => {
    const s = "sell-side and buy-side mid-market M&A";
    expect(normalizeProse(s)).toBe(s);
  });

  it("does not leave doubled punctuation behind", () => {
    expect(normalizeProse("Understood, — the goal is a short demo.")).toBe(
      "Understood, the goal is a short demo.",
    );
    expect(normalizeProse("Done. — Next up")).toBe("Done. Next up");
  });

  it("is idempotent, so running it twice cannot corrupt text", () => {
    const once = normalizeProse("A — B – C 2019–2024");
    expect(normalizeProse(once)).toBe(once);
  });

  it("leaves clean prose untouched", () => {
    const s = "I saw you are hiring an M&A Director in Munich.";
    expect(normalizeProse(s)).toBe(s);
  });
});

describe("normalizeProseDeep", () => {
  it("walks nested objects and arrays so a new schema field is covered by default", () => {
    const input = {
      angle: "Lead with the data room — it's the pain.",
      objections: [{ objection: "Too — heavy", counter: "Not — really" }],
      score: 62,
      flag: true,
      missing: null,
    };
    expect(normalizeProseDeep(input)).toEqual({
      angle: "Lead with the data room, it's the pain.",
      objections: [{ objection: "Too, heavy", counter: "Not, really" }],
      score: 62,
      flag: true,
      missing: null,
    });
  });

  it("preserves non-string values exactly", () => {
    const input = { n: 0, f: false, z: null, arr: [1, 2, 3] };
    expect(normalizeProseDeep(input)).toEqual(input);
  });
});
