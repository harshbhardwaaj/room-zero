import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { TransitionLink } from "@/components/view-transition-link";
import { icons } from "@/lib/icons";

/**
 * There was no not-found route, so any bad URL fell through to Next.js's own
 * default: an unstyled black page with "404" on it. If this ever goes up on a
 * link sent to one person, a mistyped or stale URL is the first and possibly
 * only thing they see, and a raw framework error page says the build is
 * unfinished.
 *
 * The playbook's rule for empty and error states applies here too: say what
 * happened, and give one clear way forward.
 */
export default function NotFound() {
  const ArrowRight = icons.action;
  const Rooms = icons.rooms;

  return (
    <AppShell>
      <main
        id="main"
        className="mx-auto flex min-h-dvh measure flex-col justify-center px-6 py-12 text-[var(--ft-text)]"
      >
        <p className="font-mono text-xs font-bold uppercase tracking-[0.24em] text-[var(--ft-accent)]">
          Page not found
        </p>
        <h1 className="mt-4 text-balance text-2xl font-extrabold leading-tight sm:text-3xl">
          There&apos;s no room at this address.
        </h1>
        <p className="measure mt-3 text-base leading-7 text-[var(--ft-muted)]">
          The link may be out of date, or the room may never have been generated. Everything
          that does exist is on the rooms page.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button
            asChild
            size="lg"
            className="bg-[var(--ft-accent)] px-6 text-sm text-[var(--ft-accent-text)] hover:bg-[var(--ft-accent-hover)]"
          >
            <TransitionLink href="/rooms">
              <Rooms aria-hidden="true" />
              See all rooms
            </TransitionLink>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="px-6 text-sm text-[var(--ft-muted)]"
          >
            <TransitionLink href="/">
              Back to start
              <ArrowRight aria-hidden="true" />
            </TransitionLink>
          </Button>
        </div>
      </main>
    </AppShell>
  );
}
