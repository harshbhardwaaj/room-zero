type BrandMarkProps = {
  className?: string;
};

/**
 * The product's own mark, used in the chrome on every build.
 *
 * It's the same glyph whether the build is public ("Room Zero") or addressed to
 * Fintalo — because it's the *product's* mark, not the addressee's. On the
 * addressed build, Fintalo's name is carried by the nav title and their wordmark
 * appears once in the hero as the salutation (see opening-section). We never put
 * a reconstructed Fintalo logo in the chrome, which would imply the app is a
 * property of theirs. It is not: the byline is always Harsh's.
 *
 * Painted from --ft-accent, so it takes each build's palette (navy on Fintalo,
 * indigo on the public build) and works in light and dark.
 */
export function BrandMark({ className }: BrandMarkProps) {
  return <RoomZeroMark className={className} />;
}

/** A room, and the one thing inside it worth walking in for. The rounded square
 * is the room; the chevron enters toward a single focal point — the deal of
 * winning that customer. */
export function RoomZeroMark({ className }: BrandMarkProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      stroke="var(--ft-accent)"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="5" y="5" width="38" height="38" rx="11" />
      <path d="M15 17 L21 24 L15 31" />
      <circle cx="30" cy="24" r="3" fill="var(--ft-accent)" stroke="none" />
    </svg>
  );
}
