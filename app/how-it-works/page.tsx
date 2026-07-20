import { Suspense } from "react";

import { HowItWorks } from "@/components/narrative/how-it-works";

// HowItWorks reads ?step= via useSearchParams, which Next requires to sit under
// a Suspense boundary so the rest of the route can still be prerendered.
export default function HowItWorksPage() {
  return (
    <Suspense fallback={null}>
      <HowItWorks />
    </Suspense>
  );
}
