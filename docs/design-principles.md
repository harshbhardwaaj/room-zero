# Design principles

The rules this repo is held to. Adapted for Room Zero from the design system of
the author's earlier project, OrderMatch Lab, whose `docs/ux-product-playbook.md`,
`docs/design-system/copy-principles.md`, `docs/design-system/component-rules.md`
and `docs/design-system/visual-direction.md` these consolidate.

They lived only in that sibling repo, which meant this codebase was being held to
rules it did not contain. Anything project-specific to OrderMatch (order queues,
SKU matching, ERP readiness) has been dropped; what remains is what actually
governs this build.

## The core principle

**Good UI attracts attention. Good UX earns trust.**

Do not design only the happy path. Every meaningful screen or section defines what
the user sees when things are loading, successful, broken, empty, partial or
uncertain.

---

## Copy

### No em dashes or en dashes. Anywhere in reviewer-facing text.

This is the single loudest signal that a machine wrote something, and it is the
rule most likely to be broken by accident, because models produce them constantly.

It applies to app copy, CTA copy, candidate proof, README and any other text a
reviewer reads. It does **not** apply to source comments or internal notes.

It is enforced in three places, in increasing order of reliability:

1. Both LLM prompts ban dashes explicitly.
2. `lib/pipeline/prose.ts` strips them from all model output deterministically.
3. Tests in `lib/pipeline/prose.test.ts` pin the behaviour.

The replacement is a comma, always. A period would read better in some places,
but choosing between them means guessing where a sentence ends, and a wrong guess
invents a sentence boundary. A comma can at worst produce a mild splice, which no
reader notices; an invented sentence break is a visible error.

### Banned words

Do not use in product or reviewer-facing copy: synergy, leverage (as a verb),
passionate, thrilled, excited to apply, detail-oriented, team player, hardworking,
results-driven, dynamic, innovative, spearheaded, utilized, impactful,
cutting-edge, additionally, showcase, testament, underscore, vibrant, pivotal,
crucial, delve, fostering, align with, landscape (as an abstract noun), tapestry,
intricate, garner, highlight (as a verb), interplay, enduring, valuable, enhance,
emphasizing, seamless, revolutionary, next-generation, transformative.

### Voice

Direct, confident, specific, plain-spoken, honest about what is simulated. Serious
without being stiff. The product should sell through evidence, not adjectives.

### Error copy formula

1. What happened.
2. Why it likely happened.
3. What to do next.

Never expose raw backend, model, provider or filesystem errors. "Something went
wrong" is equally unacceptable when the user needs to know the consequence.

### Empty state formula

1. Why this area is empty.
2. What will appear here.
3. The next useful action.

An empty state must never be a blank space under a heading. On this product an
absence is often the finding, so say so: *"No decision-makers are named anywhere
on this firm's public pages… nobody has been invented to fill the gap."*

### CTAs

The final CTA is direct and asks for the thing. Do not end timid or vague.

---

## Components and layout

- Cards are for **repeated items** and framed tools. A page section is not a
  floating card, and cards do not nest inside cards.
- Prefer full-width bands or unframed layouts for narrative sections.
- Every major section owns its own loading, error, empty and partial state.
- Make uncertainty visible. Low confidence is not failure; hidden uncertainty is.
- Icons come from `lucide-react`, via `lib/icons.ts`. Do not import them ad hoc.
- Status uses colour **plus** text or an icon, never colour alone.
- Semantic colour goes through CSS variables (`--ft-warn-*`, `--ft-ok-*`,
  `--ft-accent*`). Never literal Tailwind palette classes like `amber-50`: they do
  not know what theme they are in, and this app has a dark mode.

### Measures

Use the `.measure` utilities in `globals.css` rather than hardcoding `max-w-*` on
every block. A fixed rem cap is a guess about one screen size.

- `.measure` for body copy and anything read left to right
- `.measure-wide` for headlines and short lines that can run longer
- `.measure-full` for cards, tables and grids: things laid out, not read

Apply `text-balance` to display headings. Without it a wrap can strand a two-word
orphan on its own line, which reads as an accident rather than a choice.

---

## Screen states

Every meaningful screen or independent section handles:

- **Loading.** Use the loader that matches the wait. Under one second, no loader
  at all: a flashing spinner makes a fast app feel slow. Past ten seconds, use
  progress or steps, never an endless loop. Room reads are sub-second disk reads
  and deliberately have no skeleton; room *generation* takes 20-60s and has staged
  progress.
- **Success.** The user can tell it worked.
- **Error.** Specific, placed near the problem, with a recovery path.
- **Empty.** Explains itself, per the formula above.
- **Partial.** One failed section does not break the page.

---

## Layout and fold

Every page states a purpose and argues its trade-offs.

If content can be compressed enough to bring the primary action on screen,
compress it. If the content genuinely needs the room, the action sitting below the
fold is acceptable, but it should be a stated choice rather than an accident.

A stepper is the exception: its Back/Next controls are pinned, because the control
that advances the flow must never require hunting for it.

Judge all of this at a real laptop viewport (1440x900), not a narrow pane. Note
that a real browser with chrome is nearer 780-800px tall, so "above the fold at
900" is already optimistic.

---

## Anti-patterns

Do not use:

- Generic AI-chatbot framing, or vague "agent magic" visuals
- Oversized marketing sections after the opening
- Decorative blobs, bokeh, abstract orbs, purple gradient overload
- Fake complexity that does not clarify the workflow
- Resume-first content hierarchy
- Hidden uncertainty
- Blank empty states
- Raw technical error text
- Tooltips as the only way to understand a critical state

---

## The rule specific to this product

**Never show invented data as though it were observed.**

This is the whole pitch, so it binds the interface as much as the pipeline. Two
concrete consequences that have already bitten:

- The hero once displayed a fabricated firm and a fabricated fit score as if they
  were pipeline output. The landing page of a product promising nothing is
  invented cannot itself be inventing.
- `formatDate` once turned the extracted string "spring 2025" into "Jan 1, 2025",
  because `new Date()` parses it happily. A confident wrong date is
  indistinguishable from a right one, which is what makes it dangerous.

Hand-authored fixtures are allowed, but they carry `isSample`, they say so in the
UI, and they never outrank real pipeline output in any sort order.
