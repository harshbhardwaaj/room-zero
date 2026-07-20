import { ArrowRight } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { TransitionLink } from "@/components/view-transition-link";
import { brand } from "@/lib/brand";

/** The three things that make M&A outbound hard, as cards rather than a
 * paragraph. These are what's worth remembering, and prose hides them. */
const DIFFICULTIES = [
  {
    stat: "Hundreds of firms",
    label: "too many to read by hand",
    detail:
      "Every M&A boutique in the DACH region is a prospect. Nobody has the hours to read each website before reaching out.",
  },
  {
    stat: "Partners, not forms",
    label: "they smell a template",
    detail:
      "An M&A partner deletes generic outreach in a second. Proof you understand their firm is the only thing that earns a reply.",
  },
  {
    stat: "Why-now decays",
    label: "timing is the whole game",
    detail:
      "A new mandate or a new hire is a reason to reach out. It stays a reason for about two weeks, then it goes stale.",
  },
];

export function ProblemSection() {
  return (
    <AppShell>
      <main
        id="main"
        className="page-gutter flex min-h-dvh w-full flex-col justify-center py-16 text-[var(--ft-text)]"
      >
        <section className="measure-full mx-auto flex flex-col gap-8">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.24em] text-[var(--ft-accent)] sm:text-sm">
            {brand.problemEyebrow}
          </p>

          {/* Two lines, not three. The cut line ("There are hundreds of them,
              and they ignore generic outreach") was the three cards below said
              first and vaguer: card one is the count, card two is the template
              problem. Saying it twice made the headline eat half the viewport
              and pushed the CTA off screen. What's left is the insight the
              cards exist to explain. */}
          <div className="measure-wide space-y-2">
            <h1 className="text-[clamp(1.4rem,2.5vw,2.25rem)] font-extrabold leading-[1.18] text-[var(--ft-text)]">
              You sell to M&amp;A boutiques.
            </h1>
            <p className="text-balance text-[clamp(1.4rem,2.5vw,2.25rem)] font-extrabold leading-[1.18] text-[var(--ft-accent)]">
              The ones who reply got a message that already knew them.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {DIFFICULTIES.map((card) => (
              <div
                key={card.stat}
                className="rounded-xl border border-[var(--ft-border)] bg-[var(--ft-surface)] p-5"
              >
                <p className="text-lg font-extrabold leading-tight text-[var(--ft-text)]">
                  {card.stat}
                </p>
                <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--ft-accent)]">
                  {card.label}
                </p>
                <p className="mt-2 text-sm leading-6 text-[var(--ft-muted)]">{card.detail}</p>
              </div>
            ))}
          </div>

          {/* The lead-in paragraph that used to sit here restated cards one and
              two a third time. Only the pivot survives, because it's the line
              that earns the next click. */}
          <p className="measure-wide text-balance text-[clamp(1.15rem,1.7vw,1.5rem)] font-bold leading-snug text-[var(--ft-text)]">
            The only question that matters is whether you can make it scale without making it
            generic.
          </p>

          <Button
            asChild
            size="lg"
            className="mt-2 w-full bg-[var(--ft-accent)] px-6 text-sm text-[var(--ft-accent-text)] hover:bg-[var(--ft-accent-hover)] sm:w-auto sm:self-start"
          >
            <TransitionLink href="/answer">
              So what did I build?
              <ArrowRight aria-hidden="true" />
            </TransitionLink>
          </Button>
        </section>
      </main>
    </AppShell>
  );
}
