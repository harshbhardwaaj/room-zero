import { promises as fs } from "node:fs";
import path from "node:path";

import { SAMPLE_ROOMS } from "@/data/rooms/samples";
import { isThinRead } from "@/lib/grounding";
import { toRoomSummary, type Room, type RoomSummary } from "@/types/room";

/**
 * Server-side room store. Reads run in Server Components / Route Handlers only
 * (Node fs), never in the browser.
 *
 * Two sources, merged:
 *   - hand-authored samples (data/rooms/samples.ts), always present.
 *   - live-generated rooms in data/rooms/generated/*.json. Generated rooms
 *     shadow a sample with the same id.
 *
 * Generated rooms live in `data/`, not `.cache/`, and that distinction matters.
 * They started out under `.cache/rooms/`, which `.gitignore` excludes wholesale,
 * so the 22 real firm rooms this demo is built on were never version-controlled
 * and a deployed build would have shipped with only the three fixtures. The raw
 * HTML in `.cache/html/` genuinely is disposable (38MB of it, re-fetchable on
 * demand). The rooms are not: they are the content, they took real API calls to
 * produce, and they are what a reviewer actually comes here to read.
 */

const STORE_DIR = path.join(process.cwd(), "data", "rooms", "generated");

async function ensureStoreDir(): Promise<void> {
  await fs.mkdir(STORE_DIR, { recursive: true });
}

function roomPath(id: string): string {
  // ids are slugs from slugify(); still guard against path traversal.
  const safe = id.replace(/[^a-z0-9-]/gi, "");
  return path.join(STORE_DIR, `${safe}.json`);
}

async function readGeneratedRooms(): Promise<Room[]> {
  try {
    const files = await fs.readdir(STORE_DIR);
    const rooms = await Promise.all(
      files
        .filter((f) => f.endsWith(".json"))
        .map(async (f) => {
          try {
            const raw = await fs.readFile(path.join(STORE_DIR, f), "utf8");
            return JSON.parse(raw) as Room;
          } catch {
            return null;
          }
        }),
    );
    return rooms.filter((r): r is Room => r !== null);
  } catch {
    // Store dir doesn't exist yet — no generated rooms.
    return [];
  }
}

/** All rooms, generated shadowing samples by id, newest first. */
export async function getAllRooms(): Promise<Room[]> {
  const generated = await readGeneratedRooms();
  const generatedIds = new Set(generated.map((r) => r.id));
  const samples = SAMPLE_ROOMS.filter((r) => !generatedIds.has(r.id));
  const all = [...generated, ...samples];
  return all.sort(
    (a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime(),
  );
}

export async function listRoomSummaries(): Promise<RoomSummary[]> {
  const rooms = await getAllRooms();
  return rooms.map((room) => toRoomSummary(room, isThinRead(room)));
}

export async function getRoom(id: string): Promise<Room | null> {
  const generated = await readGeneratedRooms();
  const found = generated.find((r) => r.id === id);
  if (found) return found;
  return SAMPLE_ROOMS.find((r) => r.id === id) ?? null;
}

/** Persist a generated room to the disk cache. */
export async function saveRoom(room: Room): Promise<void> {
  await ensureStoreDir();
  await fs.writeFile(roomPath(room.id), JSON.stringify(room, null, 2), "utf8");
}

export async function getGeneratedIds(): Promise<string[]> {
  const generated = await readGeneratedRooms();
  return generated.map((r) => r.id);
}
