"use client";

import { useEffect, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { FitRing, BAND_COLOR } from "@/components/product/fit-ring";
import { TransitionLink } from "@/components/view-transition-link";
import { assessGrounding } from "@/lib/grounding";
import {
  formatBand,
  formatDate,
  formatRoomStatus,
  formatSignalType,
  hostFromUrl,
  pathLabelFromUrl,
} from "@/lib/formatters";
import { icons } from "@/lib/icons";
import { cn } from "@/lib/utils";
import type { FootprintItem, Person, Provenance, Room, RoomStatus, Signal } from "@/types/room";

const STATUS_OPTIONS: { id: RoomStatus; label: string }[] = [
  { id: "new", label: "Not contacted" },
  { id: "contacted", label: "Contacted" },
  { id: "replied", label: "Replied" },
  { id: "demo_booked", label: "Demo booked" },
];

/** Status is demo-local: persisted to localStorage per room so it survives a
 * refresh and feels real, without a backend. The pipeline could POST it later;
 * for now the room's own status seeds it. */
function useRoomStatus(id: string, initial: RoomStatus): [RoomStatus, (s: RoomStatus) => void] {
  const key = `fintalo-room-status:${id}`;
  const [status, setStatus] = useState<RoomStatus>(initial);
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(key) as RoomStatus | null;
      if (stored) setStatus(stored);
    } catch {
      /* ignore */
    }
  }, [key]);
  const update = (s: RoomStatus) => {
    setStatus(s);
    try {
      window.localStorage.setItem(key, s);
    } catch {
      /* ignore */
    }
  };
  return [status, update];
}

function SectionTitle({ icon: Icon, children }: { icon: (typeof icons)[keyof typeof icons]; children: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[var(--ft-accent)]">
      <Icon aria-hidden="true" className="size-4" />
      {children}
    </h2>
  );
}

function SourceLink({ url }: { url?: string }) {
  if (!url) return null;
  const ExternalLink = icons.externalLink;
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer noopener"
      className="inline-flex items-center gap-1 text-xs font-medium text-[var(--ft-accent)] hover:underline"
    >
      {hostFromUrl(url)}
      <ExternalLink aria-hidden="true" className="size-3" />
    </a>
  );
}

function ProvenanceNote({ provenance }: { provenance: Provenance }) {
  if (provenance.verified && provenance.sourceUrl && !provenance.note) {
    return <SourceLink url={provenance.sourceUrl} />;
  }
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5 text-xs text-[var(--ft-subtle)]">
      {provenance.sourceUrl ? <SourceLink url={provenance.sourceUrl} /> : null}
      {provenance.note ? <span className="italic">· {provenance.note}</span> : null}
    </span>
  );
}

function TechChip({ on, label, off }: { on: boolean; label: string; off: string }) {
  const Check = icons.success;
  const Dash = icons.pending;
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm",
        on
          ? "border-[var(--ft-accent)]/30 bg-[var(--ft-accent-soft)] text-[var(--ft-text)]"
          : "border-[var(--ft-border)] bg-[var(--ft-surface-2)] text-[var(--ft-subtle)]",
      )}
    >
      {on ? (
        <Check aria-hidden="true" className="size-4 shrink-0 text-[var(--ft-accent)]" />
      ) : (
        <Dash aria-hidden="true" className="size-4 shrink-0" />
      )}
      <span className="font-medium">{on ? label : off}</span>
    </div>
  );
}

function FootprintRow({ item }: { item: FootprintItem }) {
  const Quote = icons.quote;
  return (
    <li className="flex gap-3">
      <span className="mt-1 flex size-6 shrink-0 items-center justify-center rounded-md bg-[var(--ft-surface-3)] text-[var(--ft-muted)]">
        <Quote aria-hidden="true" className="size-3.5" />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-[var(--ft-text)]">{item.title}</p>
        <p className="mt-0.5 text-sm leading-6 text-[var(--ft-muted)]">{item.summary}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--ft-subtle)]">
          <span className="font-mono uppercase tracking-wide">{item.kind.replace(/_/g, " ")}</span>
          {item.date ? <span>· {item.date}</span> : null}
          {item.sourceUrl ? (
            <>
              <span>·</span>
              <SourceLink url={item.sourceUrl} />
            </>
          ) : null}
        </div>
      </div>
    </li>
  );
}

function PersonCard({ person }: { person: Person }) {
  const Target = icons.play;
  return (
    <div className="rounded-xl border border-[var(--ft-border)] bg-[var(--ft-surface)] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-base font-bold text-[var(--ft-text)]">{person.name}</p>
          <p className="text-sm text-[var(--ft-muted)]">{person.role}</p>
        </div>
        <ProvenanceNote provenance={person.provenance} />
      </div>
      {person.focus ? (
        <p className="mt-2 text-sm leading-6 text-[var(--ft-muted)]">{person.focus}</p>
      ) : null}

      {person.footprint.length > 0 ? (
        <ul className="mt-4 space-y-3">
          {person.footprint.map((item, i) => (
            <FootprintRow key={i} item={item} />
          ))}
        </ul>
      ) : (
        <p className="mt-3 rounded-lg border border-dashed border-[var(--ft-border)] px-3 py-2 text-xs text-[var(--ft-subtle)]">
          No public professional footprint found. Nothing invented to fill the gap.
        </p>
      )}

      {person.likelyPriorities.length > 0 ? (
        <div className="mt-4 rounded-lg bg-[var(--ft-surface-2)] p-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--ft-subtle)]">
            <Target aria-hidden="true" className="size-3.5" />
            Likely cares about · inference
          </p>
          <ul className="mt-2 space-y-1">
            {person.likelyPriorities.map((p, i) => (
              <li key={i} className="text-sm leading-6 text-[var(--ft-muted)]">
                {p}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

const SIGNAL_LABEL: Record<Signal["type"], string> = {
  new_mandate: "New mandate",
  new_hire: "New hire",
  site_relaunch: "Site relaunch",
  award: "Award",
  office_move: "Office move",
  fund_close: "Fund close",
  press: "Press",
  content: "Content",
  other: "Signal",
};

function SignalsTimeline({ signals }: { signals: Signal[] }) {
  if (signals.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-[var(--ft-border)] px-3 py-3 text-sm text-[var(--ft-subtle)]">
        No recent &ldquo;why now&rdquo; signals found. That absence is worth knowing too. This room
        isn&apos;t padded with a made-up event.
      </p>
    );
  }
  return (
    <ol className="relative space-y-5 border-l border-[var(--ft-border)] pl-5">
      {signals.map((s, i) => (
        <li key={i} className="relative">
          <span className="absolute -left-[1.42rem] top-1 size-2.5 rounded-full border-2 border-[var(--ft-surface)] bg-[var(--ft-accent)]" />
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[var(--ft-accent-soft)] px-2 py-0.5 text-[11px] font-semibold text-[var(--ft-accent)]">
              {SIGNAL_LABEL[s.type] ?? formatSignalType(s.type)}
            </span>
            {s.date ? <span className="text-xs text-[var(--ft-subtle)]">{s.date}</span> : null}
          </div>
          <p className="mt-1.5 text-sm font-semibold text-[var(--ft-text)]">{s.title}</p>
          {s.detail ? (
            <p className="mt-0.5 text-sm leading-6 text-[var(--ft-muted)]">{s.detail}</p>
          ) : null}
          {s.sourceUrl ? (
            <div className="mt-1">
              <SourceLink url={s.sourceUrl} />
            </div>
          ) : null}
        </li>
      ))}
    </ol>
  );
}

function CopyEmailButton({ subject, body }: { subject: string; body: string }) {
  const [copied, setCopied] = useState(false);
  const Copy = icons.write;
  const Check = icons.success;
  async function handle() {
    try {
      await navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }
  return (
    <button
      type="button"
      onClick={handle}
      className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--ft-border)] bg-[var(--ft-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--ft-muted)] transition-colors hover:text-[var(--ft-text)]"
    >
      {copied ? (
        <>
          <Check aria-hidden="true" className="size-3.5 text-[var(--ft-success)]" />
          Copied
        </>
      ) : (
        <>
          <Copy aria-hidden="true" className="size-3.5" />
          Copy email
        </>
      )}
    </button>
  );
}

export function RoomDetail({ room }: { room: Room }) {
  const [status, setStatus] = useRoomStatus(room.id, room.status);
  const { firm, people, signals, play, score } = room;
  const grounding = assessGrounding(room);

  const ArrowLeft = icons.action;
  const Firm = icons.firm;
  const People = icons.people;
  const SignalIcon = icons.signal;
  const Play = icons.play;
  const Fit = icons.fit;
  const Trust = icons.trust;
  const External = icons.externalLink;
  const Mail = icons.mail;
  const Warn = icons.error;

  return (
    <AppShell>
      <main
        id="main"
        className="mx-auto flex min-h-dvh measure-full page-gutter flex-col py-10 text-[var(--ft-text)]"
      >
        {/* Back + sample banner */}
        <TransitionLink
          href="/rooms"
          className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-[var(--ft-muted)] transition-colors hover:text-[var(--ft-text)]"
        >
          <ArrowLeft aria-hidden="true" className="size-4 rotate-180" />
          All rooms
        </TransitionLink>

        {room.isSample ? (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-[var(--ft-warn-border)] bg-[var(--ft-warn-bg)] px-4 py-3 text-sm text-[var(--ft-warn-text)]">
            <Warn aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            <span>
              <strong>Illustrative sample.</strong> This firm is a design fixture, not a
              live-verified firm. Generate a room from a real URL to see the pipeline&apos;s own output.
            </span>
          </div>
        ) : null}

        {/* Identity header */}
        <header className="mt-6 flex flex-col gap-5 rounded-2xl border border-[var(--ft-border)] bg-[var(--ft-surface)] p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2 font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--ft-subtle)]">
              <Firm aria-hidden="true" className="size-3.5" />
              {firm.cities.join(" · ") || "Location unknown"}
            </div>
            <h1 className="mt-2 text-2xl font-extrabold leading-tight sm:text-3xl">{firm.name}</h1>
            <p className="measure mt-2 text-sm leading-6 text-[var(--ft-muted)]">{firm.oneLiner}</p>
            <a
              href={firm.url}
              target="_blank"
              rel="noreferrer noopener"
              className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-[var(--ft-accent)] hover:underline"
            >
              {hostFromUrl(firm.url)}
              <External aria-hidden="true" className="size-3.5" />
            </a>
          </div>

          <div className="flex shrink-0 flex-col items-center gap-2">
            <FitRing score={score.total} band={score.band} size={84} stroke={7} />
            <span
              className="text-xs font-bold uppercase tracking-wide"
              style={{ color: BAND_COLOR[score.band] }}
            >
              {formatBand(score.band)}
            </span>
          </div>
        </header>

        {/* Status control */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="mr-1 font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--ft-subtle)]">
            Status
          </span>
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setStatus(opt.id)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
                status === opt.id
                  ? "border-[var(--ft-accent)] bg-[var(--ft-accent)] text-[var(--ft-accent-text)]"
                  : "border-[var(--ft-border)] bg-[var(--ft-surface)] text-[var(--ft-muted)] hover:text-[var(--ft-text)]",
              )}
            >
              {formatRoomStatus(opt.id)}
            </button>
          ))}
        </div>

        {/* Two-column body */}
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_20rem]">
          {/* Main column */}
          <div className="flex flex-col gap-10">
            {/* Firm intel */}
            <section className="flex flex-col gap-4">
              <SectionTitle icon={Firm}>Firm intel</SectionTitle>
              <div className="grid gap-3 sm:grid-cols-3">
                <TechChip
                  on={firm.techSignals.processEmailBased}
                  label="Email/Excel process"
                  off="Process not described as email-based"
                />
                <TechChip
                  on={firm.techSignals.mentionsDataRoom}
                  label="Mentions a data room"
                  off="No data room mentioned"
                />
                <TechChip
                  on={firm.techSignals.hasClientPortal}
                  label="Has a client portal"
                  off="No client portal found"
                />
              </div>
              {firm.techSignals.evidence.length > 0 ? (
                <ul className="space-y-1.5">
                  {firm.techSignals.evidence.map((e, i) => (
                    <li key={i} className="text-sm leading-6 text-[var(--ft-muted)]">
                      <span className="text-[var(--ft-subtle)]">Evidence: </span>
                      {e}
                    </li>
                  ))}
                </ul>
              ) : null}

              {/* Three stats, not four. "Sectors" was in this row and a firm
                  like Saxenhammer lists nine of them, which stretched every
                  cell in the grid to match and left Team size and Deals shown
                  as tall empty boxes. Sectors is a list, so it renders as a
                  labelled chip row alongside services, where lists belong.
                  "Not stated" on all three, matching each other: half the row
                  saying "Not stated" and half showing a bare dash read as two
                  different kinds of missing. */}
              <dl className="mt-1 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <Stat label="Team size" value={firm.teamSizeEstimate != null ? `~${firm.teamSizeEstimate}` : "Not stated"} />
                <Stat label="Deals shown" value={firm.tombstoneCount != null ? String(firm.tombstoneCount) : "Not stated"} />
                <Stat label="Cities" value={firm.cities.length ? firm.cities.join(", ") : "Not stated"} />
              </dl>

              <ChipRow label="Services" items={firm.services} />
              <ChipRow label="Sectors" items={firm.sectors} />

              {firm.fitNotes.length > 0 ? (
                <ul className="mt-1 space-y-2">
                  {firm.fitNotes.map((note, i) => (
                    <li key={i} className="flex gap-2 text-sm leading-6 text-[var(--ft-muted)]">
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-[var(--ft-accent)]" />
                      {note}
                    </li>
                  ))}
                </ul>
              ) : null}
              <ProvenanceNote provenance={firm.provenance} />
            </section>

            {/* People */}
            <section className="flex flex-col gap-4">
              <SectionTitle icon={People}>Who makes the call</SectionTitle>
              {/* A heading with nothing under it reads as a broken section. On a
                  firm whose site names nobody, the absence is the finding, and
                  saying so is the same discipline as the "why now" empty state
                  directly below. */}
              {people.length > 0 ? (
                <div className="grid gap-4">
                  {people.map((p, i) => (
                    <PersonCard key={i} person={p} />
                  ))}
                </div>
              ) : (
                <p className="rounded-lg border border-dashed border-[var(--ft-border)] px-3 py-3 text-sm text-[var(--ft-subtle)]">
                  No decision-makers are named anywhere on this firm&apos;s public pages. Worth
                  knowing before you write: there is no one to address by name yet, and nobody
                  has been invented to fill the gap.
                </p>
              )}
            </section>

            {/* Signals */}
            <section className="flex flex-col gap-4">
              <SectionTitle icon={SignalIcon}>Why now</SectionTitle>
              <SignalsTimeline signals={signals} />
            </section>

            {/* The play */}
            <section className="flex flex-col gap-4">
              <SectionTitle icon={Play}>The play</SectionTitle>

              <div className="rounded-xl border border-[var(--ft-border)] bg-[var(--ft-surface)] p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ft-subtle)]">
                  Angle
                </p>
                <p className="mt-1.5 text-sm leading-7 text-[var(--ft-text)]">{play.angle}</p>
              </div>

              {play.objections.length > 0 ? (
                <div className="space-y-3">
                  {play.objections.map((o, i) => (
                    <div
                      key={i}
                      className="rounded-xl border border-[var(--ft-border)] bg-[var(--ft-surface)] p-4"
                    >
                      <p className="text-sm font-semibold text-[var(--ft-text)]">{o.objection}</p>
                      <p className="mt-1.5 flex gap-2 text-sm leading-6 text-[var(--ft-muted)]">
                        <ArrowLeft aria-hidden="true" className="mt-1 size-3.5 shrink-0 text-[var(--ft-accent)]" />
                        {o.counter}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}

              {/* Opening email */}
              <div className="overflow-hidden rounded-xl border border-[var(--ft-border)] bg-[var(--ft-surface)]">
                <div className="flex items-center justify-between gap-3 border-b border-[var(--ft-border)] bg-[var(--ft-surface-2)] px-5 py-3">
                  <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--ft-subtle)]">
                    <Mail aria-hidden="true" className="size-4" />
                    Drafted opening
                  </span>
                  <CopyEmailButton subject={play.openingEmail.subject} body={play.openingEmail.body} />
                </div>
                <div className="px-5 py-4">
                  <p className="text-sm font-semibold text-[var(--ft-text)]">
                    Subject: {play.openingEmail.subject}
                  </p>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[var(--ft-muted)]">
                    {play.openingEmail.body}
                  </p>
                </div>
                {/* Three states, not two. A room built from one thin page still
                    returns a technically-true fact, and showing that with the
                    same confident styling as a Mergermarket ranking or a named
                    leadership change quietly breaks the one promise this
                    product makes. See lib/grounding.ts. */}
                <div
                  className={cn(
                    "flex items-start gap-2 border-t px-5 py-3 text-xs",
                    grounding.level === "grounded"
                      ? "border-[var(--ft-border)] bg-[var(--ft-accent-softer)] text-[var(--ft-muted)]"
                      : "border-[var(--ft-warn-border)] bg-[var(--ft-warn-bg)] text-[var(--ft-warn-text)]",
                  )}
                >
                  {grounding.level === "grounded" ? (
                    <Trust aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-[var(--ft-accent)]" />
                  ) : (
                    <Warn aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
                  )}

                  {grounding.level === "grounded" ? (
                    <span>
                      <strong>Grounded in one real fact:</strong> {play.openingEmail.groundedFact}{" "}
                      {play.openingEmail.groundedFactSourceUrl ? (
                        <SourceLink url={play.openingEmail.groundedFactSourceUrl} />
                      ) : null}
                    </span>
                  ) : grounding.level === "thin" ? (
                    <span>
                      <strong>Thin read. Check this before sending.</strong> The opener rests on
                      &ldquo;{play.openingEmail.groundedFact}&rdquo;, which may be true of most
                      firms rather than this one.
                      <ul className="mt-1.5 space-y-1">
                        {grounding.reasons.map((reason) => (
                          <li key={reason}>• {reason}</li>
                        ))}
                      </ul>
                    </span>
                  ) : (
                    <span>
                      <strong>Not grounded in an observed fact. Do not send.</strong> The pipeline
                      could not anchor this email to a verifiable detail.
                    </span>
                  )}
                </div>
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <aside className="flex flex-col gap-6 lg:sticky lg:top-8 lg:self-start">
            {/* Score breakdown */}
            <div className="rounded-2xl border border-[var(--ft-border)] bg-[var(--ft-surface)] p-5">
              <div className="flex items-center justify-between">
                <SectionTitle icon={Fit}>Fit score</SectionTitle>
                <span className="text-2xl font-extrabold tabular-nums text-[var(--ft-text)]">
                  {score.total}
                  <span className="text-sm font-semibold text-[var(--ft-subtle)]">/100</span>
                </span>
              </div>
              <p className="mt-1 text-xs text-[var(--ft-subtle)]">
                A transparent formula over extracted facts, not an AI-assigned number.
              </p>
              <ul className="mt-4 space-y-3">
                {score.components.map((c) => (
                  <li key={c.key}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-[var(--ft-text)]">{c.label}</span>
                      <span className="tabular-nums text-[var(--ft-muted)]">
                        {c.points}/{c.max}
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[var(--ft-surface-3)]">
                      <div
                        className="h-full rounded-full bg-[var(--ft-accent)]"
                        style={{ width: `${c.max ? (c.points / c.max) * 100 : 0}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs leading-5 text-[var(--ft-subtle)]">{c.rationale}</p>
                  </li>
                ))}
              </ul>
              <TransitionLink
                href="/how-it-works?step=3"
                className="mt-4 inline-block text-xs font-semibold text-[var(--ft-accent)] hover:underline"
              >
                How the score works →
              </TransitionLink>
            </div>

            {/* Unverified — the honesty panel */}
            {room.unverified.length > 0 ? (
              <div className="rounded-2xl border border-[var(--ft-warn-border)] bg-[var(--ft-warn-bg)] p-5">
                <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[var(--ft-warn-text)]">
                  <Warn aria-hidden="true" className="size-4" />
                  Flagged, not invented
                </p>
                <ul className="mt-3 space-y-2">
                  {room.unverified.map((u, i) => (
                    <li key={i} className="text-xs leading-5 text-[var(--ft-warn-text)]">
                      • {u}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="rounded-2xl border border-[var(--ft-border)] bg-[var(--ft-surface)] p-5">
                <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[var(--ft-success)]">
                  <icons.success aria-hidden="true" className="size-4" />
                  Every field sourced
                </p>
                <p className="mt-2 text-xs leading-5 text-[var(--ft-muted)]">
                  Nothing on this room was left unsourced. Each claim traces to a public page below.
                </p>
              </div>
            )}

            {/* Sources */}
            <div className="rounded-2xl border border-[var(--ft-border)] bg-[var(--ft-surface)] p-5">
              <SectionTitle icon={Trust}>Sources</SectionTitle>
              {/* Host once, then one line per page. Every source in a room comes
                  from the same site, so labelling each by host printed the same
                  string five times and told the reader nothing about which page
                  backed which claim. */}
              {room.sources.length > 0 ? (
                <p className="mt-2 font-mono text-[11px] text-[var(--ft-muted)]">
                  {hostFromUrl(room.sources[0])}
                </p>
              ) : null}
              <ul className="mt-2 space-y-1.5">
                {room.sources.map((s) => (
                  <li key={s}>
                    <a
                      href={s}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex items-center gap-1 text-xs font-medium text-[var(--ft-accent)] hover:underline"
                    >
                      {pathLabelFromUrl(s)}
                      <External aria-hidden="true" className="size-3" />
                    </a>
                  </li>
                ))}
              </ul>
              <p className="mt-3 border-t border-[var(--ft-border)] pt-3 text-xs text-[var(--ft-subtle)]">
                Generated {formatDate(room.generatedAt)} · public pages only
              </p>
            </div>
          </aside>
        </div>
      </main>
    </AppShell>
  );
}

/** A labelled row of chips for list-shaped facts (services, sectors). Renders
 * nothing at all when the list is empty, rather than a labelled void. */
function ChipRow({ label, items }: { label: string; items: string[] }) {
  if (items.length === 0) {
    return null;
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ft-subtle)]">
        {label}
      </span>
      {items.map((item) => (
        <span
          key={item}
          className="rounded-full border border-[var(--ft-border)] bg-[var(--ft-surface-2)] px-2.5 py-1 text-xs font-medium text-[var(--ft-muted)]"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--ft-border)] bg-[var(--ft-surface-2)] px-3 py-2">
      <dt className="text-[11px] font-medium uppercase tracking-wide text-[var(--ft-subtle)]">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm font-semibold text-[var(--ft-text)]">{value}</dd>
    </div>
  );
}
