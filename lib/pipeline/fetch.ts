import { promises as fs } from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

/**
 * The fetch pass. Public pages only, politely, cached to disk.
 *
 * - one request at a time, with a delay between, and a real user-agent, so it
 *   reads like a browser and not a scraper.
 * - every fetched page is written to .cache/html/…; a re-run (or prompt
 *   iteration) reads the cache and never touches the firm's server again.
 * - discovery is keyword-based over the homepage's own links: team, about,
 *   transactions, services — German and English. Same host only, capped.
 */

const CACHE_DIR = path.join(process.cwd(), ".cache", "html");
const FETCH_TIMEOUT_MS = 12_000;
const POLITE_DELAY_MS = 700;
const MAX_PAGES = 6;
const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 7; // a week; the web moves slowly here

const USER_AGENT =
  "Mozilla/5.0 (compatible; RoomZeroBot/0.1; +local prototype; polite, public pages only)";

// Link text / href fragments that mark a page worth reading, most useful first.
const PAGE_KEYWORDS: { key: string; terms: string[] }[] = [
  { key: "team", terms: ["team", "über-uns", "ueber-uns", "about", "people", "partner", "wer-wir-sind"] },
  { key: "transactions", terms: ["transaktion", "transaction", "deals", "referenz", "mandate", "track-record", "track_record", "case", "projekte"] },
  // "kompetenzen" and "loesungen" are how a lot of German firms label the page
  // that actually describes what they do; without them PEBCO's real M&A page
  // (26k characters of it) was never a discovery candidate.
  { key: "services", terms: ["leistung", "services", "was-wir", "expertise", "beratung", "advisory", "kompetenz", "loesung", "lösung", "angebot"] },
  { key: "about", terms: ["about", "unternehmen", "kanzlei", "firm", "philosophie", "prozess", "process", "approach"] },
  { key: "news", terms: ["news", "presse", "press", "aktuelles", "insights", "blog"] },
];

export type FetchedPage = {
  url: string;
  html: string;
  text: string;
  status: number;
  fromCache: boolean;
  label: string;
};

export class FetchError extends Error {}

export function normalizeInput(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) throw new FetchError("Enter a firm URL to open a room.");

  let candidate = trimmed;
  if (!/^https?:\/\//i.test(candidate)) {
    // Accept a bare domain like "saxenhammer-co.com". Reject a plain name:
    // resolving a company name to a URL would need a search API we don't run
    // server-side, and guessing a domain risks fetching the wrong company.
    const looksLikeDomain = /^[a-z0-9-]+(\.[a-z0-9-]+)+(\/.*)?$/i.test(candidate);
    if (!looksLikeDomain) {
      throw new FetchError(
        "That looks like a company name rather than a website. Paste the firm's URL instead, for example saxenhammer-co.com, so the room is built from the right company.",
      );
    }
    candidate = `https://${candidate}`;
  }

  try {
    const u = new URL(candidate);
    // Normalise to origin + path, drop hash/search noise.
    u.hash = "";
    return u.toString();
  } catch {
    throw new FetchError("That doesn't look like a valid URL.");
  }
}

/**
 * Same-site test that tolerates the www prefix.
 *
 * A strict `a.host !== b.host` looked safe but silently threw away most
 * discovery on any firm that canonicalises to www. Entering "pebco.ag" makes
 * the base host bare, while the site redirects to www.pebco.ag and its sitemap
 * and internal links are all written with www, so every candidate was rejected
 * as off-site and the room was built from the homepage alone. This still
 * refuses genuinely different hosts, including other subdomains.
 */
function sameSite(a: URL, b: URL): boolean {
  const strip = (h: string) => h.replace(/^www\./i, "").toLowerCase();
  return strip(a.host) === strip(b.host);
}

function cachePathFor(url: string): string {
  const u = new URL(url);
  const host = u.host.replace(/[^a-z0-9.-]/gi, "_");
  const hash = createHash("sha1").update(url).digest("hex").slice(0, 12);
  const slug = (u.pathname.replace(/[^a-z0-9]/gi, "-").replace(/^-+|-+$/g, "") || "home").slice(0, 60);
  return path.join(CACHE_DIR, host, `${slug}-${hash}.html`);
}

async function readCache(url: string): Promise<string | null> {
  try {
    const file = cachePathFor(url);
    const stat = await fs.stat(file);
    if (Date.now() - stat.mtimeMs > CACHE_TTL_MS) return null;
    return await fs.readFile(file, "utf8");
  } catch {
    return null;
  }
}

async function writeCache(url: string, html: string): Promise<void> {
  try {
    const file = cachePathFor(url);
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, html, "utf8");
  } catch {
    /* cache is best-effort; a write failure shouldn't fail the fetch */
  }
}

async function rawFetch(url: string): Promise<{ html: string; status: number }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "de,en;q=0.8",
      },
    });
    // Accept XML as well as HTML. This guard exists to drop PDFs and images,
    // but sitemaps are served as text/xml or application/xml, so an
    // html-only test silently returned an empty body for every sitemap and
    // sitemap discovery never actually ran. That mattered most on exactly the
    // sites that need it: JS-rendered ones whose homepage markup contains no
    // anchors at all, where the sitemap is the only way to find the team and
    // transactions pages.
    const contentType = res.headers.get("content-type") ?? "";
    const isReadable = contentType.includes("html") || contentType.includes("xml");
    if (!isReadable && res.status === 200) {
      return { html: "", status: res.status };
    }
    const html = await res.text();
    return { html, status: res.status };
  } finally {
    clearTimeout(timer);
  }
}

async function getPage(url: string, label: string): Promise<FetchedPage | null> {
  const cached = await readCache(url);
  if (cached !== null) {
    return { url, html: cached, text: htmlToText(cached), status: 200, fromCache: true, label };
  }
  try {
    const { html, status } = await rawFetch(url);
    if (status >= 400 || !html) return null;
    await writeCache(url, html);
    return { url, html, text: htmlToText(html), status, fromCache: false, label };
  } catch {
    return null;
  }
}

/** Extract same-host candidate subpages from the homepage's links. */
function discoverLinks(baseUrl: string, homeHtml: string): { url: string; label: string }[] {
  const base = new URL(baseUrl);
  const found = new Map<string, string>(); // url -> label

  const anchorRe = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;
  while ((match = anchorRe.exec(homeHtml)) !== null) {
    const href = match[1];
    const anchorText = match[2].replace(/<[^>]+>/g, " ").toLowerCase();
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) continue;
    let resolved: URL;
    try {
      resolved = new URL(href, base);
    } catch {
      continue;
    }
    if (!sameSite(resolved, base)) continue;
    resolved.hash = "";
    const haystack = `${resolved.pathname.toLowerCase()} ${anchorText}`;
    for (const group of PAGE_KEYWORDS) {
      if (group.terms.some((t) => haystack.includes(t))) {
        const key = resolved.toString();
        if (!found.has(key) && key !== baseUrl) found.set(key, group.key);
        break;
      }
    }
  }

  // Keep discovery diverse: at most one page per keyword group, in priority order.
  const byLabel = new Map<string, { url: string; label: string }>();
  for (const [url, label] of found) {
    if (!byLabel.has(label)) byLabel.set(label, { url, label });
  }
  return [...byLabel.values()];
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Parse a sitemap.xml for same-host, keyword-relevant pages. Many firms (even
 * JS-rendered ones whose homepage links we can't see) publish a sitemap, which
 * is the cheapest way to find their team/transactions pages. */
async function sitemapCandidates(baseUrl: string): Promise<{ url: string; label: string }[]> {
  const origin = new URL(baseUrl).origin;
  const out = new Map<string, string>();
  const seenSitemaps = new Set<string>();

  async function readSitemap(sitemapUrl: string, depth: number): Promise<void> {
    if (depth > 1 || seenSitemaps.has(sitemapUrl) || seenSitemaps.size > 4) return;
    seenSitemaps.add(sitemapUrl);
    let xml: string;
    try {
      const { html, status } = await rawFetch(sitemapUrl);
      if (status >= 400 || !html) return;
      xml = html;
    } catch {
      return;
    }
    const locs = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((m) => m[1]);
    for (const loc of locs) {
      if (/\.xml(\?|$)/i.test(loc) && depth === 0) {
        await readSitemap(loc, depth + 1); // sitemap index → sub-sitemaps
        continue;
      }
      let u: URL;
      try {
        u = new URL(loc);
      } catch {
        continue;
      }
      if (!sameSite(u, new URL(baseUrl))) continue;
      u.hash = "";
      const hay = u.pathname.toLowerCase();
      for (const group of PAGE_KEYWORDS) {
        if (group.terms.some((t) => hay.includes(t))) {
          const key = u.toString();
          if (!out.has(key) && key !== baseUrl) out.set(key, group.key);
          break;
        }
      }
    }
  }

  await readSitemap(`${origin}/sitemap.xml`, 0);
  if (out.size === 0) await readSitemap(`${origin}/sitemap_index.xml`, 0);
  return [...out.entries()].map(([url, label]) => ({ url, label }));
}

// Common subpaths to try when link/sitemap discovery comes up short (SPA sites).
const GUESS_PATHS: { path: string; label: string }[] = [
  { path: "team", label: "team" },
  { path: "ueber-uns", label: "team" },
  { path: "about-us", label: "team" },
  { path: "about", label: "about" },
  { path: "transaktionen", label: "transactions" },
  { path: "transactions", label: "transactions" },
  { path: "referenzen", label: "transactions" },
  { path: "track-record", label: "transactions" },
  { path: "leistungen", label: "services" },
  { path: "services", label: "services" },
];

/** Pick a diverse candidate set: one page per label group first (team,
 * transactions, services, about, news in priority order), then fill. */
function selectCandidates(
  candidates: { url: string; label: string }[],
  limit: number,
): { url: string; label: string }[] {
  const byLabel = new Map<string, { url: string; label: string }[]>();
  for (const c of candidates) {
    if (!byLabel.has(c.label)) byLabel.set(c.label, []);
    byLabel.get(c.label)!.push(c);
  }
  const order = PAGE_KEYWORDS.map((g) => g.key);
  const picked: { url: string; label: string }[] = [];
  const seen = new Set<string>();
  // one per label in priority order
  for (const label of order) {
    const list = byLabel.get(label);
    if (list && list.length) {
      const c = list[0];
      if (!seen.has(c.url)) {
        seen.add(c.url);
        picked.push(c);
      }
    }
    if (picked.length >= limit) return picked;
  }
  // fill with remaining
  for (const c of candidates) {
    if (picked.length >= limit) break;
    if (!seen.has(c.url)) {
      seen.add(c.url);
      picked.push(c);
    }
  }
  return picked;
}

export type FetchResult = {
  baseUrl: string;
  pages: FetchedPage[];
};

/** Fetch the homepage and a handful of discovered subpages, politely.
 * Discovery draws on homepage links, the sitemap, and — only if those are
 * thin — a short list of guessed common paths. */
export async function fetchFirmPages(input: string): Promise<FetchResult> {
  const baseUrl = normalizeInput(input);
  const home = await getPage(baseUrl, "home");
  if (!home) {
    throw new FetchError(
      "Couldn't reach that site. It may be down, blocking automated requests, or the URL may be wrong. Check the address and try again.",
    );
  }

  const pages: FetchedPage[] = [home];

  // Gather candidates from links + sitemap.
  const linkCandidates = discoverLinks(baseUrl, home.html);
  const smCandidates = await sitemapCandidates(baseUrl);
  let candidates = selectCandidates([...linkCandidates, ...smCandidates], MAX_PAGES - 1);

  // SPA fallback: if we found almost nothing, try a few common paths directly.
  if (candidates.length < 2) {
    const origin = new URL(baseUrl).origin;
    const guessed = GUESS_PATHS.map((g) => ({ url: `${origin}/${g.path}`, label: g.label }));
    candidates = selectCandidates([...candidates, ...guessed], MAX_PAGES - 1);
  }

  // Pause after any request that actually hit the network, not based on whether
  // the *homepage* was cached. On a re-run the homepage comes from cache while
  // newly discovered subpages are all live fetches, and the old condition
  // skipped the delay for every one of them.
  let lastWasLive = !home.fromCache;
  for (const candidate of candidates) {
    if (pages.length >= MAX_PAGES) break;
    if (candidate.url === baseUrl) continue;
    if (lastWasLive) await sleep(POLITE_DELAY_MS);
    const page = await getPage(candidate.url, candidate.label);
    lastWasLive = page ? !page.fromCache : true;
    // Keep only pages with real content (a guessed 200-but-empty SPA route adds nothing).
    if (page && page.text.replace(/\s/g, "").length > 120) pages.push(page);
  }

  return { baseUrl, pages };
}

/** Strip HTML to readable text for the model: drop scripts/styles/markup,
 * decode a few entities, collapse whitespace, cap length. */
export function htmlToText(html: string, maxChars = 14_000): string {
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<\/(p|div|li|h[1-6]|section|article|br|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&(quot|#34);/gi, '"')
    .replace(/&(apos|#39);/gi, "'")
    .replace(/&(uuml|#252);/gi, "ü")
    .replace(/&(ouml|#246);/gi, "ö")
    .replace(/&(auml|#228);/gi, "ä")
    .replace(/&(szlig|#223);/gi, "ß")
    .replace(/&(Uuml);/g, "Ü")
    .replace(/&(Ouml);/g, "Ö")
    .replace(/&(Auml);/g, "Ä")
    .replace(/&#(\d+);/g, (_, n) => {
      try {
        return String.fromCodePoint(Number(n));
      } catch {
        return " ";
      }
    })
    .replace(/[ \t\f\v]+/g, " ")
    .replace(/\n\s*\n\s*\n+/g, "\n\n")
    .trim();
  return text.length > maxChars ? `${text.slice(0, maxChars)}\n…[truncated]` : text;
}
