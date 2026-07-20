"use client";

import { useEffect } from "react";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { TransitionLink } from "@/components/view-transition-link";
import { icons } from "@/lib/icons";

/**
 * Route-level error boundary. Without one, an unhandled render error shows
 * Next.js's own error screen, which in production is a bare "Application error"
 * and in development is a stack trace. The playbook is explicit: never expose
 * raw backend, model or framework errors, and always leave a recovery path.
 *
 * The digest is shown deliberately. It is an opaque id, not a stack trace, and
 * it is the one thing that makes a report actionable if someone tells Harsh the
 * page broke.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const Warn = icons.error;

  return (
    <AppShell>
      <main
        id="main"
        className="mx-auto flex min-h-dvh measure flex-col justify-center px-6 py-12 text-[var(--ft-text)]"
      >
        <p className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.24em] text-[var(--ft-warn-text)]">
          <Warn aria-hidden="true" className="size-4" />
          Something broke
        </p>
        <h1 className="mt-4 text-balance text-2xl font-extrabold leading-tight sm:text-3xl">
          This page didn&apos;t render.
        </h1>
        <p className="measure mt-3 text-base leading-7 text-[var(--ft-muted)]">
          The rest of the prototype is unaffected. Try this page again, or go back to the rooms,
          which are read from disk and load independently.
        </p>

        {error.digest ? (
          <p className="mt-4 font-mono text-xs text-[var(--ft-subtle)]">
            Reference: {error.digest}
          </p>
        ) : null}

        <div className="mt-8 flex flex-wrap gap-3">
          <Button
            type="button"
            size="lg"
            onClick={reset}
            className="bg-[var(--ft-accent)] px-6 text-sm text-[var(--ft-accent-text)] hover:bg-[var(--ft-accent-hover)]"
          >
            Try again
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="px-6 text-sm text-[var(--ft-muted)]"
          >
            <TransitionLink href="/rooms">See all rooms</TransitionLink>
          </Button>
        </div>
      </main>
    </AppShell>
  );
}
