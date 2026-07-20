"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { icons } from "@/lib/icons";
import { cn } from "@/lib/utils";

type GenState =
  | { status: "idle" }
  | { status: "working" }
  | { status: "error"; message: string };

// Cosmetic staged progress. The real pipeline runs these steps server-side;
// showing them keeps a 20-60s live run from looking stuck. Purely visual — the
// actual result is whatever the route returns.
const STEPS = [
  "Fetching public pages…",
  "Reading the site…",
  "Scoring the fit…",
  "Drafting the play…",
];

export function RoomGenerator({ className }: { className?: string }) {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [state, setState] = useState<GenState>({ status: "idle" });
  const [step, setStep] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (state.status === "working") {
      setStep(0);
      timer.current = setInterval(() => {
        setStep((s) => Math.min(s + 1, STEPS.length - 1));
      }, 2800);
    }
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [state.status]);

  const working = state.status === "working";

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const value = input.trim();
    if (!value || working) return;

    setState({ status: "working" });
    try {
      const res = await fetch("/api/generate-room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: value }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setState({
          status: "error",
          message: data?.error ?? `Could not generate a room (${res.status}).`,
        });
        return;
      }
      const id: string | undefined = data?.room?.id ?? data?.id;
      if (!id) {
        setState({ status: "error", message: "The pipeline returned no room." });
        return;
      }
      router.push(`/rooms/${id}`);
    } catch {
      setState({ status: "error", message: "Could not reach the pipeline. Is the app running?" });
    }
  }

  const ArrowRight = icons.action;
  const Scan = icons.scan;
  const Loading = icons.loading;

  return (
    <div
      className={cn(
        "rounded-2xl border border-[var(--ft-border)] bg-[var(--ft-surface)] p-5 shadow-sm sm:p-6",
        className,
      )}
    >
      <div className="mb-3 flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--ft-accent)]">
        <Scan aria-hidden="true" className="size-4" />
        Open a new room
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
        <label htmlFor="firm-input" className="sr-only">
          Firm website URL
        </label>
        {/* The placeholder used to read "vogt-kellermann.de · or a firm name",
            which was wrong twice over: that firm is a hand-authored fixture and
            does not exist, and the pipeline deliberately rejects bare company
            names because guessing a domain risks fetching the wrong company.
            Anyone typing a name got an error. Promise only what it does. */}
        <input
          id="firm-input"
          type="text"
          value={input}
          disabled={working}
          onChange={(e) => setInput(e.target.value)}
          placeholder="saxenhammer-co.com"
          className="min-w-0 flex-1 rounded-xl border border-[var(--ft-border)] bg-[var(--ft-bg)] px-4 py-3 text-sm text-[var(--ft-text)] outline-none transition-colors placeholder:text-[var(--ft-subtle)] focus:border-[var(--ft-accent)] focus:ring-2 focus:ring-[var(--ft-accent)]/30 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={working || input.trim().length === 0}
          // A faded accent button reads as broken rather than inactive. The
          // disabled state drops to a neutral surface instead, so an empty form
          // looks like a form waiting for input, not a button that failed.
          className={cn(
            "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition-colors",
            working || input.trim().length === 0
              ? "cursor-not-allowed bg-[var(--ft-surface-3)] text-[var(--ft-subtle)]"
              : "bg-[var(--ft-accent)] text-[var(--ft-accent-text)] hover:bg-[var(--ft-accent-hover)]",
          )}
        >
          {working ? (
            <>
              <Loading aria-hidden="true" className="size-4 animate-spin" />
              Working…
            </>
          ) : (
            <>
              Open a room
              <ArrowRight aria-hidden="true" className="size-4" />
            </>
          )}
        </button>
      </form>

      {working ? (
        <p
          aria-live="polite"
          className="mt-3 flex items-center gap-2 font-mono text-xs text-[var(--ft-muted)]"
        >
          <span className="size-1.5 animate-pulse rounded-full bg-[var(--ft-accent)]" />
          {STEPS[step]}
        </p>
      ) : state.status === "error" ? (
        <p
          role="alert"
          className="mt-3 rounded-lg border border-[var(--ft-warn-border)] bg-[var(--ft-warn-bg)] px-3 py-2 text-xs text-[var(--ft-warn-text)]"
        >
          {state.message}
        </p>
      ) : (
        <p className="mt-3 text-xs text-[var(--ft-subtle)]">
          Public pages only. No LinkedIn, no login walls. Anything it can&apos;t source, it flags
          rather than invents.
        </p>
      )}
    </div>
  );
}
