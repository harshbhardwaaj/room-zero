# Room Zero

An outbound sales-intelligence prototype, built by Harsh Bhardwaj for **Fintalo**, the AI-native M&A operating system.

Fintalo sells *deal rooms* for M&A transactions. Room Zero borrows that mental model and turns it inward on Fintalo's own go-to-market: every M&A boutique worth winning as a customer gets an auto-generated deal room, for the deal that comes before all of theirs, **winning the customer**.

Point it at a firm's website. It reads their public pages, scores the fit with a transparent formula, surfaces the people who would make the buying call and the why-now signals, and drafts an opening email grounded in **one real, observed fact**. Every claim traces to a page. Anything it cannot source, it flags rather than invents.

## A note on the data

The rooms in `data/rooms/generated/` name real people at real firms. Everything in them was read from a company's own public website — the team page, a press release, a transaction note — and nothing was taken from LinkedIn, a login wall, or a purchased list. Fields the pipeline could not source it flags rather than fills, and `likelyPriorities` is labelled as inference on the page, not presented as fact.

That is the right standard for outbound, and it is still not the same as consent. This repository is a work sample rather than a product, the deployed build is `noindex` so these pages stay out of search results, and any individual or firm named here who would rather not be can have their room removed on request.

## Status

**23 live pipeline runs against real M&A boutiques** across Germany, Austria and Switzerland, committed in `data/rooms/generated/`, plus 3 hand-authored fixtures that are labelled as such in the UI. 15 promising, 6 long shots, 2 strong fits.

Extracted claims were spot-checked against the live sites: Zerbach & Company (city, both directors, 65 transactions, the MBS Logistics deal), ARTHOS (Munich, 150 transactions, exactly two named Managing Partners) and MCF (80+ professionals, 1,200+ transactions, the 2023 leadership change, all six offices) all verified exactly. No invented facts found.

## What a room contains

- **Firm intel.** Team size, cities, services, sectors, deal count, and a tech-maturity read: does the site describe an email/Excel process, mention a data room, or run a client portal?
- **The people who decide.** The two or three senior partners, their *public professional footprint only* (talks, interviews, bylines, on-the-record quotes), and what each likely cares about, labelled as inference.
- **A why-now timeline.** Dated events (new mandate, new hire, site relaunch, press) that make outreach timely.
- **The play.** A recommended angle, likely objections with counters, and a drafted opening email built on one observed fact.
- **A fit score.** One number from a readable weighted formula (`lib/scoring.ts`), never assigned by the model.
- **Status.** Not contacted, contacted, replied, demo booked.

There is no chatbot. The interface is the rooms themselves, plus one input to generate a new room from a firm URL.

## The three rules the product actually enforces

These are enforced in code, not just asked for in a prompt. A rule a product depends on cannot live only in a prompt.

**1. Public data, or flagged.** Person data is limited to public professional footprint. No private or personal data, no LinkedIn, no login-walled sources. This is in the extraction schema (there is nowhere to put private data) and in the prompts. Any field the pipeline cannot source lands in the room's **"Flagged, not invented"** panel, because a hallucinated fact about a firm you are about to email is worse than a blank field.

**2. A tech signal must survive its own evidence.** `guardTechSignals` in `lib/pipeline/index.ts` drops any signal whose evidence quote does not literally contain the wording that defines it. The model tends to read "we handle every transaction personally" as an email-based process; that flag carries the most score weight, so a false positive would put a wrong claim in front of a real firm. Every drop is surfaced in the room.

**3. A weak opener is labelled weak.** `lib/grounding.ts` judges how much evidence the drafted email is actually standing on. When the pipeline could read almost nothing, the model still returns a technically-true fact ("they focus on M&A for the Mittelstand"), which is true of every firm on the list. That is worse than a blank, because it breaks the one promise while looking like it kept it. Those rooms render as a **thin read** with the specific gaps named.

## The pipeline (`lib/pipeline/`)

`fetch → extract → score → play`. Deterministic where it can be, the model only where it must be.

1. **Fetch** (`fetch.ts`). Public pages (home, team, transactions, services), discovered from homepage links, `sitemap.xml`, and a few common paths as a fallback for JS-rendered sites. One request at a time, a real user-agent, a polite delay, and every page cached to disk so prompt iteration never re-hits the firm's server.
2. **Extract** (`extract.ts`). One OpenAI call (`gpt-5.4-mini`, Structured Outputs, `temperature: 0`) turns the pages into a strict JSON schema. Unknowns come back `null`, not guessed.
3. **Guard and score** (`index.ts`, `scoring.ts`). The tech-signal guard runs, then a transparent weighted formula produces the fit score.
4. **Play** (`play.ts`). A second OpenAI call writes the angle, objections and opening email, grounded in exactly one real extracted fact. If there is no such fact, the email is marked "do not send" rather than fabricated.

Model output passes through `prose.ts` on the way out, which strips em and en dashes deterministically. The prompts ask for this too, but a prompt is a request, and the drafted cold email is the most-read thing this product makes.

## Project layout

```
app/                    routes; error.tsx and not-found.tsx are branded, not framework defaults
  api/generate-room/    the only server endpoint
components/
  narrative/            the pitch pages (opening, problem, answer, how-it-works, proof)
  product/              the product itself (room index, room detail, generator, fit ring)
  ui/                   shadcn primitives actually in use
lib/
  pipeline/             fetch, extract, score, play, prose
  scoring.ts            the fit formula, pure and tested
  grounding.ts          thin-read judgement, pure and tested
  brand.ts              which build this is, and all its copy
  features.ts           what a deployed build turns off, and why
  session-rooms.ts      browser-side holding pen for live-generated rooms
data/
  rooms/samples.ts      3 hand-authored fixtures, flagged isSample
  rooms/generated/      23 real pipeline runs, version-controlled
docs/
  design-principles.md  the UX and copy rules this repo is held to
  UI-SWEEP-LOG.md       the full change history, sweep by sweep
```

Generated rooms live in `data/`, not `.cache/`, on purpose. `.cache/html/` is disposable (tens of MB, re-fetchable). The rooms are content: they cost real API calls and they are what a reviewer comes here to read.

## Local development

```bash
npm install
echo "OPENAI_API_KEY=sk-..." > .env.local
echo "NEXT_PUBLIC_BRAND=fintalo" >> .env.local   # omit for the neutral/public build
npm run dev            # http://localhost:3000
```

Every page and every committed room works without an API key. Only generating a *new* room from a URL calls OpenAI.

### Checks

```bash
npm run typecheck
npm run lint
npm test          # 35 tests over the deterministic core
npm run build
```

Do not run `npm run build` while `npm run dev` is live on the same directory: the build overwrites `.next` underneath the dev server and every route starts returning 500. Stop the dev server, or clear `.next` and restart it.

## Brand builds

One codebase, two skins, chosen at build time by `NEXT_PUBLIC_BRAND` (`lib/brand.ts`):

- `fintalo`: the private link addressed to Fintalo. Their navy palette, their wordmark as the hero salutation. The byline stays Harsh's.
- unset or `neutral`: the public "Room Zero" build, its own indigo palette, addressed to nobody. This is the default on purpose, so a missing or misspelt env var fails safe to a build that never wore someone else's colours.

## Known limits

- **Fully client-rendered sites cannot be read.** `hansenadvisory.de` returns a 60-character shell on every page, so its room is built from one page and is correctly marked a thin read. A headless browser would fix this; a server-side fetch cannot.
- **Writing rooms needs a writable filesystem.** `saveRoom` writes to `data/rooms/generated/`. Most serverless hosts are read-only, so on a deployed build the 23 committed rooms read fine but generating a *new* one cannot persist. The write failure is caught and logged rather than thrown, so the pipeline still returns the room — but the client then navigates to `/rooms/<id>`, which reads from disk, finds nothing and 404s. The visible result is a minute of work and two paid model calls ending on a not-found page, which is why live generation is off by default on deployed builds (`NEXT_PUBLIC_ENABLE_ROOM_GENERATION`, see `lib/features.ts`). Making it work on serverless means moving the store to object storage or a database.
- **Scores move between runs.** The formula is deterministic given an extraction, but the extraction depends on which pages the fetcher reached, so better coverage can move a score in either direction. Every room shows the pages it read.
