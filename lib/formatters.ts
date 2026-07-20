import type { RoomStatus, ScoreBand, SignalType } from "@/types/room";

const defaultLocale = "en-US";

/** Full ISO timestamp, or a plain YYYY-MM-DD. Anything looser is not a date we
 * are willing to render as one. */
const STRICT_ISO_DATE = /^\d{4}-\d{2}-\d{2}(?:[T ]|$)/;

export function formatDate(
  value: string | number | Date,
  locale = defaultLocale,
  options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
  },
) {
  // Only strings that are unambiguously a full date get formatted. Everything
  // else is passed through exactly as extracted.
  //
  // This used to fall back on `Number.isNaN(new Date(value).getTime())`, which
  // does not do what it looks like it does: V8 parses "spring 2025" happily and
  // returns 1 January 2025, so the UI printed "Jan 1, 2025" for a date the
  // source never stated. Inventing a precise day out of a vague one is exactly
  // the failure this product exists to avoid, and it would have been invisible,
  // because a confident wrong date looks the same as a right one.
  if (typeof value === "string" && !STRICT_ISO_DATE.test(value)) {
    return value;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }
  return new Intl.DateTimeFormat(locale, options).format(date);
}

export function formatStatusFromSlug(slug: string) {
  return slug
    .split(/[-_]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

const roomStatusLabels: Record<RoomStatus, string> = {
  new: "Not contacted",
  contacted: "Contacted",
  replied: "Replied",
  demo_booked: "Demo booked",
};

export function formatRoomStatus(status: RoomStatus) {
  return roomStatusLabels[status] ?? formatStatusFromSlug(status);
}

const bandLabels: Record<ScoreBand, string> = {
  strong: "Strong fit",
  promising: "Promising",
  long_shot: "Long shot",
};

export function formatBand(band: ScoreBand) {
  return bandLabels[band] ?? formatStatusFromSlug(band);
}

const signalTypeLabels: Record<SignalType, string> = {
  new_mandate: "New mandate",
  new_hire: "New hire",
  site_relaunch: "Site relaunch",
  award: "Award",
  office_move: "Office move",
  fund_close: "Fund close",
  press: "In the press",
  content: "Published content",
  other: "Signal",
};

export function formatSignalType(type: SignalType) {
  return signalTypeLabels[type] ?? formatStatusFromSlug(type);
}

/** A domain from a URL, for compact source labels (e.g. "vogt-cf.de"). */
export function hostFromUrl(url: string): string {
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/**
 * The page part of a URL, for lists where every entry shares one host.
 *
 * The Sources panel used the host for all five links, so a room built from five
 * different pages of one site rendered as "saxenhammer-co.com" five times over:
 * a provenance list you cannot tell apart is not provenance. This labels each
 * one by the page it actually is, and calls the root "Home page" rather than
 * showing a bare slash.
 */
export function pathLabelFromUrl(url: string): string {
  try {
    const { pathname } = new URL(url);
    const trimmed = pathname.replace(/\/+$/, "");
    if (trimmed === "") {
      return "Home page";
    }
    return decodeURIComponent(trimmed);
  } catch {
    return url;
  }
}
