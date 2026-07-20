import { Calendar, Github, Linkedin, Phone } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { brand } from "@/lib/brand";
import { CopyEmailLink } from "@/components/narrative/copy-email-link";
import { PRIMARY_CONTACT_CARD_CLASS, PRIMARY_CONTACT_ICON_CLASS } from "@/lib/contact-card-styles";

const EMAIL = "harshbhardwaaj29@gmail.com";
const PHONE_DISPLAY = "+49 1525 2454724";
const PHONE_HREF = "tel:+4915252454724";

const secondaryLinks = [
  {
    label: "GitHub",
    href: "https://github.com/harshbhardwaaj",
    icon: Github,
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/harshbhaardwaj/",
    icon: Linkedin,
  },
] as const;

export default function ContactPage() {
  return (
    <AppShell>
      <main
        id="main"
        // justify-center: this page is short by design, and top-aligning it in
        // a full-height main left the bottom half of the screen empty.
        className="relative mx-auto flex min-h-dvh measure-full page-gutter flex-col justify-center py-10 text-[var(--ft-text)]"
      >
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(900px_440px_at_58%_18%,rgba(var(--ft-accent-rgb),0.12),transparent_62%),var(--ft-bg)]" />

        <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-[var(--ft-accent)]">
          Get in touch
        </p>
        <h1 className="mt-4 text-3xl font-extrabold leading-tight text-[var(--ft-text)] sm:text-4xl">
          {brand.contactHeadline}
        </h1>
        {/* The ask first, logistics second. This page previously opened with
            "Book a call, email, or call directly, whichever is easiest", which
            is a menu of channels, not a request. The last page of a pitch has
            to say what is actually being asked for. */}
        <p className="measure mt-4 text-lg leading-8 text-[var(--ft-text)]">
          {brand.contactAsk}
        </p>
        <p className="mt-3 text-sm leading-6 text-[var(--ft-muted)]">
          Whichever of these is easiest.
        </p>

        <section
          aria-label="Primary contact actions"
          className="mt-8 grid gap-4 sm:grid-cols-3"
        >
          <a
            href="https://calendly.com/harshbhardwaaj29/chat-with-harsh"
            rel="noreferrer"
            target="_blank"
            className={PRIMARY_CONTACT_CARD_CLASS}
          >
            <span className={PRIMARY_CONTACT_ICON_CLASS}>
              <Calendar aria-hidden="true" className="size-5" />
            </span>
            <span className="text-base font-bold text-[var(--ft-text)]">Book a call</span>
            <span className="text-sm text-[var(--ft-muted)]">Pick a time on Calendly</span>
          </a>

          <CopyEmailLink email={EMAIL} />

          <a href={PHONE_HREF} className={PRIMARY_CONTACT_CARD_CLASS}>
            <span className={PRIMARY_CONTACT_ICON_CLASS}>
              <Phone aria-hidden="true" className="size-5" />
            </span>
            <span className="text-base font-bold text-[var(--ft-text)]">Call</span>
            <span className="text-sm text-[var(--ft-muted)]">{PHONE_DISPLAY}</span>
          </a>
        </section>

        <section
          aria-label="Other links"
          className="mt-10 flex flex-wrap items-center gap-3 border-t border-[var(--ft-border)] pt-6"
        >
          <span className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--ft-subtle)]">
            Also here
          </span>
          {secondaryLinks.map((link) => {
            const Icon = link.icon;
            return (
              <a
                key={link.label}
                href={link.href}
                rel="noreferrer"
                target="_blank"
                className="inline-flex items-center gap-1.5 rounded-full border border-[var(--ft-border)] px-3.5 py-1.5 text-sm font-medium text-[var(--ft-muted)] outline-none transition-colors duration-200 hover:border-[var(--ft-border-strong)] hover:text-[var(--ft-text)] focus-visible:ring-2 focus-visible:ring-[var(--ft-accent)]"
              >
                <Icon aria-hidden="true" className="size-3.5" />
                {link.label}
              </a>
            );
          })}
        </section>
      </main>
    </AppShell>
  );
}
