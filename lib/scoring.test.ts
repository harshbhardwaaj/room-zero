import { describe, expect, it } from "vitest";

import { bandFor, scoreFirm, SCORE_WEIGHTS } from "@/lib/scoring";
import type { FirmIntel, Person, Signal } from "@/types/room";

/**
 * The pitch claims the score is a formula you can read rather than a number a
 * model assigned. That claim is only worth making if the formula is pinned
 * down, so these tests exist to make the claim checkable: same facts in, same
 * score out, and every band boundary stated once, here, in code.
 */

function firm(overrides: Partial<FirmIntel> = {}): FirmIntel {
  return {
    name: "Test Advisory",
    url: "https://example.com",
    oneLiner: "An advisory firm.",
    teamSizeEstimate: null,
    cities: [],
    services: [],
    sectors: [],
    tombstoneCount: null,
    techSignals: {
      processEmailBased: false,
      mentionsDataRoom: false,
      hasClientPortal: false,
      evidence: [],
    },
    fitNotes: [],
    provenance: { sourceUrl: "https://example.com", verified: true },
    ...overrides,
  };
}

function person(footprintCount = 0): Person {
  return {
    name: "A Partner",
    role: "Managing Partner",
    footprint: Array.from({ length: footprintCount }, (_, i) => ({
      kind: "quote" as const,
      title: `Item ${i}`,
      summary: "Summary",
    })),
    likelyPriorities: [],
    provenance: { sourceUrl: "https://example.com", verified: true },
  };
}

const signal: Signal = { type: "new_mandate", title: "A mandate" };

describe("bandFor", () => {
  it("puts the boundaries exactly where the UI claims they are", () => {
    expect(bandFor(100)).toBe("strong");
    expect(bandFor(70)).toBe("strong");
    expect(bandFor(69)).toBe("promising");
    expect(bandFor(45)).toBe("promising");
    expect(bandFor(44)).toBe("long_shot");
    expect(bandFor(0)).toBe("long_shot");
  });
});

describe("scoreFirm", () => {
  it("is deterministic: identical facts produce an identical score", () => {
    const a = scoreFirm(firm({ teamSizeEstimate: 12 }), [person(1)], [signal]);
    const b = scoreFirm(firm({ teamSizeEstimate: 12 }), [person(1)], [signal]);
    expect(a).toEqual(b);
  });

  it("never exceeds 100, and each component stays within its own max", () => {
    const maxed = scoreFirm(
      firm({
        teamSizeEstimate: 12,
        tombstoneCount: 500,
        services: ["Sell-side M&A"],
        techSignals: {
          processEmailBased: true,
          mentionsDataRoom: true,
          hasClientPortal: true,
          evidence: ["email"],
        },
      }),
      [person(1)],
      [signal],
    );
    expect(maxed.total).toBe(100);
    expect(maxed.band).toBe("strong");
    for (const component of maxed.components) {
      expect(component.points).toBeLessThanOrEqual(component.max);
      expect(component.points).toBeGreaterThanOrEqual(0);
    }
  });

  it("floors at a real number when nothing at all could be extracted", () => {
    const empty = scoreFirm(firm(), [], []);
    expect(empty.total).toBeGreaterThanOrEqual(0);
    expect(empty.total).toBeLessThan(45);
    expect(empty.band).toBe("long_shot");
  });

  it("weights the email/Excel process highest of the three tech signals", () => {
    const baseline = scoreFirm(firm(), [], []);
    const emailOnly = scoreFirm(
      firm({ techSignals: { processEmailBased: true, mentionsDataRoom: false, hasClientPortal: false, evidence: [] } }),
      [],
      [],
    );
    const dataRoomOnly = scoreFirm(
      firm({ techSignals: { processEmailBased: false, mentionsDataRoom: true, hasClientPortal: false, evidence: [] } }),
      [],
      [],
    );
    expect(emailOnly.total).toBeGreaterThan(baseline.total);
    expect(emailOnly.total).toBeGreaterThan(dataRoomOnly.total);
    expect(SCORE_WEIGHTS.techEmailBased).toBeGreaterThan(SCORE_WEIGHTS.techDataRoom);
  });
});

describe("firm-size band", () => {
  const sizeOf = (teamSizeEstimate: number | null) =>
    scoreFirm(firm({ teamSizeEstimate }), [], []).components.find((c) => c.key === "size")!;

  it("treats a solo advisor as solo, not as a large firm", () => {
    // Regression: the branch order tested 5-25, then 26-60, then 2-4, so 0 and 1
    // matched nothing and fell into the "larger firm" else, producing the line
    // "~1 people: a larger firm, so a longer, more committee-driven sale."
    const solo = sizeOf(1);
    expect(solo.rationale).not.toMatch(/larger firm/);
    expect(solo.rationale).not.toMatch(/1 people/);
    expect(solo.rationale).toMatch(/solo/i);
  });

  it("covers every size without a gap", () => {
    for (const n of [0, 1, 2, 4, 5, 25, 26, 60, 61, 500]) {
      const c = sizeOf(n);
      expect(c.points).toBeGreaterThan(0);
      expect(c.rationale.length).toBeGreaterThan(0);
    }
  });

  it("scores the boutique range highest, which is the whole targeting thesis", () => {
    expect(sizeOf(12).points).toBeGreaterThan(sizeOf(3).points);
    expect(sizeOf(12).points).toBeGreaterThan(sizeOf(40).points);
    expect(sizeOf(12).points).toBeGreaterThan(sizeOf(500).points);
    expect(sizeOf(12).points).toBe(SCORE_WEIGHTS.sizeFit);
  });

  it("scores an unstated team size below a known good one, never above", () => {
    expect(sizeOf(null).points).toBeLessThan(sizeOf(12).points);
  });
});
