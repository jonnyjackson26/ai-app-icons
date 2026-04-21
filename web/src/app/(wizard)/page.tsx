import { Suspense } from "react";
import Wizard from "@/components/Wizard";
import { WizardProvider } from "@/components/WizardContext";

// Home page — no chat id. WizardProvider starts empty; the first message
// lazy-creates a chat and replaces the URL with /c/[chatId].
export default function Home() {
  return (
    <WizardProvider>
      <Suspense fallback={null}>
        <Wizard />
      </Suspense>
    </WizardProvider>
  );
}
