"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, ExternalLink, Github } from "lucide-react";
import { brand } from "@/lib/brand";

import { AppShell } from "@/components/app-shell";
import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";
import { TransitionLink } from "@/components/view-transition-link";
import { cn } from "@/lib/utils";

type ProofLink =
  | { state: "live"; label: string; href: string; icon?: "external" | "github" }
  | { state: "unavailable"; note: string }
  | { state: "none"; note: string };

type ProofCard = {
  id: string;
  kind: string;
  title: string;
  tagline: string;
  capability: string;
  points: string[];
  mapping: string;
  links?: ProofLink[];
};

const CARDS: ProofCard[] = [
  {
    id: "alevor",
    kind: "Work project",
    title: "AI Classification System",
    tagline: "Built at ALEVOR Mittelstandspartner, classifying 380,000 companies with no reliable industry data.",
    capability: "Classification and evaluation",
    points: [
      "Labeled 200 companies by hand as a ground-truth set for a database with no reliable industry classification.",
      "Benchmarked 13 prompt variants across multiple models, scored on accuracy, similarity, and F1.",
      "Deployed the winning prompt to classify 320,000+ companies in production.",
      "Cut manual classification time by about 30%.",
    ],
    mapping:
      "Relevant here because Room Zero solves the same shape of problem: turn messy real data (a company website) into a structured decision, measure it against ground truth, and trust only the read that's actually sourced.",
    links: [{ state: "none", note: "Built inside ALEVOR's internal systems, no public link." }],
  },
  {
    id: "investment-analyst",
    kind: "Personal project",
    title: "AI Investment Analyst",
    tagline: "Shipped a full financial analysis tool solo, in a day.",
    capability: "Full-stack build and deploy",
    points: [
      "Enter a stock ticker, get a full investment memo in return.",
      "Memo covers trading comps, a DCF with WACC decomposition, an LBO screen, and an AI-written thesis.",
      "Every financial calculation runs in Python, not the language model.",
      "Claude is used only for the qualitative sections.",
    ],
    mapping:
      `Relevant here because ${brand.proofAudience} needs builders who can connect UI, business logic, and a real deployment, and who know which parts of a system a language model should and should not touch.`,
    links: [
      { state: "live", label: "View live tool", href: "https://ai-investment-analyst-harsh.vercel.app", icon: "external" },
      { state: "live", label: "View code", href: "https://github.com/harshbhardwaaj/ai-investment-analyst", icon: "github" },
    ],
  },
  {
    id: "cv-scorer",
    kind: "Personal project",
    title: "CV-JD Fit Scorer",
    tagline: "Built a structured-extraction tool from scratch.",
    capability: "Structured output from an LLM",
    points: [
      "Scores a candidate against a job description using the Claude API.",
      "PDF text extraction feeds a structured JSON output pipeline.",
      "Built and shipped in one day, with no prior Streamlit experience.",
    ],
    mapping:
      "Relevant here because it is the same problem as Room Zero's extraction step: pull clean, structured fields out of messy input with the LLM, validated against a strict schema before anything downstream uses it.",
    links: [
      {
        state: "live",
        label: "View live tool",
        href: "https://cv-scorer-harsh.streamlit.app",
        icon: "external",
      },
    ],
  },
  {
    id: "coursework",
    kind: "Coursework",
    title: "TUM Coursework",
    tagline: "Studying the theory behind the choices in this prototype.",
    capability: "Academic grounding",
    points: [
      "Machine Learning, Causal Discovery and Experimentation.",
      "Big Data Analytics: neural networks and NLP, including the same lemmatization method used at ALEVOR.",
      "Applied Econometrics: statistical modeling and causal inference.",
      "Python for Engineering and Data Analysis, in progress, exam this semester.",
    ],
    mapping:
      "Relevant here because the methods behind this prototype (structured extraction, deterministic scoring, provenance and grounding) are not guesses. They come from the same territory as this coursework.",
  },
];

function useRevealOnScroll<T extends HTMLElement>(threshold = 0.25) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) {
      return;
    }

    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, inView };
}

function ProofLinkRow({ links }: { links: ProofLink[] }) {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
      {links.map((link, index) => {
        if (link.state === "live") {
          const Icon = link.icon === "github" ? Github : ExternalLink;
          return (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--ft-accent)] outline-none transition-colors hover:text-[var(--ft-accent-hover)] focus-visible:ring-2 focus-visible:ring-[var(--ft-accent)]"
            >
              {link.label}
              <Icon aria-hidden="true" className="size-3.5" />
            </a>
          );
        }

        return (
          <p key={index} className="text-xs leading-5 text-[var(--ft-subtle)]">
            {link.note}
          </p>
        );
      })}
    </div>
  );
}

function TimelineItem({ card, index }: { card: ProofCard; index: number }) {
  const { ref, inView } = useRevealOnScroll<HTMLDivElement>();

  return (
    <div ref={ref} className="relative pl-12 pb-16 last:pb-0 sm:pl-16">
      <span
        aria-hidden="true"
        className={cn(
          "absolute left-0 top-1 flex size-8 items-center justify-center rounded-full border-2 font-mono text-xs font-bold transition-all duration-500 ease-out motion-reduce:transition-none sm:size-9",
          inView
            ? "border-[var(--ft-accent)] bg-[var(--ft-accent)] text-[var(--ft-accent-text)]"
            : "border-[var(--ft-border)] bg-[var(--ft-surface)] text-[var(--ft-subtle)]",
        )}
      >
        {index + 1}
      </span>

      <div
        className={cn(
          "transition-all duration-700 ease-out motion-reduce:transition-none motion-reduce:opacity-100 motion-reduce:translate-y-0",
          inView ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
        )}
      >
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--ft-subtle)]">
          {card.kind}
        </p>
        <h2 className="mt-1 text-xl font-extrabold leading-snug text-[var(--ft-text)] sm:text-2xl">
          {card.title}
        </h2>
        <p className="mt-1 text-base font-medium leading-7 text-[var(--ft-muted)]">
          {card.tagline}
        </p>
        <ul className="mt-4 flex flex-col gap-2">
          {card.points.map((point) => (
            <li key={point} className="flex gap-2.5 text-base leading-7 text-[var(--ft-muted)]">
              <span
                aria-hidden="true"
                className="mt-2.5 size-1 shrink-0 rounded-full bg-[var(--ft-accent)]"
              />
              <span>{point}</span>
            </li>
          ))}
        </ul>
        <span className="mt-4 inline-flex w-fit items-center rounded-full border border-[var(--ft-accent-soft)] bg-[var(--ft-accent-soft)] px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--ft-accent)]">
          Relevant skill: {card.capability}
        </span>
        <p className="mt-3 border-l-2 border-[var(--ft-accent-soft)] pl-3 text-sm leading-6 text-[var(--ft-muted)]">
          {card.mapping}
        </p>
        {card.links ? <ProofLinkRow links={card.links} /> : null}
      </div>
    </div>
  );
}

export function CandidateProof() {
  return (
    <AppShell>
      <main
        id="main"
        className="measure-read page-gutter relative flex min-h-dvh flex-col py-10 text-[var(--ft-text)]"
      >
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(1000px_460px_at_60%_12%,rgba(var(--ft-accent-rgb),0.10),transparent_62%),var(--ft-bg)]" />

        <p className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.2em] text-[var(--ft-accent)]">
          <BrandMark className="size-4" />
          Why me
        </p>
        <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-normal text-[var(--ft-text)] sm:text-4xl">
          Why I think I can build this with you.
        </h1>

        {/* Plain prose, not a bordered card. Component rules: cards are for
            repeated items and framed tools, page sections are not floating
            cards. A boxed intro sitting above a boxed timeline was two framing
            devices arguing with each other. Also dropped "Scroll to go through
            it": telling a reader to scroll is instruction the page does not
            need to give. */}
        <p className="mt-6 text-base leading-7 text-[var(--ft-muted)]">
          You already saw the strongest proof. This whole prototype (the fetch, the schema
          extraction, the deterministic scoring, and the grounded play) was built for the outbound
          problem your product implies, not adapted from a template.{" "}
          <TransitionLink href="/rooms" className="font-semibold text-[var(--ft-accent)] hover:text-[var(--ft-accent-hover)]">
            Revisit the rooms
          </TransitionLink>{" "}
          or{" "}
          <TransitionLink href="/how-it-works" className="font-semibold text-[var(--ft-accent)] hover:text-[var(--ft-accent-hover)]">
            how it works
          </TransitionLink>
          . What follows is the range behind it.
        </p>

        <div className="relative mt-12">
          <span
            aria-hidden="true"
            className="absolute left-4 top-2 bottom-2 w-px bg-[var(--ft-border)] sm:left-[1.125rem]"
          />
          {CARDS.map((card, index) => (
            <TimelineItem key={card.id} card={card} index={index} />
          ))}
        </div>

        <footer className="mt-2 flex flex-col items-start gap-3 border-t border-[var(--ft-border)] pt-6 sm:flex-row sm:items-center sm:justify-between">
          <TransitionLink
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-[var(--ft-border)] bg-[var(--ft-surface)] px-5 py-3 text-sm font-semibold text-[var(--ft-muted)] outline-none transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--ft-border-strong)] hover:text-[var(--ft-text)] focus-visible:ring-2 focus-visible:ring-[var(--ft-accent)]"
          >
            Back to start
          </TransitionLink>
          <Button
            asChild
            className="bg-[var(--ft-accent)] text-[var(--ft-accent-text)] hover:bg-[var(--ft-accent-hover)]"
          >
            <TransitionLink href="/contact">
              Next step
              <ArrowRight aria-hidden="true" />
            </TransitionLink>
          </Button>
        </footer>
      </main>
    </AppShell>
  );
}
