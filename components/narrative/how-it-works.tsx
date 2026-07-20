"use client";

import { useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { TransitionLink } from "@/components/view-transition-link";
import { icons } from "@/lib/icons";
import { SCORE_WEIGHTS } from "@/lib/scoring";
import { THESIS_STEPS } from "@/lib/thesis-nav";
import { cn } from "@/lib/utils";

/**
 * The engineering walkthrough, one step at a time.
 *
 * This was a single long scroll. Six dense sections stacked vertically meant a
 * reader either committed to all of it or bounced, and there was no way to tell
 * how much was left. A stepper turns the same content into a decision the
 * reader makes six times ("keep going?") instead of one they make once, and it
 * makes each step's argument land on its own rather than blurring into the next.
 *
 * The step lives in the URL (?step=N), which the OrderMatch version did not do:
 * there, clicking Next changed local state only, so a deep link worked on load
 * but browser Back skipped the whole walkthrough and no step could be linked to
 * once you were inside it. Keeping the URL authoritative costs one router call
 * and makes Back, Forward, refresh and copy-a-link all behave.
 */

const SCORE_BUCKETS = [
  { label: "Tech-maturity fit", weight: SCORE_WEIGHTS.techEmailBased + SCORE_WEIGHTS.techDataRoom + SCORE_WEIGHTS.techClientPortal, note: "email process +15, data room +10, client portal +10" },
  { label: "Deal activity", weight: SCORE_WEIGHTS.dealActivity, note: "more tombstones, more to gain" },
  { label: "Firm-size fit", weight: SCORE_WEIGHTS.sizeFit, note: "boutiques are the sweet spot" },
  { label: "Service / sector fit", weight: SCORE_WEIGHTS.serviceFit, note: "sell-side M&A is the bullseye" },
  { label: "Timeliness (why-now)", weight: SCORE_WEIGHTS.timeliness, note: "a live signal + reachable people" },
];

function CodeBlock({ children }: { children: React.ReactNode }) {
  return (
    <pre className="overflow-x-auto rounded-xl border border-[var(--ft-border)] bg-[var(--ft-surface-2)] p-4 font-mono text-xs leading-6 text-[var(--ft-muted)]">
      {children}
    </pre>
  );
}

function ScoreTable() {
  return (
    <div className="overflow-hidden rounded-xl border border-[var(--ft-border)]">
      <table className="w-full text-left text-sm">
        <thead className="bg-[var(--ft-surface-2)] text-xs uppercase tracking-wide text-[var(--ft-subtle)]">
          <tr>
            <th className="px-4 py-2 font-semibold">Bucket</th>
            <th className="px-4 py-2 text-right font-semibold">Max</th>
          </tr>
        </thead>
        <tbody>
          {SCORE_BUCKETS.map((b) => (
            <tr key={b.label} className="border-t border-[var(--ft-border)]">
              <td className="px-4 py-2">
                <span className="font-medium text-[var(--ft-text)]">{b.label}</span>
                <span className="block text-xs text-[var(--ft-subtle)]">{b.note}</span>
              </td>
              <td className="px-4 py-2 text-right font-bold tabular-nums text-[var(--ft-text)]">
                {b.weight}
              </td>
            </tr>
          ))}
          <tr className="border-t border-[var(--ft-border-strong)] bg-[var(--ft-surface-2)]">
            <td className="px-4 py-2 font-bold text-[var(--ft-text)]">Total</td>
            <td className="px-4 py-2 text-right font-bold tabular-nums text-[var(--ft-text)]">100</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

type Slide = {
  id: string;
  kicker: string;
  title: string;
  body: string[];
  /** A pull-quote sized takeaway, shown against an accent rule. */
  note?: string;
  artifact?: React.ReactNode;
};

const SLIDES: Slide[] = [
  {
    id: "shape",
    kicker: "The shape of it",
    title: "Four passes, one room.",
    body: [
      "A room is built in four passes: fetch the firm's public pages, extract them into a strict schema, score the fit with a formula, then draft the play. The model is used narrowly, twice, and never to decide the number.",
      "The design bias throughout: let deterministic code do everything it can, and keep the model on the two jobs only it can do, reading messy prose into structure, and writing.",
    ],
    note: "Everything that follows is a consequence of that one choice.",
  },
  {
    id: "fetch",
    kicker: "Fetch, politely",
    title: "Public pages only, and gently.",
    body: [
      "Home, team, and transactions/about: the pages a firm publishes about itself. One request at a time, with a real user-agent and a pause between fetches, so it reads like a browser, not a scraper.",
      "Every fetched page is cached to disk. Iterating on the extraction prompt re-reads the cache, never the firm's server. No LinkedIn, no login walls, nothing that isn't openly published.",
    ],
    artifact: (
      <CodeBlock>
        {`GET saxenhammer-co.com/en/           → cache/…/en.html
GET saxenhammer-co.com/en/about-us/  → cache/…/about-us.html
GET saxenhammer-co.com/en/news/      → cache/…/news.html
  · one at a time · polite delay · cached to disk`}
      </CodeBlock>
    ),
  },
  {
    id: "extract",
    kicker: "Extract to a schema",
    title: "Messy HTML in, strict JSON out.",
    body: [
      "One OpenAI call turns the fetched pages into a fixed schema: team size, cities, services, sectors, tombstone count, the three tech signals, people, and why-now signals. Structured Outputs guarantees the shape, so it isn't something to hope for.",
      "Unknowns come back as null and land in the room's “unverified” list. The prompt is told, in as many words, that a blank field is correct and a guessed one is a bug.",
      "Below is real output from steinbeis-finance.de. All three tech signals came back false, which is the deterministic guard doing its job: a signal only survives if its own evidence literally contains the wording that defines it.",
    ],
    note: "“We handle every transaction personally” is not allowed to become “runs on email”. That flag carries the most score weight, so a false positive would put a wrong claim in front of a real firm.",
    artifact: (
      <CodeBlock>
        {`{
  "team_size_estimate": 15,
  "cities": ["Hamburg", "Berlin", "Cologne", …],
  "tombstone_count": 250,
  "tech_signals": {
    "process_email_based": false,   // no literal evidence
    "mentions_data_room": false,
    "has_client_portal": false
  },
  "people": [ … ],  "signals": [ … ]
}`}
      </CodeBlock>
    ),
  },
  {
    id: "score",
    kicker: "Score with a formula",
    title: "A number you can read, not a vibe.",
    body: [
      "The fit score is a weighted formula over the extracted facts, written in plain code, not assigned by the model. You can read exactly why a firm scored what it did, and change the weights without touching a prompt.",
      "On the tech read: a firm that mentions a data room or client portal, or runs on email, is already living inside the workflow Fintalo replaces, so each raises fit, with the email-and-Excel pain weighted highest.",
    ],
    artifact: <ScoreTable />,
  },
  {
    id: "play",
    kicker: "The play, grounded",
    title: "Written on one real fact.",
    body: [
      "A second, separate LLM pass writes the angle, the objections you'll hear with counters, and a drafted opening email. It's handed the extracted facts and told to build the email on exactly one real, observed detail about the firm.",
      "If there's no such fact, a thin site with nothing specific on it, then it says so, and the email is marked “do not send” rather than dressed up with something invented.",
    ],
    note: "Grounding is the point: a clever cold email about a firm you've got wrong loses the deal.",
    artifact: (
      <CodeBlock>
        {`grounded_fact:
  "Saxenhammer said it is expanding its mid-market
   position and becoming an official partner of
   Clairfield International."
  → source: saxenhammer-co.com/en/news/`}
      </CodeBlock>
    ),
  },
  {
    id: "boundary",
    kicker: "The public-data line",
    title: "Public professional footprint only.",
    body: [
      "Person data is limited to the public professional footprint: published talks, interviews, bylines, on-the-record quotes about their own work. No private or personal data, no scraping behind a login, no LinkedIn.",
      "This isn't a policy note bolted on afterwards. It's in the schema (there is nowhere to put private data) and in the prompts (they are told the boundary explicitly). The room can only ever be built from what a firm chose to publish about itself.",
    ],
    note: "Same discipline your product runs on: real sources, an audit trail, and no step that asks you to trust a number you can't see the reasoning behind.",
  },
];

/** Clamp whatever is in ?step= to a real slide. A junk or out-of-range value
 * lands on step one rather than rendering nothing. */
function stepFromParam(raw: string | null): number {
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed >= SLIDES.length) {
    return 0;
  }
  return parsed;
}

export function HowItWorks() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const step = stepFromParam(searchParams.get("step"));

  const slide = SLIDES[step];
  const isFirst = step === 0;
  const isLast = step === SLIDES.length - 1;

  // The URL is the single source of truth for which step is open, so there is
  // no local state to drift out of sync with it. `scroll: false` keeps the
  // viewport still: the step changes in place, the page does not jump.
  const goTo = useCallback(
    (next: number) => {
      const clamped = Math.min(SLIDES.length - 1, Math.max(0, next));
      router.replace(clamped === 0 ? "/how-it-works" : `/how-it-works?step=${clamped}`, {
        scroll: false,
      });
    },
    [router],
  );

  // Left/right arrows move between steps, which is what anyone who has used a
  // slide deck will try first. Ignored while typing in a field.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (event.key === "ArrowRight") goTo(step + 1);
      if (event.key === "ArrowLeft") goTo(step - 1);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goTo, step]);

  const ArrowRight = icons.action;
  const Trust = icons.trust;

  return (
    <AppShell>
      {/* Fixed height with the slide body as the only scrolling region, so the
          step chips and the Back/Next controls are always on screen. Letting the
          whole page scroll pushed Next under the fold on the longest step, which
          is the one failure a stepper cannot have: the control that advances it
          has to be reachable without hunting for it. */}
      <main
        id="main"
        className="measure-read page-gutter flex h-dvh flex-col py-8 text-[var(--ft-text)]"
      >
        <div className="flex shrink-0 items-baseline justify-between gap-4">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.24em] text-[var(--ft-accent)]">
            How it works
          </p>
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--ft-subtle)]">
            Step {step + 1} of {SLIDES.length}
          </span>
        </div>

        {/* Named steps, not anonymous dots: a reader deciding whether to keep
            going deserves to know what is left rather than counting circles.

            Chips size to their own content and the row flows. Two earlier
            attempts were worse: natural widths with the long labels wrapped the
            sixth chip onto a line of its own, and forcing six equal columns made
            them fit by truncating to "Extract to a s…". Shortening the chip
            label (lib/thesis-nav.ts) fixed the actual cause, so the row now fits
            comfortably at any desktop width, with or without the nav rail open,
            and wraps evenly rather than raggedly when it finally has to. */}
        <nav
          aria-label="Walkthrough steps"
          className="mt-4 flex shrink-0 flex-wrap gap-1.5"
        >
          {THESIS_STEPS.map((s, index) => {
            const isCurrent = index === step;
            const isDone = index < step;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => goTo(index)}
                aria-current={isCurrent ? "step" : undefined}
                title={s.label}
                className={cn(
                  "flex items-baseline gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  isCurrent
                    ? "border-[var(--ft-accent)] bg-[var(--ft-accent)] text-[var(--ft-accent-text)]"
                    : isDone
                      ? "border-[var(--ft-border)] bg-[var(--ft-accent-soft)] text-[var(--ft-accent)]"
                      : "border-[var(--ft-border)] bg-[var(--ft-surface)] text-[var(--ft-muted)] hover:text-[var(--ft-text)]",
                )}
              >
                <span className="shrink-0 font-mono text-[10px] tabular-nums opacity-70">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span>{s.short}</span>
              </button>
            );
          })}
        </nav>

        {/* `my-auto` on the slide rather than `justify-center` on this box.
            They centre identically when the slide fits, but a flex container
            that both centres and scrolls clips the *start* of any content taller
            than itself, so on the longest step the kicker line was cut off above
            the scroll origin and could not be scrolled back to. Auto margins
            collapse instead of clipping. */}
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto py-8">
          {/* key on the slide id so React remounts and the reveal animation
              replays on every step change. */}
          <section
            key={slide.id}
            className="my-auto [animation:reveal-item_380ms_ease-out] motion-reduce:animate-none"
          >
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ft-accent)]">
              {String(step + 1).padStart(2, "0")} · {slide.kicker}
            </p>
            <h1 className="mt-2 text-balance text-[clamp(1.5rem,2.6vw,2.2rem)] font-extrabold leading-[1.16]">
              {slide.title}
            </h1>

            {/* No inner width caps. The column itself is the measure now, so
                everything fills it and the margins stay even on both sides. */}
            <div className="mt-4 space-y-3">
              {slide.body.map((paragraph) => (
                <p
                  key={paragraph.slice(0, 24)}
                  className="text-sm leading-7 text-[var(--ft-muted)] sm:text-base"
                >
                  {paragraph}
                </p>
              ))}
            </div>

            {slide.note ? (
              <p className="mt-5 border-l-2 border-[var(--ft-accent)] pl-4 text-sm leading-7 text-[var(--ft-text)]">
                {slide.note}
              </p>
            ) : null}

            {slide.artifact ? <div className="mt-6">{slide.artifact}</div> : null}
          </section>
        </div>

        <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-[var(--ft-border)] pt-5">
          <Button
            type="button"
            variant="outline"
            onClick={() => goTo(step - 1)}
            disabled={isFirst}
            className="border-[var(--ft-border)] bg-[var(--ft-surface)] px-5 text-sm text-[var(--ft-muted)] hover:text-[var(--ft-text)] disabled:opacity-40"
          >
            Back
          </Button>

          {isLast ? (
            <Button
              asChild
              className="bg-[var(--ft-accent)] px-6 text-sm text-[var(--ft-accent-text)] hover:bg-[var(--ft-accent-hover)]"
            >
              <TransitionLink href="/rooms">
                <Trust aria-hidden="true" />
                See it on the rooms
                <ArrowRight aria-hidden="true" />
              </TransitionLink>
            </Button>
          ) : (
            <Button
              type="button"
              onClick={() => goTo(step + 1)}
              className="bg-[var(--ft-accent)] px-6 text-sm text-[var(--ft-accent-text)] hover:bg-[var(--ft-accent-hover)]"
            >
              Next
              <ArrowRight aria-hidden="true" />
            </Button>
          )}
        </footer>
      </main>
    </AppShell>
  );
}
