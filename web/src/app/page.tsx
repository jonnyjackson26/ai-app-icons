import { Suspense } from "react";
import Wizard from "@/components/Wizard";
import { WizardProvider } from "@/components/WizardContext";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 min-h-0 bg-white dark:bg-zinc-950 font-sans">
      <WizardProvider>
        <Suspense fallback={null}>
          <Wizard />
        </Suspense>
      </WizardProvider>
    </div>
  );
}
