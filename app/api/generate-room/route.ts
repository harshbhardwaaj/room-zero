import { NextResponse } from "next/server";

import { generateRoom, FetchError, LlmError } from "@/lib/pipeline";
import { roomGenerationEnabled } from "@/lib/features";

// The pipeline fetches + calls OpenAI; give it room to run and never cache.
export const runtime = "nodejs";
export const maxDuration = 120;
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  // Closed on the deployed build. Hiding the form is not enough on its own:
  // this route is unauthenticated and every call spends OpenAI credit, so the
  // gate has to sit here where a direct POST also hits it.
  if (!roomGenerationEnabled) {
    return NextResponse.json(
      { error: "Live generation is off on this build. The rooms shown were generated locally." },
      { status: 403 },
    );
  }

  let input: string;
  try {
    const body = await request.json();
    input = typeof body?.input === "string" ? body.input : "";
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!input.trim()) {
    return NextResponse.json({ error: "Enter a firm URL to open a room." }, { status: 400 });
  }

  try {
    const room = await generateRoom(input, new Date().toISOString());
    return NextResponse.json({ room });
  } catch (err) {
    if (err instanceof FetchError) {
      // A bad/unreachable URL is the user's input problem — 400.
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    if (err instanceof LlmError) {
      // The model call failed (key, quota, timeout). 502: not the user's input.
      return NextResponse.json({ error: err.message }, { status: 502 });
    }

    // Anything else is unexpected, so it goes to the server log and the user
    // gets a sentence they can act on. This used to interpolate `err.message`
    // straight into the response, which the UX playbook rules out ("never
    // expose raw backend, model, database or provider errors") and which on a
    // deployed build would have printed absolute server paths into the browser
    // the first time a filesystem write failed.
    console.error("[generate-room] unexpected pipeline failure:", err);
    return NextResponse.json(
      {
        error:
          "The pipeline failed partway through building this room. Nothing was saved. Try again, and if it keeps failing that firm's site is probably the cause.",
      },
      { status: 500 },
    );
  }
}
