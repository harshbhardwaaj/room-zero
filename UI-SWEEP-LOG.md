# UI sweep log

Page-by-page pass to remove the AI-generated feel and the OrderMatch Lab leftovers.
Backup of the pre-sweep state: `../Fintalo-BACKUP-pre-ui-sweep/`.

Rules followed, from OrderMatch Lab's own design docs (they were never copied into
this repo, so I read them in place):

- `docs/design-system/copy-principles.md`: banned words, and **no em dashes or en
  dashes anywhere in product copy**. This was the single loudest AI tell in the build.
- `docs/design-system/visual-direction.md`: anti-patterns: decorative blobs, oversized
  marketing sections after the opening, hidden uncertainty, blank empty states.
- `docs/design-system/component-rules.md`: page sections are not floating cards, no
  cards inside cards, every section owns its loading / error / empty / partial state.
- `docs/ux-product-playbook.md`: required screen states, error copy formula.

Decisions taken from Harsh before starting:

1. **Fintalo-addressed build is canonical.** Private link, their palette, their
   wordmark as addressee. The neutral build stays functional as the safe fallback
   but is not the thing being optimised.
2. **Fabricated content is a liability.** The audience is Marius. Invented firms do
   not impress him; a prototype that visibly solved a real problem does. Real
   pipeline-verified firms lead, fixtures are unmistakably labelled or cut.
3. **Keep one moment of personality per surface.** The landing page needs something
   that makes him smile, because a reader who is enjoying himself keeps clicking.
   It does not have to be the floating chip, but the charm has to survive. Do not
   overdo it.

---

## 1. Landing page (`/`)

**Purpose of this page:** be a door, not a summary. One clear thing to do inside
two seconds.

**Cut**

- **The status line** under the CTA ("Same discipline your product runs on: real
  sources, audit trail, no guesses"). It restated the subtitle's closing claim in
  different words, with a pulsing green dot pulling the eye away from the button
  directly above it. Two integrity claims stacked is one too many.
- **`hero.statusLine`** removed from the `Brand` type and both brand objects, so
  there is no dead config left behind.
- **`hero-chip-swap`, `hero-chip-swap-alt`, `hero-dot` keyframes** in `globals.css`,
  now unused.
- Two of the three running animations. Halo pulse on the CTA stays because it points
  at the action. The rest was motion for its own sake.

**Fixed: the hero was inventing a firm**

The floating chip read `VOGT & KELLERMANN · MÜNCHEN · FIT 80` over a quote. Vogt &
Kellermann does not exist; it is a hand-authored fixture. On a page whose entire
promise is *every claim traceable, nothing invented*, the first viewport was
displaying a fabricated firm and a fabricated score as though they were output.
That is the one thing this product cannot be caught doing.

Replaced with a before/after that is both the joke and the thesis:

    ⊗  Hi {{first_name}}, hope this finds you well!      (struck through)
    ⊙  Saw Clairfield made you an official partner. Congratulations.
       READ FROM SAXENHAMMER-CO.COM

The merge-tag failure is a joke anyone who has ever done outbound gets instantly, so
the personality survives. The second line is a **real grounded fact from a real room
the pipeline actually built** (`data/rooms/generated/saxenhammer-co-com.json`), with
its real source, so the charm doubles as proof instead of undermining it.

**Copy**

- Killed every em dash in the hero.
- Headline was three long lines with an em dash hanging off line two. Now three short
  lines, each surviving on one line at the clamp size: *"You sell deal rooms for M&A. /
  So I built the one that comes first. / The room for winning each customer."* First
  attempt at two lines left "for" stranded at the start of a wrapped line, which reads
  as an accident; documented the constraint on the `headlineMid` field so it does not
  regress.
- Subtitle cut from three lines to two, and from two claims to one.

**Verified at 1440x900:** light and dark, no console errors, no horizontal overflow,
everything above the fold with the CTA centred in the viewport.

**One thing checked and cleared:** clicking the hero CTA with the automation tool did
not navigate, which looked like a broken primary action. It is not. A native
`element.click()` navigates to `/problem` correctly, `startViewTransition` is present,
and reduced-motion is off. The synthetic mouse event simply is not reaching React's
handler in this harness. `TransitionLink` is fine and needs no change.

---

## 2. The case (`/problem`)

**Purpose of this page:** land one insight, and earn the next click.

**Cut**

- **Headline line two** ("There are hundreds of them, and they ignore generic
  outreach"). The three cards directly beneath it said the same thing more
  specifically: card one *is* the count, card two *is* the template problem. The
  headline was the cards, said first and vaguer.
- **The lead-in paragraph** ("Research that lands doesn't scale by hand, so it
  usually doesn't happen…"). That was the same two cards a third time.

Between them, those two cuts were why the CTA sat below the fold: the page had thin
content set at display size and repeated three ways.

**Fixed**

- Headline clamp dropped from `3rem` max to `2.25rem`. At 1440 the old size ran the
  h1 across ~1300px of unconstrained width, which is what made a two-sentence page
  feel like a wall.
- Section constrained with `measure-full` + `mx-auto` instead of running full-bleed
  from `px-[5vw]`.
- `text-balance` on the accent line and the pivot line. Without it the wrap left
  "knew them." and "generic." orphaned on their own lines, which reads as an accident
  rather than a choice.
- Em dashes gone from all three cards.

**Result at 1440x900:** whole page fits, CTA sits at y≈790 with room to spare.

---

## 3. The answer (`/answer`)

**Purpose of this page:** show what is actually inside a room.

This page has genuinely earned content (five layers plus the integrity rule), so the
compression target was whitespace and repetition, not substance.

**Cut**

- **The intro paragraph.** On the Fintalo build it re-explained the deal-room analogy
  ("you give your customers deal rooms… this turns it on your own go-to-market"),
  which is already the landing page's *headline*. Reading the same idea twice within
  three clicks is what makes a pitch feel padded. Replaced with one short orienting
  line: "Five things per firm, in the order you'd actually use them."
- The now-unused `brand` import.

**Fixed**

- **The orphaned fifth card.** Five cards in a two-column grid left the fit score
  stranded alone in the left column. It now spans the full width via a `wide` flag,
  which is also semantically right: the score is *derived from* the four above it, not
  a fifth peer.
- Headline matched to `/problem` at `2.25rem` max, with `text-balance`.
- Em dashes gone from all five cards and the trust panel.
- Spacing `gap-8`/`py-16` → `gap-5`/`py-12`. The CTA was 84px under the fold; this
  brought it on screen. Whitespace gave way rather than content, which is the right
  order.

**Result at 1440x900:** page height 1048px → ~900px, CTA visible without scrolling.

**Honest caveat:** "above the fold" here means a 900px-tall viewport. A real MacBook
with browser chrome is nearer 780-800px, where this page will still scroll slightly.
That is the acceptable case: the content genuinely needs the room, and it is now
compressed as far as it goes without gutting it.

---

## 4 and 5. The rooms (`/rooms`) and a room (`/rooms/[firmId]`)

**Purpose of these pages:** be the evidence. Everything before them is a claim.

### The biggest change: real runs now lead

The index sorted by fit score, and the highest score in the set (80) belonged to
**Vogt & Kellermann, a firm that does not exist**. So the first room anyone opened
was a hand-authored fixture. Meanwhile the four rooms the pipeline genuinely produced
against real German boutiques (Steinbeis, Saxenhammer, KP Tech, Taurus) sat below the
fold, scoring 65, 59, 55 and 43.

That is the wrong way round for the audience. What is impressive is not a high number,
it is *that this ran against real firms and reported honestly on them*, including
scoring one of them a 43. A fabricated 80 is not evidence of anything.

- Live rooms now outrank fixtures in **both** sort modes, before fit or recency is
  considered.
- Header copy replaced. It said "7 rooms · 1 scored a strong fit", a statistic about
  the sample set. It now says what was actually done: **"4 live runs against real
  German boutiques, built from their public pages, plus 3 labelled design fixtures."**
  That sentence is verifiable, and the willingness to label the fixtures is itself
  part of the pitch.
- Fixtures kept rather than deleted: they still show the ideal shape of a room, and
  every one already carries `isSample` plus a banner. The problem was never that they
  existed, it was that they were leading.

### The em dash problem went deeper than the UI

The pipeline's **own output** was full of them: 47 across the four cached rooms,
including inside the drafted opening emails, which are the single most-read thing this
product makes. An M&A partner receiving a cold email punctuated like ChatGPT has
already drawn a conclusion about the sender. This was the AI tell living in the
product's core deliverable, not just its marketing copy.

Three fixes, in order of reliability:

1. **`lib/pipeline/prose.ts`** (new). A deterministic normaliser run over every
   model-authored string on the way out of both LLM passes. Same philosophy as the
   existing `guardTechSignals`: the model's output is not trusted, it is checked. Rule
   is a comma, always, because choosing between comma and period means guessing where
   a sentence ends and a wrong guess invents a sentence boundary. Digit-flanked dashes
   are ranges, so they become hyphens.
2. **Both prompts** now ban em and en dashes explicitly. Worth noting: the system
   prompts were themselves written full of em dashes, which was almost certainly
   teaching the model the style it was then reproducing. Those are cleaned too.
3. **The four cached rooms** were normalised in place, since they cannot be
   regenerated without a live API call.

`lib/scoring.ts` rationales were also dash-ridden and are deterministic strings, so
they were rewritten by hand to use colons, which suit a "fact: interpretation" line
better than a comma ("450+ tombstones: a busy, active dealmaker").

**Verified:** every route now renders **zero** em or en dashes. Code comments were
left alone, per copy-principles, which scopes the ban to reviewer-facing text.

### Layout and honesty bugs found while looking

- **Stat row blowout.** "Sectors" sat in a four-up stat grid, and Saxenhammer lists
  nine sectors. Grid items stretch, so one long cell turned Team size, Deals shown and
  Cities into tall empty boxes. Sectors is a list, not a scalar, so it now renders as
  a labelled chip row next to Services, and the stat row is three-up.
- **The Sources panel was useless.** It labelled every source by host, so a room built
  from five different pages of one site showed "saxenhammer-co.com" five times. A
  provenance list you cannot tell apart is not provenance. Now: host once, then the
  page path per line (`/en/about-us`, `/en/transactions`, …). New `pathLabelFromUrl`
  in `lib/formatters.ts`.
- **Theme-blind status colours.** Nine places used literal `amber-50` / `emerald-50`,
  which do not know what theme they are in. On dark, the "Flagged, not invented" panel
  rendered as a bright yellow slab. Since flagging uncertainty *is* this product's
  integrity claim, that panel has to look deliberate in both themes. Added semantic
  `--ft-warn-*` / `--ft-ok-*` tokens and replaced all nine.
- **Inconsistent empty values.** Half the stat row said "Not stated", half showed a
  bare dash, reading as two different kinds of missing. All "Not stated" now.
- Disabled "Open a room" button was a 50%-opacity accent, which reads as broken rather
  than inactive. It now drops to a neutral surface.
- Generator error message got `role="alert"`, per the playbook's accessibility rule.

**Verified:** typecheck and lint both clean; light and dark checked on the index, a
live room and a fixture room.

**Left alone, worth your call:** two people in the Saxenhammer room (Nicholas Hanser
and Martin Neumann) have an identical footprint entry, the same NOAH Conference line.
That is the extraction model duplicating a fact across two partners, not a UI problem,
so I did not paper over it in the view. It is arguably the honest output. Flagging it
because it is visible on the page a reviewer is most likely to read closely.

---

## 6. How it works (`/how-it-works`)

**Purpose of this page:** convince an engineer that the thing is actually built.

**Cut: two tables of contents on one screen**

The page had its own sticky step rail listing all six sections, sitting directly
beside the app nav, which renders those same six links as sub-items whenever "How it
works" is active. Two identical navigations, side by side, spending a 14rem column to
duplicate each other. The page rail is gone; the app nav already does this job.

With the rail gone, `max-w-6xl` left one narrow column stranded against the left edge
of a very wide page, so the main dropped to `max-w-3xl`: one centred column at reading
width, which is the honest shape for a documentation page.

**Fixed: the engineering page was illustrated with a firm that does not exist**

All three code samples used Vogt & Kellermann, the hand-authored fixture. On the page
whose entire job is "here is how this really works", every example was fake. They now
use real output from real runs: Saxenhammer's actual fetched URLs, and Saxenhammer's
actual grounded fact with its real source.

The extraction sample is the interesting one. It now shows **real Steinbeis output
where all three tech signals came back `false`**, with a new paragraph explaining why:
that is the deterministic guard refusing to let "we handle every transaction
personally" become "runs on email", because that flag carries the most score weight and
a false positive would put a wrong claim in front of a real firm. That is a much better
story than the fabricated `true` it replaced. It shows the system declining to
over-claim, which is the thing worth proving.

**Also:** steps count from 01 rather than 00. Starting a reader-facing list at zero is
a programmer's habit, not a reader's. Em dashes gone.

---

## 7. Why me (`/proof`)

- **Un-boxed the intro.** It was a bordered card sitting above a timeline, so two
  framing devices were arguing with each other on a page that is supposed to be easy
  to skim. Component rules are explicit: cards are for repeated items and framed
  tools, page sections are not floating cards. It is plain prose now.
- **Dropped "Scroll to go through it."** Telling a reader to scroll is an instruction
  the page does not need to give.
- Em dashes replaced with parentheses, which is what those clauses actually were.
- Checked the whole app against the copy-principles banned-word list (synergy,
  leverage-as-verb, passionate, showcase, cutting-edge, seamless, and the rest):
  **zero hits.**

**Checked, not a bug:** the timeline items animate in from `opacity-0` via
`IntersectionObserver`, and screenshots kept catching them mid-fade, which looked like
the page was rendering blank. Queried the live DOM: all four sit at opacity 1. The
reveal works, and it already falls back to visible when `IntersectionObserver` is
undefined and respects reduced motion.

---

## 8. Next step (`/contact`)

**The last page never actually asked for anything.** It opened with "Book a call,
email, or call directly, whichever is easiest", which is a menu of channels. Copy
principles are blunt about this: the final CTA should be direct, and "do not make the
ending timid or vague."

Added `brand.contactAsk`, shown at full size directly under the headline:

> I built this because I want to build the real version with your team. If the
> direction is useful, twenty minutes on a call is the quickest way to find out
> whether it fits.

The channel line survives, demoted to small print under it. Page is also vertically
centred now; it is short by design and was top-aligned in a full-height main, leaving
the bottom half of the screen empty.

---

## 9. The shell, and the states that did not exist

**Nav rail**

- Killed the **"MENU"** label. It told the reader what a menu is.
- Nav is **top-aligned under the wordmark** instead of vertically centred. Centring
  five items in a full-height rail left a ~250px gap between the mark and the first
  destination, which reads as a layout accident.
- A **hairline** now separates the collapse control from the destinations. The control
  is chrome, not a place you can go, and it was sitting in the same list as "Start"
  and "Why me" with a label of identical weight.

**404 and error pages, which did not exist at all**

A wrong URL fell through to Next.js's own default: an unstyled black page reading
"404". If this goes up as a private link, a stale or mistyped URL is the first thing
the recipient sees, and a raw framework page says the build is unfinished.

- `app/not-found.tsx`: in-shell, branded, says what happened and gives two ways out.
- `app/error.tsx`: route-level error boundary. Never shows a stack trace, keeps the
  error digest visible (an opaque id is useful in a bug report, a stack trace is not),
  and offers both retry and a way back.

**Deliberately not added: loading skeletons.** The playbook says no loader when a
result lands in under a second, and to avoid flashing spinners. Room reads are
sub-second disk reads. The one genuinely slow operation is room *generation* at 20-60s,
and that already has staged progress in `RoomGenerator`. Adding skeletons here would
have been decoration that makes the app feel slower than it is.

---

## Final verification

- `tsc --noEmit`: clean. `eslint .`: clean. `next build`: succeeds, 9 routes.
- Every route returns 200, a bogus URL returns 404 and renders the new page.
- **Zero em or en dashes in the rendered output of every single route.**
- Light and dark checked on the landing page, both room views, and the index.
- No console errors, no horizontal overflow at 1440x900.

**One process note:** running `next build` while `next dev` was live on the same
directory clobbered the dev server's `.next` and made every route 500 for a few
minutes. Nothing in the app was wrong; clearing `.next` and restarting fixed it. Worth
knowing before you panic at a red screen.

## Still open, for you

1. **Deployment will need a look at the room store.** `lib/rooms.ts` reads and writes
   `.cache/rooms/*.json` through `fs` at runtime. Reading should survive a deploy since
   those files are in the repo, but `saveRoom` writes to disk, and most serverless
   hosts have a read-only filesystem. Generating a new room from the deployed site
   would fail. You said not to touch the backend, so I have not, but this is the thing
   that will bite on deploy day.
2. **The duplicated NOAH Conference footprint** on two Saxenhammer partners, above.
3. **The three fixtures.** They are labelled and now rank below the real runs, so they
   are honest. If you want maximum integrity you could cut them entirely and ship four
   real rooms; I kept them because they still show the ideal shape of a full room.

---
---

# Part two: 22 real firms, and what stress-testing them exposed

The demo now rests on **22 live pipeline runs against real, verified M&A boutiques**
across Germany, Austria and Switzerland, plus the 3 labelled fixtures. Every firm URL
was checked live before generation, so nothing in the list is invented or dead.

The firms: Quantum Partners, FalkenSteg, benten capital, Zerbach & Company, ARTHOS,
Hansen Advisory, NOMAS, MCF, CGS Stuttgart, PEBCO, Asset Valuation Group, AVANDIL,
Business Transaction, Trown Partners, SOVADIS, FTS Consulting, Schweizer Nachfolge
Experten, M&A TOP Partner, plus the original four (Saxenhammer, Steinbeis, KP Tech,
Taurus Advisory).

Result: **14 promising, 6 long shots, 2 strong fits.** That spread is itself the point.
A tool that scored every prospect highly would be worthless.

## Two real bugs the stress test found

Generating against 18 new sites immediately exposed something local testing on four
never could: three sites came back with **one source page and zero people**. The
product reported that honestly rather than inventing, which was correct behaviour, but
the reason turned out to be two genuine defects in the fetcher.

**1. Sitemap discovery had never worked, not once.**

`rawFetch` guarded on content type:

```
if (!contentType.includes("html") && res.status === 200) return { html: "", status };
```

Sitemaps are served as `text/xml`. So every sitemap fetch returned an empty body, and
`sitemapCandidates` silently returned nothing on every firm ever run. The guard was
meant to drop PDFs and images; it also killed the one discovery path that matters most,
because sites whose homepage markup has no anchors (JS-rendered ones) are exactly the
sites where the sitemap is the only way in. Now accepts `xml` as well as `html`.

**2. The `www` prefix threw away most discovery.**

Both `discoverLinks` and `sitemapCandidates` tested `url.host !== base.host`. Enter
"pebco.ag" and the base host is bare, while the site canonicalises to `www.pebco.ag`
and writes every internal link and sitemap entry with the prefix. Every candidate was
therefore rejected as off-site. PEBCO has a 26,000-character M&A page that the fetcher
had never once seen. Added a `sameSite` helper that tolerates `www` while still
refusing genuinely different hosts.

Also widened the German keyword list: `kompetenz`, `loesung`, `lösung`, `angebot`,
`projekte`, `wer-wir-sind`. "Kompetenzen" is how a lot of German firms label the page
that actually says what they do.

**Effect of the three fixes, same firms, same day:**

| Firm | sources before → after | people | score |
|---|---|---|---|
| PEBCO | 1 → 6 | 0 → 3 | 25 → 33 |
| Schweizer Nachfolge | 2 → 5 | 0 → 3 | 36 → 54 |
| NOMAS | 2 → 6 | 3 → 3 | 38 → 60 |
| Quantum Partners | 3 → 6 | 3 → 3 | 62 → **75 strong** |
| Taurus Advisory | 3 → 6 | 3 → 3 | 43 → **75 strong** |

Nearly every firm now hits the 6-page cap. **Thin reads went from 4 to 1.**

## The one that stays thin, and why that is the right answer

`hansenadvisory.de` still yields a single page. Not a bug: every subpage on that site
returns a **60-character shell** because it is fully client-rendered. There is nothing
for a server-side fetcher to read, and the product says so rather than guessing.

## The honesty gap that mattered most

Thin sites still produced a `grounded_fact`, because a true-but-obvious sentence feels
safer to the model than admitting nothing distinctive exists. The result was an email
opening with *"I saw that you focus on M&A advisory for the Mittelstand"*, which is
true of every single firm on the list.

That is worse than a blank field. The product's one promise is a **specific, observed**
fact, so a generic opener quietly breaks that promise while looking like it kept it.
The prompt already asks for an empty fact in that case; it does not reliably comply, and
a rule the product depends on cannot live only in a prompt.

New `lib/grounding.ts` makes the judgement deterministically, from the size of the
evidence base rather than the wording of the fact. Judging prose for "genericness" by
keyword would be guesswork, and in German, where every noun is capitalised, even
proper-noun detection is unreliable. What is objective is how much the pipeline actually
read: fewer than three pages, or no decision-maker *and* no dated signal, means the
opener is standing on very little.

The email panel now has **three** states, not two: grounded, **thin read**, and
ungrounded. A thin read names the specific gaps and says "check this before sending".
The index carries a "Thin read" badge so a reviewer sees it before spending a click.

## Verification, done the way a skeptic would

I checked extracted claims against the live sites rather than trusting the pipeline:

- **Zerbach & Company:** Cologne ✓, Leander Zerbach and Marc Bollinger as
  Geschäftsführung ✓, 65 transactions since 2014 ✓, the MBS Logistics sale to AD Ports
  Group ✓. The grounded fact is near-verbatim from their site.
- **ARTHOS:** Munich ✓, 150 completed transactions ✓, and exactly two Managing Partners,
  Arne Tödt and Arno Pätzold ✓. The extracted team size of 2 is correct, not an
  undercount.
- **MCF:** 80+ professionals ✓, 1,200+ transactions ✓, Stefan Mattern taking operational
  leadership with Hans-Christoph Stadel as Executive Chairman ✓, and all six offices
  matched exactly.

**No invented facts found.**

The guard is visibly working too. Quantum Partners is the only firm whose data-room
signal came back `true`, and the room shows the German evidence it survived on:
*"ein gut vorbereiteter Datenraum"*. Every other firm's tech signals were dropped for
lack of literal evidence.

## Copy fixed as a result

The index header said "22 live runs against real **German** boutiques". Six of them are
Swiss and one is Austrian. Being loose about a checkable detail on the page whose whole
job is proving precision is the worst possible place to be loose. Now reads "across
Germany, Austria and Switzerland".

## Final state

- 22 live rooms + 3 labelled fixtures, real runs sorted above fixtures.
- **Zero em or en dashes** across the narrative pages and all 22 room pages.
- 21 of 22 fully grounded, 1 correctly flagged as a thin read.
- `tsc` and `eslint` clean.

## Worth knowing before the interview

- **Scores move between runs.** The formula is deterministic given an extraction, but
  the extraction depends on which pages the fetcher reached, so reading more pages can
  move a score in either direction (MCF went 68 → 53 once it read the transactions page
  and the real numbers replaced inferred ones). If Marius asks, that is the honest
  answer: the score is stable, the evidence base is what varies, and the room always
  shows which pages it read.
- **The pipeline hits live third-party sites.** It is polite by design (one request at a
  time, a delay between, a declared user-agent, disk cache so a re-run never re-fetches),
  but it is worth being able to say that out loud.
- Regenerating all 22 takes about 8 minutes and roughly 44 model calls.

---
---

# Part three: the stepper, and a full project sweep

## How it works, rebuilt as a stepper

`/how-it-works` was one long scroll of six dense sections. A reader either
committed to all of it or bounced, with no sense of how much was left. It is now a
step-through: six named chips, Back/Next, and a CTA to the rooms on the last step.

**Improved on the pattern it came from.** OrderMatch Lab's version kept the step in
local state only, so a deep link worked on load but clicking Next never changed the
URL. That meant browser Back skipped the entire walkthrough in one jump, and no
step could be linked to once you were inside it. Here the URL is the single source
of truth (`?step=N`, `router.replace`, `scroll: false`), so Back, Forward, refresh
and copy-a-link all behave, and there is no local state to drift out of sync.

Details worth noting:

- **The chrome is pinned, only the slide body scrolls.** The first attempt let the
  whole page scroll, which pushed Next under the fold on the longest step. That is
  the one failure a stepper cannot have: the control that advances it has to be
  reachable without hunting.
- Named step chips rather than anonymous dots. A reader deciding whether to
  continue deserves to know what is left, not count circles.
- Left/right arrow keys move between steps, ignored while typing in a field.
- `?step=` is clamped: `99`, `-1`, `abc` and `2.5` all land on step one rather than
  rendering nothing. Verified.
- Nav sub-items and the room detail's "How the score works" link now deep-link to
  the right step instead of a dead `#anchor`.

## Dead code and structure

Removed: `types/index.ts` (an unused barrel), `lib/use-slow-load.ts` (never
imported), eight unused shadcn primitives (`alert`, `badge`, `card`,
`labeled-range-slider`, `segmented-toggle`, `separator`, `skeleton`, `tabs`), the
`@radix-ui/react-tabs` dependency they were the only user of, six unused icon
exports, and three stale `.gitkeep` files in directories that now have real
contents. `components/ui/` is down to the one primitive actually in use.

**The find that mattered: the demo was not version-controlled.**

`.gitignore` excluded `/.cache` wholesale, and the 22 generated rooms lived in
`.cache/rooms/`. So the entire evidence base for this pitch was untracked, and a
deployed build would have shipped with only the three hand-authored fixtures.

Generated rooms now live in `data/rooms/generated/` and are committed. The
distinction is real: `.cache/html/` is genuinely disposable (38MB, re-fetchable on
demand), while the rooms cost real API calls and are what a reviewer comes here to
read. They are content, not cache.

## Tests, where the claim is testability

`vitest` was configured with **zero test files**, on a codebase whose entire
argument is "deterministic where it can be". 35 tests now cover the pure core:
`scoring`, `grounding`, `prose` and `formatters`.

Two of them found real bugs while being written:

**1. A solo advisor was described as a large firm.** `sizeFitComponent` tested
5-25, then 26-60, then 2-4, and let everything else fall to a final `else` that
assumed "bigger". A team size of 1 matched no range and rendered as *"~1 people: a
larger firm, so a longer, more committee-driven sale."* Wrong, ungrammatical, and a
live case rather than a theoretical one, since solo advisors are common in this
market. Bands now run smallest to largest.

**2. `formatDate` invented a precise date out of a vague one.** The fallback was
`Number.isNaN(new Date(value).getTime())`, which does not do what it looks like it
does: V8 parses `"spring 2025"` happily and returns 1 January 2025. So an extracted
date the source never stated rendered as **"Jan 1, 2025"**. On a product whose one
promise is that nothing is invented, that is the worst class of bug, because a
confident wrong date is indistinguishable from a right one. Now only strict ISO
dates are formatted; everything else passes through verbatim.

## Bugs found in the sweep

- **The generator promised something it refuses.** The input placeholder read
  `vogt-kellermann.de · or a firm name`. Bare names are deliberately rejected
  (guessing a domain risks fetching the wrong company), so anyone typing
  "Saxenhammer" got an error. It also advertised a firm that does not exist. Now
  reads `saxenhammer-co.com`, and the rejection message explains what to do.
- **Two user-facing error strings still had em dashes.** My earlier sweep only
  checked rendered pages, so strings that only appear on an error path were missed.
- **The API leaked raw errors.** The 500 handler interpolated `err.message`
  straight into the response, which the playbook forbids outright and which on a
  deployed build would have printed absolute server paths into the browser. Now
  logged server-side, with an actionable sentence returned.
- **A failed disk write threw away a finished room.** `saveRoom` was awaited
  unguarded, so on a read-only serverless filesystem a fully built room, after two
  paid model calls, would have become an error page. Now caught and logged; the
  room is still returned.
- **A blank empty state.** "Who makes the call" rendered as a bare heading with
  nothing under it on firms that name nobody. It now says so explicitly, which on
  this product is the finding rather than a gap.

## Documentation

- **README rewritten.** It described `.cache/rooms/`, four verified firms and a
  shadcn setup that no longer matches. It now covers the real status (22 rooms,
  with the spot-check results), the three rules enforced in code, the project
  layout, the test command, and an honest "known limits" section including the
  serverless write problem and why fully client-rendered sites cannot be read.
- **`docs/design-principles.md` created.** The rules this repo is held to existed
  only in the sibling OrderMatch Lab repo, which meant this codebase was being
  judged against rules it did not contain. Consolidated and adapted: the dash ban
  and how it is enforced in three layers, the banned-word list, error and empty
  state formulas, component and measure rules, screen states, the fold argument,
  anti-patterns, and the one rule specific to this product, with the two bugs that
  have already tested it.

## Final state

- `tsc`, `eslint`, `vitest` (35 tests) and `next build` all clean.
- Zero em or en dashes in any rendered route, the README, or the design doc.
- 22 real rooms committed, 25 rooms total in the index.

---

## Follow-up: adaptive widths, and the step chips

**The step chips fit on one row now, without truncating.**

Two fixes were tried and rejected before the right one. Letting the chips size
naturally wrapped the sixth onto a line of its own, which reads as an overflow
accident. Forcing six equal grid columns kept them on one row but made them fit by
clipping to "Extract to a s…", and a clipped label is worse than a wrapped one.

The actual cause was the label length, not the layout. `THESIS_STEPS` now carries a
`short` label for the chips ("Shape", "Fetch", "Extract", "Score", "The play",
"Data line") alongside the descriptive `label` the nav rail still uses. The chips
fit comfortably at any desktop width, with or without the nav rail open, and the
chip never needed to carry the whole idea anyway because the slide's real title is
directly beneath it.

**Fixed widths replaced with the measure system.**

`globals.css` documents exactly this and warns against it: *"A fixed rem cap is a
guess about one screen: on a 14" laptop it looks fine, and on a 27" monitor it is a
narrow ribbon of text stranded in the middle of the page."* Twelve places were
ignoring it with hardcoded `max-w-2xl` / `4xl` / `5xl` / `6xl` / `screen-xl`,
several of which I had added myself earlier in this sweep.

The split now:

- **Page shells** use `measure-full`, so the layout grows with the viewport.
- **Prose** uses `measure`, so line length stays readable regardless.

Measured on `/rooms`:

| viewport | main | room card | header prose |
|---|---|---|---|
| 1440 | 1152px | 545px | 686px |
| 1728 | 1440px | 656px | 686px |

The layout uses whatever screen there is; the text does not stretch with it.

One correction while checking: the proof timeline was first given `measure-wide`,
but `ch` is computed at the wrapper's 16px, so 88ch resolved to 888px and put over
100 characters on a line of 14px body text. It uses `measure` now, matching the
intro at 686px.

**A layout bug found doing this.** The walkthrough's slide area both centred and
scrolled, and a flex container that does both clips the *start* of content taller
than itself. On the longest step the kicker line was cut off above the scroll
origin and could not be scrolled back to. Replaced `justify-center` on the
container with `my-auto` on the slide, which centres identically when content fits
and collapses instead of clipping when it does not.

---

## Correction: I had made it worse, not better

Widening the page shells to `measure-full` while leaving the prose capped at
`.measure` was the wrong half of the fix. The shell filled the screen, the text
stopped at 68ch, and because text is left-aligned all the leftover space collected
on **one side**: a narrow ribbon hugging the left edge with a void beside it. That
is worse than the fixed width it replaced, because at least the fixed width was
centred.

Two new utilities in `globals.css`:

**`.measure-read`** caps the *column* rather than the text inside it, and centres
it, so the margins land evenly on both sides and read as chosen rather than
left over. The cap is fluid:

```css
max-width: min(100%, clamp(56ch, 60vw, 96ch));
```

The `60vw` middle term is what makes it responsive: a bigger monitor gets a bigger
column instead of the same ribbon with more emptiness beside it. The bounds are in
`ch` because they are readability limits, not pixel guesses. Roughly 614px at
1024, 864px at 1440, 968px from about 1615 up.

**`.page-gutter`** gives side padding that scales (`clamp(1.25rem, 4.5vw, 4rem)`)
instead of snapping between two breakpoints.

Applied by page type:

- **Read** (`/how-it-works`, `/proof`): `measure-read` + `page-gutter`, and the
  inner `.measure` caps removed so content fills the column it is given.
- **Laid out** (`/rooms`, room detail, `/problem`, `/answer`, `/contact`):
  `measure-full` + `page-gutter`, where extra width buys real estate for cards
  rather than longer lines.

The `/proof` timeline is back to roughly the proportions it had before this sweep
touched it, which is what Harsh said looked better.

## The step chips, take three

Shortening the labels was the fix, not the layout. `THESIS_STEPS` now carries a
`short` label for the chips ("Shape", "Fetch", "Extract", "Score", "The play",
"Data line") next to the descriptive `label` the nav rail still shows. Six chips
fit one row comfortably at any desktop width, with no truncation and no orphan on
a second line.

Two earlier attempts are worth recording as things that did not work: natural
widths with the long labels wrapped the sixth chip alone onto row two, and forcing
six equal grid columns kept one row only by clipping to "Extract to a s…". A
clipped label is worse than a wrapped one; the length was the actual problem.
