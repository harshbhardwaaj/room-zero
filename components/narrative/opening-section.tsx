import { TransitionLink } from "@/components/view-transition-link";
import { ThemeToggle } from "@/components/theme-toggle";
import { brand } from "@/lib/brand";
import { icons } from "@/lib/icons";

export function OpeningSection() {
  const ArrowRight = icons.action;
  const Blocked = icons.blocked;
  const Success = icons.success;

  return (
    <section className="hero-motion relative min-h-dvh overflow-hidden bg-[var(--ft-bg)] text-[var(--ft-text)]">
      <div className="absolute inset-0 bg-[radial-gradient(1100px_560px_at_50%_42%,var(--ft-bg-soft)_0%,var(--ft-bg)_64%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(var(--ft-accent-rgb),0.055)_1px,transparent_1px),linear-gradient(90deg,rgba(var(--ft-accent-rgb),0.055)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(820px_480px_at_50%_44%,#000_0%,transparent_78%)]" />
      <div className="absolute right-5 top-5 z-20 sm:right-8 sm:top-8">
        <ThemeToggle />
      </div>

      <div className="relative z-10 mx-auto flex min-h-dvh measure-full items-center justify-center px-5 py-12 text-center sm:px-8 lg:px-12">
        <div className="measure-wide mx-auto flex flex-col items-center text-center">
          {/* Authorship first, and unmissable: this is Harsh's prototype. On the
              addressed build Fintalo's wordmark appears directly below, as the
              addressee — never as the byline. On the public build there is no
              addressee, so there is no logo and nothing implied. */}
          <div className="mb-8 flex flex-col items-center gap-3">
            <p className="inline-flex items-center gap-2 font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--ft-muted)] sm:text-xs">
              <span className="size-1.5 rounded-full bg-[var(--ft-accent)]" />
              {brand.hero.eyebrow}
            </p>
            {brand.addresseeLogo ? (
              <span className="rounded-lg bg-white px-4 py-2 shadow-sm ring-1 ring-[var(--ft-border)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={brand.addresseeLogo}
                  alt={brand.addressee ?? ""}
                  className="h-6 w-auto sm:h-7"
                />
              </span>
            ) : null}
          </div>

          <h1 className="w-full text-[clamp(1.3rem,3vw,2.6rem)] font-extrabold leading-[1.14] tracking-normal text-[var(--ft-text)]">
            <span className="block">{brand.hero.headlineTop}</span>
            {brand.hero.headlineMid ? (
              <span className="mt-3 block">{brand.hero.headlineMid}</span>
            ) : null}
            <span className="mt-3 block">
              {brand.hero.headlineLead}
              <span className="text-[var(--ft-accent)]">{brand.hero.headlineAccent}</span>
              {brand.hero.headlineTail}
            </span>
          </h1>

          <p className="measure mt-6 text-pretty text-base leading-relaxed text-[var(--ft-muted)] sm:text-lg">
            {brand.hero.subtitle}
          </p>

          <div className="relative mt-10 inline-flex items-center justify-center sm:mt-14">
            <div className="absolute -inset-x-8 -inset-y-5 rounded-full bg-[radial-gradient(closest-side,rgba(var(--ft-accent-rgb),0.28),transparent)] blur-xl [animation:hero-halo_2.8s_ease-in-out_infinite]" />
            <TransitionLink
              href="/problem"
              className="group relative inline-flex items-center gap-3 rounded-full bg-[var(--ft-accent)] px-9 py-4 text-lg font-extrabold text-[var(--ft-accent-text)] outline-none transition-all duration-200 ease-out hover:-translate-y-1 hover:scale-[1.02] hover:bg-[var(--ft-accent-hover)] active:translate-y-0 active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-[var(--ft-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ft-bg)] motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:hover:scale-100"
            >
              {brand.heroCta}
              <ArrowRight
                aria-hidden="true"
                className="size-5 transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
              />
            </TransitionLink>
          </div>

          {/* The whole argument, as a joke you get in one second: the merge-tag
              opener everybody sends, next to a line that could only have been
              written about one firm. The second line is a real grounded fact
              from a real room the pipeline actually built (Saxenhammer), not a
              fixture — on a page that promises nothing is invented, the hero
              had better not be. */}
          <figure className="pointer-events-none absolute bottom-8 right-5 hidden max-w-sm rounded-xl border border-[var(--ft-border)] bg-[var(--ft-surface)]/90 p-4 text-left backdrop-blur sm:right-8 sm:block lg:bottom-14 lg:right-12 [animation:hero-float_5s_ease-in-out_infinite]">
            <div className="flex items-start gap-2.5">
              <Blocked
                aria-hidden="true"
                className="mt-0.5 size-3.5 shrink-0 text-[var(--ft-subtle)]"
              />
              <p className="font-mono text-xs leading-5 text-[var(--ft-muted)] line-through decoration-[var(--ft-muted)]/70">
                Hi {"{{first_name}}"}, hope this finds you well!
              </p>
            </div>
            <div className="mt-3 flex items-start gap-2.5">
              <Success
                aria-hidden="true"
                className="mt-0.5 size-3.5 shrink-0 text-[var(--ft-success)]"
              />
              <p className="text-sm font-medium leading-5 text-[var(--ft-text)]">
                Saw you integrated the Frankfurt team from Clairfield Germany. Congratulations.
              </p>
            </div>
            <figcaption className="mt-2.5 pl-6 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ft-subtle)]">
              read from saxenhammer-co.com
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}
