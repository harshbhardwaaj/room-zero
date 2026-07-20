/**
 * The steps of the "How it works" walkthrough.
 *
 * One route, six steps, selected by `?step=N`. `step` is the canonical link
 * target; `id` survives as a stable React key and as the slide's own name in
 * the source. The walkthrough used to be a single scroll with `#id` anchors,
 * which is why the ids are still shaped like anchors.
 */
/**
 * `label` is the descriptive name, used in the nav rail where there is a full
 * column to spend. `short` is for the step chips on the walkthrough itself,
 * where six of them share one row: the descriptive labels were long enough that
 * the row either wrapped the sixth chip onto a line of its own or truncated to
 * "Extract to a s…", and a clipped label is worse than a short one. The chip
 * does not need to carry the whole idea anyway, because the slide's real title
 * sits directly beneath it.
 */
export const THESIS_STEPS = [
  { step: 0, id: "shape", label: "The shape of it", short: "Shape" },
  { step: 1, id: "fetch", label: "Fetch, politely", short: "Fetch" },
  { step: 2, id: "extract", label: "Extract to a schema", short: "Extract" },
  { step: 3, id: "score", label: "Score with a formula", short: "Score" },
  { step: 4, id: "play", label: "The play, grounded", short: "The play" },
  { step: 5, id: "boundary", label: "The public-data line", short: "Data line" },
] as const;

export type ThesisStep = (typeof THESIS_STEPS)[number];
