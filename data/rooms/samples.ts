import { scoreFirm } from "@/lib/scoring";
import type { Person, Room, Signal } from "@/types/room";

/**
 * Hand-authored sample rooms (Phase 1). Shaped exactly like a real generated
 * room so the UI is designed against real-shaped data. Firms here are
 * illustrative composites, not live-verified, every sample room is flagged
 * `isSample` and the UI says so, so nobody mistakes a design fixture for
 * intel on a real firm. Scores are computed by the real scoreFirm() formula,
 * not hand-typed, so the numbers are honest even in the samples.
 *
 * The three cover the range the index needs to render: a strong fit, a
 * promising one, and a long shot whose thin, half-sourced profile exercises the
 * "flagged, not invented" path.
 */

function build(
  firm: Room["firm"],
  people: Person[],
  signals: Signal[],
  extra: Pick<Room, "id" | "play" | "status" | "generatedAt" | "sources" | "unverified">,
): Room {
  return {
    ...extra,
    firm,
    people,
    signals,
    score: scoreFirm(firm, people, signals),
    isSample: true,
  };
}

// ---------------------------------------------------------------------------
// 1. Vogt & Kellermann Corporate Finance, Munich. Strong fit: busy sell-side
//    Mittelstand advisor still running an email-and-phone process.
// ---------------------------------------------------------------------------
const vogtKellermann = build(
  {
    name: "Vogt & Kellermann Corporate Finance",
    url: "https://www.vogt-kellermann.de",
    oneLiner:
      "Independent M&A advisory for Mittelstand founders, sell-side mandates in industrials and software.",
    teamSizeEstimate: 18,
    cities: ["München", "Frankfurt"],
    services: ["Sell-side M&A", "Company succession (Nachfolge)", "Corporate finance", "Fairness opinions"],
    sectors: ["Industrials", "Software", "Business services"],
    tombstoneCount: 24,
    techSignals: {
      mentionsDataRoom: false,
      hasClientPortal: false,
      processEmailBased: true,
      evidence: [
        "Process page: “We coordinate every buyer conversation personally, by phone and email, so nothing is lost between rounds.”",
      ],
    },
    fitNotes: [
      "Runs a high-touch, email-and-phone process across many parallel buyer conversations, exactly the coordination overhead Fintalo removes.",
      "24 closed mandates: enough deal volume that a per-deal time saving compounds.",
      "No sign of a data room or deal platform anywhere on the site, greenfield.",
    ],
    provenance: { sourceUrl: "https://www.vogt-kellermann.de/prozess", verified: true },
  },
  [
    {
      name: "Dr. Katharina Vogt",
      role: "Managing Partner",
      focus: "Leads sell-side mandates in industrials and manufacturing.",
      footprint: [
        {
          kind: "interview",
          title: "“Succession is a trust problem before it is a price problem”",
          summary:
            "In a trade-press interview she argues that Mittelstand founders pick the advisor who protects the relationship with buyers, not the one who quotes the highest multiple.",
          sourceUrl: "https://www.finance-magazin.de/interview-vogt",
          date: "2025-11",
        },
        {
          kind: "panel",
          title: "M&A Forum Munich, panel on cross-border buyer processes",
          summary:
            "Spoke on keeping many international buyers moving in parallel without dropping any of them, the coordination problem her own process page describes.",
          date: "2026-03",
        },
      ],
      likelyPriorities: [
        "Protecting the founder relationship through a competitive process",
        "Being seen by clients as a modern, tech-forward advisor",
        "Winning pitches against larger banks without adding headcount",
      ],
      provenance: { sourceUrl: "https://www.vogt-kellermann.de/team", verified: true },
    },
    {
      name: "Stefan Kellermann",
      role: "Partner",
      focus: "Software and tech-enabled services.",
      footprint: [
        {
          kind: "article",
          title: "Byline: “What founders get wrong about carve-outs”",
          summary:
            "A published column on separating a software unit for sale, arguing the data burden is where processes stall.",
          sourceUrl: "https://www.vogt-kellermann.de/insights/carve-outs",
          date: "2025-09",
        },
      ],
      likelyPriorities: [
        "Faster turnaround on structured buyer outreach",
        "A cleaner audit trail across a process",
      ],
      provenance: { sourceUrl: "https://www.vogt-kellermann.de/team", verified: true },
    },
  ],
  [
    {
      type: "new_mandate",
      title: "New sell-side mandate: Bavarian factory-automation supplier",
      detail: "Announced on the firm's news page; buyer outreach described as “now underway”.",
      date: "2026-06",
      sourceUrl: "https://www.vogt-kellermann.de/news/automation-mandate",
    },
    {
      type: "new_hire",
      title: "Hired a former Big Four transaction-services director as Partner",
      detail: "Adds capacity precisely as deal load grows, a team feeling the coordination strain.",
      date: "2026-05",
      sourceUrl: "https://www.vogt-kellermann.de/news/new-partner",
    },
  ],
  {
    id: "vogt-kellermann-corporate-finance",
    status: "contacted",
    generatedAt: "2026-07-15T09:12:00.000Z",
    sources: [
      "https://www.vogt-kellermann.de",
      "https://www.vogt-kellermann.de/team",
      "https://www.vogt-kellermann.de/prozess",
      "https://www.vogt-kellermann.de/transaktionen",
      "https://www.vogt-kellermann.de/news",
    ],
    unverified: [],
    play: {
      angle:
        "Lead with the coordination pain their own process page admits to. They win on relationships and lose evenings to buyer-tracking; Fintalo keeps the relationship high-touch while taking the tracking off their desk. Do not pitch a “data room”, they don't have one and don't think they need one; pitch parallel-process control.",
      objections: [
        {
          objection: "“Our clients hire us for the personal touch, software gets in the way of that.”",
          counter:
            "The personal touch stays with the partner. Fintalo removes the part clients never see and never valued: chasing which of nine buyers got which document. More partner time on the call, less on the spreadsheet.",
        },
        {
          objection: "“We've managed fine on email for years.”",
          counter:
            "You have, at 24 mandates. The new partner just joined because that's getting hard to hold in one head. This is the moment a shared process view pays for itself, before the next mandate, not after a dropped thread.",
        },
      ],
      openingEmail: {
        subject: "The buyer thread you almost lost",
        body: "Hi Dr. Vogt,\n\nYour process page says you coordinate every buyer conversation personally, by phone and email, so nothing is lost between rounds. That line is the whole business, and it's also the part that gets heavier with every parallel buyer.\n\nFintalo keeps that personal coordination but gives your team one view of where every buyer stands, so the tracking stops living in inboxes. With the new automation mandate now in outreach and a partner just added, it felt like the right week to send this.\n\nWorth 20 minutes to show you what it looks like on a live parallel process?\n\nBest,\nHarsh",
        groundedFact:
          "Their process page states they coordinate every buyer conversation personally by phone and email.",
        groundedFactSourceUrl: "https://www.vogt-kellermann.de/prozess",
      },
    },
  },
);

// ---------------------------------------------------------------------------
// 2. Rheinwerk M&A, Cologne. Promising: a tech-focused boutique that already
//    runs data rooms (category-aware) but is a lighter dealmaker.
// ---------------------------------------------------------------------------
const rheinwerk = build(
  {
    name: "Rheinwerk M&A",
    url: "https://www.rheinwerk-ma.de",
    oneLiner:
      "Tech-focused M&A boutique advising software and digital-commerce founders on exits and growth rounds.",
    teamSizeEstimate: 9,
    cities: ["Köln", "Berlin"],
    services: ["Sell-side M&A", "Growth financing", "Buy-side advisory"],
    sectors: ["Software", "SaaS", "Digital commerce"],
    tombstoneCount: 7,
    techSignals: {
      mentionsDataRoom: true,
      hasClientPortal: false,
      processEmailBased: false,
      evidence: [
        "FAQ: “We set up a secure, permissioned data room for every mandate and manage access per buyer.”",
      ],
    },
    fitNotes: [
      "Already runs a data room per mandate, they understand the category, so the pitch is the AI-native workflow around it, not storage they already have.",
      "Software/SaaS focus means their founders expect modern tooling; a slick process is part of how they win pitches.",
      "Lighter deal count (7): the value case is winning more mandates, not just running current ones faster.",
    ],
    provenance: { sourceUrl: "https://www.rheinwerk-ma.de/faq", verified: true },
  },
  [
    {
      name: "Jonas Brandt",
      role: "Founding Partner",
      focus: "SaaS and digital-commerce exits.",
      footprint: [
        {
          kind: "podcast",
          title: "Guest on a German startup podcast, “When to sell a SaaS company”",
          summary:
            "Talked through timing an exit and why a tight, fast process signals a well-run company to buyers.",
          sourceUrl: "https://www.rheinwerk-ma.de/insights/podcast-saas",
          date: "2026-02",
        },
      ],
      likelyPriorities: [
        "Running a visibly modern process that impresses founder-clients",
        "Closing more mandates without growing the team",
      ],
      provenance: { sourceUrl: "https://www.rheinwerk-ma.de/team", verified: true },
    },
    {
      name: "Marie Löwen",
      role: "Partner",
      focus: "Growth financing and buy-side.",
      footprint: [],
      likelyPriorities: [
        "Tooling that a small team can adopt without a big rollout",
      ],
      provenance: {
        sourceUrl: "https://www.rheinwerk-ma.de/team",
        verified: true,
        note: "Role sourced from team page; no public footprint found beyond it.",
      },
    },
  ],
  [
    {
      type: "content",
      title: "Published a “2026 SaaS exit multiples” note",
      detail: "A fresh piece of thought-leadership, a warm hook to reference and a sign they invest in being seen as modern.",
      date: "2026-06",
      sourceUrl: "https://www.rheinwerk-ma.de/insights/saas-multiples-2026",
    },
  ],
  {
    id: "rheinwerk-ma",
    status: "new",
    generatedAt: "2026-07-16T14:03:00.000Z",
    sources: [
      "https://www.rheinwerk-ma.de",
      "https://www.rheinwerk-ma.de/team",
      "https://www.rheinwerk-ma.de/faq",
      "https://www.rheinwerk-ma.de/insights",
    ],
    unverified: [],
    play: {
      angle:
        "They already run data rooms, so don't sell them a data room. Sell the layer above it: an AI-native process that makes a nine-person team look like a much bigger one to the founders they pitch. Anchor on their own “modern process” positioning.",
      objections: [
        {
          objection: "“We already have a data room and it works fine.”",
          counter:
            "Storage isn't the gap, the gap is everything around it: buyer tracking, follow-ups, status. Fintalo sits on top of the room you already run, so it's an upgrade to your process, not a rip-and-replace.",
        },
        {
          objection: "“We're only nine people, is this overkill?”",
          counter:
            "It's the opposite. Nine people is exactly who benefits: the tool does the coordination a bigger firm hires analysts for, so you win mandates you'd otherwise be too lean to run well.",
        },
      ],
      openingEmail: {
        subject: "The layer above your data room",
        body: "Hi Jonas,\n\nYour FAQ says you set up a permissioned data room for every mandate, so you already sell founders on a modern process. Nice foundation.\n\nFintalo is the layer above it: buyer tracking, follow-ups and live status across a process, so nine people can run it like ninety. Given your SaaS founder-clients expect exactly that kind of tooling, it might be an easy story to tell in a pitch.\n\nOpen to a short look?\n\nBest,\nHarsh",
        groundedFact:
          "Their FAQ states they set up a secure, permissioned data room for every mandate.",
        groundedFactSourceUrl: "https://www.rheinwerk-ma.de/faq",
      },
    },
  },
);

// ---------------------------------------------------------------------------
// 3. Nordlicht Advisory, Hamburg. Long shot: thin public footprint, M&A not
//    central. This room is deliberately half-sourced, to show the product
//    flagging gaps rather than padding them.
// ---------------------------------------------------------------------------
const nordlicht = build(
  {
    name: "Nordlicht Advisory",
    url: "https://www.nordlicht-advisory.de",
    oneLiner:
      "Boutique corporate-finance advisory for owner-managed businesses in Northern Germany.",
    teamSizeEstimate: null,
    cities: ["Hamburg"],
    services: ["Corporate finance", "Debt advisory", "Business valuation"],
    sectors: ["Mittelstand", "Family businesses"],
    tombstoneCount: 3,
    techSignals: {
      mentionsDataRoom: false,
      hasClientPortal: false,
      processEmailBased: false,
      evidence: [],
    },
    fitNotes: [
      "Debt advisory and valuations lead the offering; M&A is a smaller line, a softer fit than a dedicated sell-side shop.",
      "Very little public process or deal detail to work from. This room is thin on purpose; the gaps are flagged below rather than filled with guesses.",
    ],
    provenance: {
      sourceUrl: "https://www.nordlicht-advisory.de/leistungen",
      verified: true,
      note: "Services sourced from the site; much else is simply not published.",
    },
  },
  [
    {
      name: "Henning Petersen",
      role: "Partner (named on team page)",
      focus: undefined,
      footprint: [],
      likelyPriorities: [
        "Inference only, no public footprint found. Likely cares about local reputation and repeat referrals, but this is not sourced.",
      ],
      provenance: {
        sourceUrl: "https://www.nordlicht-advisory.de/team",
        verified: true,
        note: "Name and role are on the team page; nothing else about him is public.",
      },
    },
  ],
  [],
  {
    id: "nordlicht-advisory",
    status: "new",
    generatedAt: "2026-07-17T10:41:00.000Z",
    sources: [
      "https://www.nordlicht-advisory.de",
      "https://www.nordlicht-advisory.de/leistungen",
      "https://www.nordlicht-advisory.de/team",
    ],
    unverified: [
      "team_size_estimate, headcount is not stated anywhere on the site",
      "tombstone_count, only 3 references found; likely undercounts, treat as a floor",
      "why-now signals, nothing dated in the last 12 months was found",
      "H. Petersen's priorities, no public footprint; the one line shown is labelled as inference, not fact",
    ],
    play: {
      angle:
        "Low priority, and the room says so. If worked at all, keep it light: they're a debt/valuation shop that does some M&A, so a generic M&A pitch will miss. Any outreach should ask a question rather than assert a fact, because there isn't a strong observed one to anchor on.",
      objections: [
        {
          objection: "“We're not really an M&A shop.”",
          counter:
            "Fair, and that's why this isn't a hard pitch. If sell-side is a growing line for you, worth a look; if it isn't, no worries and no follow-up.",
        },
      ],
      openingEmail: {
        subject: "Is sell-side a growing line for Nordlicht?",
        body: "Hi Henning,\n\nYour site leads with debt advisory and valuations for owner-managed businesses in Northern Germany, with M&A as one line among them. I'll be honest: I couldn't tell from the outside how big a part of the practice sell-side is.\n\nIf it's growing, Fintalo might be worth a short look. If it isn't, ignore this and I won't chase.\n\nBest,\nHarsh",
        groundedFact:
          "Their site leads with debt advisory and valuations for owner-managed businesses; M&A is one line among several.",
        groundedFactSourceUrl: "https://www.nordlicht-advisory.de/leistungen",
      },
    },
  },
);

export const SAMPLE_ROOMS: Room[] = [vogtKellermann, rheinwerk, nordlicht];
