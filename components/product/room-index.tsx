"use client";

import { useEffect, useMemo, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { RoomGenerator } from "@/components/product/room-generator";
import { roomGenerationEnabled } from "@/lib/features";
import { FitRing } from "@/components/product/fit-ring";
import { TransitionLink } from "@/components/view-transition-link";
import { formatBand, formatRoomStatus } from "@/lib/formatters";
import { isThinRead } from "@/lib/grounding";
import { icons } from "@/lib/icons";
import { readStashedRooms } from "@/lib/session-rooms";
import { cn } from "@/lib/utils";
import { toRoomSummary, type RoomStatus, type RoomSummary } from "@/types/room";

type StatusFilter = "all" | RoomStatus;
type SortKey = "fit" | "recent";

const STATUS_FILTERS: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "new", label: "Not contacted" },
  { id: "contacted", label: "Contacted" },
  { id: "replied", label: "Replied" },
  { id: "demo_booked", label: "Demo booked" },
];

const STATUS_STYLE: Record<RoomStatus, string> = {
  new: "border-[var(--ft-border-strong)] bg-[var(--ft-surface-2)] text-[var(--ft-muted)]",
  contacted: "border-[var(--ft-accent)]/30 bg-[var(--ft-accent-soft)] text-[var(--ft-accent)]",
  replied: "border-[var(--ft-warn-border)] bg-[var(--ft-warn-bg)] text-[var(--ft-warn-text)]",
  demo_booked: "border-[var(--ft-ok-border)] bg-[var(--ft-ok-bg)] text-[var(--ft-ok-text)]",
};

export function RoomIndex({ rooms }: { rooms: RoomSummary[] }) {
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<SortKey>("fit");
  const [stashed, setStashed] = useState<RoomSummary[]>([]);

  // Rooms generated on a deployed build never reached the server store, so the
  // list the server rendered does not know about them and coming back here from
  // one would look like it had been thrown away. Read them after mount, not
  // during render: the server has no sessionStorage and mismatched markup
  // breaks hydration.
  useEffect(() => {
    const known = new Set(rooms.map((r) => r.id));
    setStashed(
      readStashedRooms()
        .filter((r) => !known.has(r.id))
        .map((r) => toRoomSummary(r, isThinRead(r))),
    );
  }, [rooms]);

  const all = useMemo(() => [...rooms, ...stashed], [rooms, stashed]);

  const visible = useMemo(() => {
    const filtered = all.filter((r) => (status === "all" ? true : r.status === status));
    // Live pipeline runs always outrank hand-authored fixtures, whichever sort
    // is active. Sorting purely by fit put a design fixture at the top of the
    // page, so the first room anyone opened was one the pipeline never actually
    // produced. The proof here is that this ran against real firms; the
    // fixtures only exist to show the shape, and they should never be mistaken
    // for the evidence.
    const sorted = [...filtered].sort((a, b) => {
      if (Boolean(a.isSample) !== Boolean(b.isSample)) {
        return a.isSample ? 1 : -1;
      }
      return sort === "fit"
        ? b.fitScore - a.fitScore
        : new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime();
    });
    return sorted;
  }, [all, status, sort]);

  const liveCount = all.filter((r) => !r.isSample).length;
  const sampleCount = all.length - liveCount;
  const ArrowRight = icons.action;
  const MapPin = icons.location;

  return (
    <AppShell>
      <main
        id="main"
        className="mx-auto flex min-h-dvh measure-full page-gutter flex-col py-10 text-[var(--ft-text)]"
      >
        <div className="measure">
          <p className="font-mono text-sm font-bold uppercase tracking-[0.2em] text-[var(--ft-accent)]">
            Deal rooms
          </p>
          <h1 className="mt-4 text-2xl font-extrabold leading-tight sm:text-3xl">
            One room per firm worth winning.
          </h1>
          {/* State what was actually done, not a vanity metric. "N scored a
              strong fit" was a number about the sample set; how many of these
              are real runs against real firms is the thing worth knowing. */}
          {/* "German" was wrong once Swiss and Austrian firms were added, and
              being loose about a verifiable detail on the page that exists to
              prove precision is the wrong place to be loose. */}
          <p className="mt-3 text-sm leading-6 text-[var(--ft-muted)] sm:text-base">
            {liveCount} live {liveCount === 1 ? "run" : "runs"} against real M&amp;A boutiques
            across Germany, Austria and Switzerland, built from their public pages
            {sampleCount > 0 ? (
              <>
                , plus {sampleCount} labelled design {sampleCount === 1 ? "fixture" : "fixtures"}
              </>
            ) : null}
            . Every room carries a first email grounded in one real fact.
          </p>
        </div>

        {/* The generator needs a writable filesystem and an OpenAI key, so it
            runs locally and is off on the deployed build (lib/features.ts).
            The note replaces it rather than leaving a silent gap: without it,
            a reader has no way to tell generated rooms from hand-written ones,
            which is the one thing this page exists to prove. */}
        {roomGenerationEnabled ? (
          <RoomGenerator className="mt-6" />
        ) : (
          <p className="mt-6 rounded-xl border border-[var(--ft-border)] bg-[var(--ft-surface-2)] px-4 py-3 text-xs leading-5 text-[var(--ft-muted)]">
            The {liveCount} live {liveCount === 1 ? "run" : "runs"} below are real pipeline
            output, kept exactly as it came out. Generation runs locally against the live
            sites and is switched off on this build, so nothing here moves while you read it.
          </p>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setStatus(f.id)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                  status === f.id
                    ? "border-[var(--ft-accent)] bg-[var(--ft-accent)] text-[var(--ft-accent-text)]"
                    : "border-[var(--ft-border)] bg-[var(--ft-surface)] text-[var(--ft-muted)] hover:text-[var(--ft-text)]",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs text-[var(--ft-muted)]">
            <span className="font-mono uppercase tracking-[0.12em] text-[var(--ft-subtle)]">
              Sort
            </span>
            {(["fit", "recent"] as SortKey[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setSort(key)}
                className={cn(
                  "rounded-full px-2.5 py-1 font-semibold transition-colors",
                  sort === key
                    ? "bg-[var(--ft-surface-3)] text-[var(--ft-text)]"
                    : "text-[var(--ft-muted)] hover:text-[var(--ft-text)]",
                )}
              >
                {key === "fit" ? "Best fit" : "Newest"}
              </button>
            ))}
          </div>
        </div>

        {visible.length === 0 ? (
          <p className="mt-6 rounded-xl border border-[var(--ft-border)] bg-[var(--ft-surface)] p-6 text-sm text-[var(--ft-muted)]">
            No rooms match this filter.
          </p>
        ) : (
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {visible.map((room) => (
              <TransitionLink
                key={room.id}
                href={`/rooms/${room.id}`}
                className="group flex flex-col rounded-2xl border border-[var(--ft-border)] bg-[var(--ft-surface)] p-5 shadow-sm outline-none transition-all hover:-translate-y-0.5 hover:border-[var(--ft-border-strong)] hover:shadow-md focus-visible:ring-2 focus-visible:ring-[var(--ft-accent)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="truncate text-base font-bold text-[var(--ft-text)]">
                      {room.firmName}
                    </h2>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-[var(--ft-muted)]">
                      <MapPin aria-hidden="true" className="size-3.5 shrink-0" />
                      <span className="truncate">
                        {room.cities.join(" · ") || "Location not stated"}
                      </span>
                    </p>
                  </div>
                  <FitRing score={room.fitScore} band={room.band} />
                </div>

                <p className="mt-3 line-clamp-2 text-sm leading-6 text-[var(--ft-muted)]">
                  {room.oneLiner}
                </p>

                <div className="mt-4 flex items-center justify-between gap-3 border-t border-[var(--ft-border)] pt-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
                        STATUS_STYLE[room.status],
                      )}
                    >
                      {formatRoomStatus(room.status)}
                    </span>
                    {room.isSample ? (
                      <span className="rounded-full border border-[var(--ft-border)] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[var(--ft-subtle)]">
                        Sample
                      </span>
                    ) : null}
                    {room.isThinRead ? (
                      <span
                        title="Built from very little public material; the drafted email needs a human pass."
                        className="rounded-full border border-[var(--ft-warn-border)] bg-[var(--ft-warn-bg)] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[var(--ft-warn-text)]"
                      >
                        Thin read
                      </span>
                    ) : null}
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--ft-accent)]">
                    {formatBand(room.band)}
                    <ArrowRight
                      aria-hidden="true"
                      className="size-3.5 transition-transform group-hover:translate-x-0.5"
                    />
                  </span>
                </div>
              </TransitionLink>
            ))}
          </div>
        )}
      </main>
    </AppShell>
  );
}
