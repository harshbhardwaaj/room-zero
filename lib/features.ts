/**
 * Live room generation is the one part of this app that cannot run on a
 * serverless host. `saveRoom` (lib/rooms.ts) writes the finished room to
 * data/rooms/generated/, and that filesystem is read-only on Vercel, so a
 * deployed run would fetch the site, spend an OpenAI call, then fail on write.
 *
 * Gating it off also closes the endpoint. /api/generate-room is unauthenticated
 * and spends real API credits per call, so a public deploy with generation left
 * on is an open billing endpoint for anyone who finds the URL.
 *
 * Unset (the deployed default) => the 22 committed rooms render as a gallery.
 * Set to "true" locally => the full product, generator included, unchanged.
 */
export const roomGenerationEnabled =
  process.env.NEXT_PUBLIC_ENABLE_ROOM_GENERATION === "true";
