import type { Room } from "@/types/room";

/**
 * Browser-side holding pen for rooms generated on a deployed build.
 *
 * The pipeline writes each finished room to data/rooms/generated/ (lib/rooms.ts),
 * which works locally and cannot work on a serverless host, where the filesystem
 * is read-only. The write failure is already caught, so the room still comes
 * back from the API — but the client then navigates to /rooms/<id>, that page
 * reads the store, finds nothing, and 404s. A minute of work and two paid model
 * calls ending on a not-found page.
 *
 * A room generated live is worth exactly one sitting: the visitor wants to read
 * the thing they just asked for, not to build a library. So it lives in
 * sessionStorage — survives a reload, dies with the tab, needs no database and
 * no writable disk. Locally the disk write succeeds and none of this is reached,
 * which keeps one behaviour for the demo and one for real use.
 */

const PREFIX = "room-zero:room:";

function store(): Storage | null {
  // Guarded rather than assumed: these run during SSR too, where there is no
  // window, and Safari throws on sessionStorage access in private mode instead
  // of returning null.
  try {
    return typeof window === "undefined" ? null : window.sessionStorage;
  } catch {
    return null;
  }
}

export function stashRoom(room: Room): void {
  const s = store();
  if (!s) return;
  try {
    s.setItem(`${PREFIX}${room.id}`, JSON.stringify(room));
  } catch {
    // Quota, private mode, whatever. The room is still on screen; losing the
    // copy costs a reload, so there is nothing worth interrupting the user for.
  }
}

export function readStashedRoom(id: string): Room | null {
  const s = store();
  if (!s) return null;
  try {
    const raw = s.getItem(`${PREFIX}${id}`);
    return raw ? (JSON.parse(raw) as Room) : null;
  } catch {
    return null;
  }
}

export function readStashedRooms(): Room[] {
  const s = store();
  if (!s) return [];
  const rooms: Room[] = [];
  try {
    for (let i = 0; i < s.length; i += 1) {
      const key = s.key(i);
      if (!key?.startsWith(PREFIX)) continue;
      const raw = s.getItem(key);
      if (!raw) continue;
      try {
        rooms.push(JSON.parse(raw) as Room);
      } catch {
        // One unreadable entry should not cost the rest of the list.
      }
    }
  } catch {
    return [];
  }
  return rooms;
}
