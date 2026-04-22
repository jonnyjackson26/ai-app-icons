import { Suspense } from "react";
import Wizard from "@/components/Wizard";

// Home page — no chat id. WizardProvider is hoisted to the (wizard) layout
// so it persists across route changes; this page just renders the Wizard UI.
// First message lazy-creates a chat and replaces the URL with /c/[chatId].
export default function Home() {
  return (
    <Suspense fallback={null}>
      <Wizard />
    </Suspense>
  );
}
