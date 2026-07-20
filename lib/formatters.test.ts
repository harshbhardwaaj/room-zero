import { describe, expect, it } from "vitest";

import { formatDate, hostFromUrl, pathLabelFromUrl } from "@/lib/formatters";

describe("hostFromUrl", () => {
  it("strips the www prefix", () => {
    expect(hostFromUrl("https://www.saxenhammer-co.com/en/")).toBe("saxenhammer-co.com");
  });

  it("returns the input unchanged when it isn't a URL, rather than throwing", () => {
    expect(hostFromUrl("not a url")).toBe("not a url");
  });
});

describe("pathLabelFromUrl", () => {
  it("labels the root as a home page rather than a bare slash", () => {
    expect(pathLabelFromUrl("https://example.com/")).toBe("Home page");
    expect(pathLabelFromUrl("https://example.com")).toBe("Home page");
  });

  it("gives each page of one site a distinguishable label", () => {
    // The reason this exists: the sources panel labelled every entry by host,
    // so a room built from five pages of one site printed the same string five
    // times over.
    const urls = [
      "https://saxenhammer-co.com/en/",
      "https://saxenhammer-co.com/en/about-us/",
      "https://saxenhammer-co.com/en/transactions/",
    ];
    const labels = urls.map(pathLabelFromUrl);
    expect(new Set(labels).size).toBe(urls.length);
    expect(labels).toContain("/en/about-us");
  });

  it("decodes escaped characters so a German path stays readable", () => {
    expect(pathLabelFromUrl("https://example.com/%C3%BCber-uns")).toBe("/über-uns");
  });

  it("falls back to the raw value on malformed input", () => {
    expect(pathLabelFromUrl("::::")).toBe("::::");
  });
});

describe("formatDate", () => {
  it("formats a real ISO timestamp", () => {
    expect(formatDate("2026-07-18T00:00:00.000Z")).toMatch(/2026/);
  });

  it("never invents a precise day out of a vague one", () => {
    // Regression: `new Date("spring 2025")` parses in V8 and yields 1 Jan 2025,
    // so this used to render "Jan 1, 2025" for a date the source never stated.
    // A confident wrong date is indistinguishable from a right one, which makes
    // it exactly the kind of quiet fabrication the product promises not to do.
    expect(formatDate("spring 2025")).toBe("spring 2025");
    expect(formatDate("2024")).toBe("2024");
    expect(formatDate("2026-05")).toBe("2026-05");
    expect(formatDate("Q3 2025")).toBe("Q3 2025");
  });

  it("still formats a genuine full date", () => {
    expect(formatDate("2024-06-03")).toBe("Jun 3, 2024");
  });
});
