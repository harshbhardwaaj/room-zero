import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";

import "./globals.css";

import { brand } from "@/lib/brand";

// Inter is Fintalo's own typeface (Inter / Inter Display on fintalo.com).
// Self-hosted by next/font so there is no runtime request to Google and the
// look is identical offline. The variable feeds the font-sans stack.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Theme is stored client-side; apply it before first paint so a dark-mode
// visitor never sees a white flash. Nav-open state is applied the same way so
// the rail doesn't jump on load. Storage keys are brand-agnostic on purpose —
// one visitor, one preference, whichever build they opened.
const shellStateScript = `
  try {
    const storedTheme = localStorage.getItem("fintalo-theme");
    document.documentElement.dataset.theme = storedTheme === "dark" ? "dark" : "light";
  } catch {
    document.documentElement.dataset.theme = "light";
  }

  try {
    const storedNavOpen = localStorage.getItem("fintalo-nav-open");
    document.documentElement.dataset.navOpen = storedNavOpen === "false" ? "false" : "true";
  } catch {
    document.documentElement.dataset.navOpen = "true";
  }
`;

export const metadata: Metadata = {
  // Short enough to survive a browser tab. The full framing lives in the
  // description and on the page itself. The addressed build still reads as the
  // product, not as Fintalo's own property — the byline stays Harsh's.
  title: brand.id === "fintalo" ? "Room Zero for Fintalo" : "Room Zero",
  // Per brand: the addressed build says who it was written for, the public one
  // does not name a company it was not written for (lib/brand.ts).
  description: brand.metaDescription,
  // The rooms name real people at real firms and infer priorities for them,
  // all of it read off public pages. Showing that to one reader who was sent
  // the link is the demo; letting a crawler index it would republish those
  // people into search results, which is a different thing and not one anyone
  // consented to. Keep the deployed build out of the index.
  robots: { index: false, follow: false, nocache: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // data-brand drives the palette (app/globals.css). Server-rendered rather
    // than set by a script, because the brand is fixed at build time and a
    // client-side swap would show the wrong colours for a frame.
    <html
      lang="en"
      data-brand={brand.id}
      className={inter.variable}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: shellStateScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
