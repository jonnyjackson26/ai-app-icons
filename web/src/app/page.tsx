import { Suspense } from "react";
import Wizard from "@/components/Wizard";
import { WizardProvider } from "@/components/WizardContext";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 bg-white dark:bg-zinc-950 font-sans">
      <header className="border-b border-zinc-200 dark:border-zinc-800 px-4 py-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            AI App Icons
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Generate app icon assets using AI
          </p>
        </div>
      </header>
      <main className="flex-1 px-4 py-8">
        <WizardProvider>
          <Suspense fallback={null}>
            <Wizard />
          </Suspense>
        </WizardProvider>
      </main>
      <footer className="border-t border-zinc-200 dark:border-zinc-800 px-4 py-4 text-center text-xs text-zinc-400 dark:text-zinc-500">
        Open source &middot; Powered by OpenAI
      </footer>
    </div>
  );
}
