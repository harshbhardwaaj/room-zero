import OpenAI from "openai";

/**
 * The single place the OpenAI key is read and used. Server-side only — this
 * module must never be imported into a client component, so the key never
 * reaches the browser. The key lives in .env.local (OPENAI_API_KEY).
 */

export class LlmError extends Error {}

let client: OpenAI | null = null;

export function getClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new LlmError(
      "No OPENAI_API_KEY set. Add it to .env.local to run the live pipeline.",
    );
  }
  if (!client) {
    client = new OpenAI({ apiKey, timeout: 90_000 });
  }
  return client;
}

// gpt-5.4-mini is the default: newest mini, structured-output capable, and what
// this codebase's lineage already used. Override with OPENAI_MODEL if needed.
export const MODEL = process.env.OPENAI_MODEL ?? "gpt-5.4-mini";

type StructuredArgs = {
  system: string;
  user: string;
  schemaName: string;
  schema: Record<string, unknown>;
  /** Extraction uses 0 (deterministic, thorough facts); the play uses a little
   * more so the email reads naturally. */
  temperature?: number;
};

/**
 * One structured-output call: the model is forced to return JSON matching
 * `schema` exactly (Structured Outputs, strict). Returns the parsed object.
 */
export async function structuredCompletion<T>({
  system,
  user,
  schemaName,
  schema,
  temperature = 0,
}: StructuredArgs): Promise<T> {
  const openai = getClient();

  let content: string | null | undefined;
  try {
    const response = await openai.chat.completions.create({
      model: MODEL,
      temperature,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: {
        type: "json_schema",
        json_schema: { name: schemaName, schema, strict: true },
      },
    });
    const choice = response.choices[0];
    if (choice?.message?.refusal) {
      throw new LlmError(`Model refused: ${choice.message.refusal}`);
    }
    content = choice?.message?.content;
  } catch (err) {
    if (err instanceof LlmError) throw err;
    const detail = err instanceof Error ? err.message : String(err);
    throw new LlmError(`OpenAI request failed: ${detail}`);
  }

  if (!content) {
    throw new LlmError("OpenAI returned an empty response.");
  }
  try {
    return JSON.parse(content) as T;
  } catch {
    throw new LlmError("OpenAI returned invalid JSON.");
  }
}
