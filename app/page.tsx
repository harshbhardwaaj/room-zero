import { AppShell } from "@/components/app-shell";
import { OpeningSection } from "@/components/narrative/opening-section";

export default function Home() {
  return (
    <AppShell showNavigation={false} className="bg-[var(--ft-bg)]">
      <main id="main">
        <OpeningSection />
      </main>
    </AppShell>
  );
}
