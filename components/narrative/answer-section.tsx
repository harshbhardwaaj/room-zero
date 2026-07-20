import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { TransitionLink } from "@/components/view-transition-link";
import { icons } from "@/lib/icons";
import { cn } from "@/lib/utils";

/** What a room holds, in the order a salesperson would actually use it. The fit
 * score comes last and spans the grid, because it is derived from the four
 * above it rather than being a fifth peer. */
const LAYERS = [
  {
    icon: icons.firm,
    title: "Firm intel and a tech-maturity read",
    body:
      "Team size, cities, services, deal count. Plus the tell that matters most: do they still run on email and Excel? That's the pain your product removes.",
  },
  {
    icon: icons.people,
    title: "The people who decide",
    body:
      "The two or three partners who'd make the buying call, their public professional footprint (talks, interviews, what they've said about their own process), and what each likely cares about.",
  },
  {
    icon: icons.signal,
    title: "A why-now timeline",
    body:
      "New mandate, new hire, a site relaunch. The dated events that turn a cold firm into a timely one, each linked to where it was found.",
  },
  {
    icon: icons.play,
    title: "The play",
    body:
      "A recommended angle, the objections you'll hear with counters, and a drafted opening email built on one real, observed fact about the firm. Never a generic template.",
  },
  {
    icon: icons.fit,
    title: "A fit score you can read",
    body:
      "One transparent number from a formula you can see and adjust, not a black-box guess. Every point traces back to an extracted fact.",
    wide: true,
  },
];

export function AnswerSection() {
  const ArrowRightIcon = icons.action;
  const Trust = icons.trust;

  return (
    <AppShell>
      <main
        id="main"
        className="page-gutter flex min-h-dvh w-full flex-col justify-center py-12 text-[var(--ft-text)]"
      >
        {/* gap-6 and py-12 rather than gap-8 / py-16: at 1440x900 the wider
            spacing pushed the CTA 84px under the fold, and this page has enough
            genuine content (five layers plus the integrity rule) that it was
            the whitespace, not the content, that had to give. */}
        <section className="measure-full mx-auto flex flex-col gap-5">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.24em] text-[var(--ft-accent)] sm:text-sm">
            The answer
          </p>

          <div className="measure-wide space-y-2">
            <h1 className="text-[clamp(1.4rem,2.5vw,2.25rem)] font-extrabold leading-[1.18] text-[var(--ft-text)]">
              One room per firm worth winning.
            </h1>
            <p className="text-balance text-[clamp(1.4rem,2.5vw,2.25rem)] font-extrabold leading-[1.18] text-[var(--ft-accent)]">
              Auto-generated, grounded in what they actually published.
            </p>
          </div>

          {/* The paragraph that used to sit here re-explained the deal-room
              analogy, which is already the landing page's headline. Reading the
              same idea twice in three clicks makes the pitch feel padded. One
              short orienting line instead, so the grid below has a frame. */}
          <p className="measure text-[clamp(1rem,1.2vw,1.1rem)] leading-relaxed text-[var(--ft-muted)]">
            Five things per firm, in the order you&apos;d actually use them.
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            {LAYERS.map((layer) => {
              const Icon = layer.icon;
              return (
                <div
                  key={layer.title}
                  className={cn(
                    "flex gap-4 rounded-xl border border-[var(--ft-border)] bg-[var(--ft-surface)] p-5",
                    layer.wide ? "sm:col-span-2" : undefined,
                  )}
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[var(--ft-accent-soft)] text-[var(--ft-accent)]">
                    <Icon aria-hidden="true" className="size-5" />
                  </span>
                  <div>
                    <p className="font-bold text-[var(--ft-text)]">{layer.title}</p>
                    <p className="mt-1 text-sm leading-6 text-[var(--ft-muted)]">{layer.body}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-[var(--ft-border)] bg-[var(--ft-accent-softer)] p-5">
            <Trust aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-[var(--ft-accent)]" />
            <p className="text-sm leading-7 text-[var(--ft-muted)]">
              <span className="font-semibold text-[var(--ft-text)]">The one hard rule:</span>{" "}
              every claim is a public professional fact, traceable to a page. Anything the pipeline
              can&apos;t source, it flags. It never invents a fact about a firm you might be about
              to email, because a hallucinated detail is worse than a blank field.
            </p>
          </div>

          <Button
            asChild
            size="lg"
            className="w-full bg-[var(--ft-accent)] px-6 text-sm text-[var(--ft-accent-text)] hover:bg-[var(--ft-accent-hover)] sm:w-auto sm:self-start"
          >
            <TransitionLink href="/rooms">
              Open the rooms
              <ArrowRightIcon aria-hidden="true" />
            </TransitionLink>
          </Button>
        </section>
      </main>
    </AppShell>
  );
}
