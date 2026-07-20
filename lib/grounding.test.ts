import { describe, expect, it } from "vitest";

import { assessGrounding, isThinRead } from "@/lib/grounding";
import type { Room } from "@/types/room";

/**
 * The rule that stops a generic opener from being presented with the same
 * confidence as a real one. Worth pinning down, because the failure it guards
 * against is invisible: a thin room looks fine until someone checks whether the
 * "grounded fact" says anything about that firm specifically.
 */

function room(overrides: Partial<Room> = {}): Room {
  return {
    id: "test",
    firm: {
      name: "Test",
      url: "https://example.com",
      oneLiner: "A firm.",
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
    },
    people: [],
    signals: [],
    play: {
      angle: "",
      objections: [],
      openingEmail: { subject: "s", body: "b", groundedFact: "A specific fact." },
    },
    score: { total: 50, band: "promising", components: [] },
    status: "new",
    generatedAt: "2026-07-18T00:00:00.000Z",
    sources: ["https://example.com/a", "https://example.com/b", "https://example.com/c"],
    unverified: [],
    ...overrides,
  };
}

const partner = {
  name: "A Partner",
  role: "Partner",
  footprint: [],
  likelyPriorities: [],
  provenance: { sourceUrl: "https://example.com", verified: true },
};

describe("assessGrounding", () => {
  it("reports ungrounded when the pipeline produced no fact at all", () => {
    const r = room({
      play: { angle: "", objections: [], openingEmail: { subject: "s", body: "b", groundedFact: "" } },
    });
    expect(assessGrounding(r).level).toBe("ungrounded");
  });

  it("reports grounded when there was a real evidence base behind the fact", () => {
    const r = room({ people: [partner], signals: [{ type: "new_hire", title: "A hire" }] });
    const result = assessGrounding(r);
    expect(result.level).toBe("grounded");
    expect(result.reasons).toEqual([]);
  });

  it("flags a thin read when barely any pages could be fetched", () => {
    const r = room({ sources: ["https://example.com/only"] });
    const result = assessGrounding(r);
    expect(result.level).toBe("thin");
    expect(result.reasons.join(" ")).toMatch(/one public page/i);
  });

  it("flags a thin read when there is no person and no dated signal to anchor on", () => {
    const r = room({ people: [], signals: [] });
    const result = assessGrounding(r);
    expect(result.level).toBe("thin");
    expect(result.reasons.join(" ")).toMatch(/decision-maker/i);
  });

  it("does not flag a room that has people even if it has no signals", () => {
    expect(assessGrounding(room({ people: [partner], signals: [] })).level).toBe("grounded");
  });

  it("gives every reason at once rather than stopping at the first", () => {
    const r = room({ sources: ["https://example.com/only"], people: [], signals: [] });
    expect(assessGrounding(r).reasons).toHaveLength(2);
  });

  it("an ungrounded room is never also reported as thin", () => {
    const r = room({
      sources: [],
      play: { angle: "", objections: [], openingEmail: { subject: "", body: "", groundedFact: "" } },
    });
    expect(assessGrounding(r).level).toBe("ungrounded");
    expect(isThinRead(r)).toBe(false);
  });
});
