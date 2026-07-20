"use client";

import { useEffect, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { RoomDetail } from "@/components/product/room-detail";
import { TransitionLink } from "@/components/view-transition-link";
import { readStashedRoom } from "@/lib/session-rooms";
import type { Room } from "@/types/room";

/**
 * Reached when the server store has no room under this id. On a deployed build
 * that is the normal path for a room generated moments ago: the write to disk
 * could not happen, so the only copy is the one the browser stashed when the
 * pipeline returned (lib/session-rooms.ts).
 *
 * `undefined` means sessionStorage has not been read yet. It has to be read in
 * an effect rather than during render, because the server renders this too and
 * has no sessionStorage — reading during render would hand the client different
 * markup than the server produced and break hydration.
 */
export function RoomFallback({ firmId }: { firmId: string }) {
  const [room, setRoom] = useState<Room | null | undefined>(undefined);

  useEffect(() => {
    setRoom(readStashedRoom(firmId));
  }, [firmId]);

  if (room === undefined) {
    // One frame, maybe two. A spinner here would flash for no reason.
    return null;
  }

  if (room) return <RoomDetail room={room} />;

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl px-6 py-24">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--ft-subtle)]">
          No room here
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-[var(--ft-text)]">
          That room isn&apos;t open.
        </h1>
        <p className="mt-4 text-sm leading-6 text-[var(--ft-muted)]">
          Rooms built on this deployment live in the tab that made them, so they do not
          survive a new tab or a shared link. The committed rooms are always there.
        </p>
        <TransitionLink
          href="/rooms"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[var(--ft-accent)] px-5 py-3 text-sm font-bold text-[var(--ft-accent-text)] transition-colors hover:bg-[var(--ft-accent-hover)]"
        >
          Back to the rooms
        </TransitionLink>
      </div>
    </AppShell>
  );
}
