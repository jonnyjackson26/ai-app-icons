import { Suspense } from "react";
import BillingQueryListener from "@/components/BillingQueryListener";
import ChatSidebar from "@/components/ChatSidebar";
import { ChatsProvider } from "@/components/ChatsContext";
import { WizardProvider } from "@/components/WizardContext";

// Shared shell for the home page and /c/[chatId]. Sidebar + wizard state both
// live here so they persist across route changes within the (wizard) group.
// The /c/[chatId] page uses a HydrationBoundary to push its server-fetched
// DTO into the shared provider; the sidebar's "New Chat" button calls
// reset() on the provider directly (avoiding the router-state-drift trap
// where history.replaceState desyncs Next.js from the browser URL).
export default function WizardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col flex-1 min-h-0 bg-white dark:bg-zinc-950 font-sans">
      <Suspense fallback={null}>
        <BillingQueryListener />
      </Suspense>
      <ChatsProvider>
        <WizardProvider>
          <div className="flex flex-row flex-1 min-h-0">
            <ChatSidebar />
            <main className="flex-1 min-h-0 flex flex-col">{children}</main>
          </div>
        </WizardProvider>
      </ChatsProvider>
    </div>
  );
}
