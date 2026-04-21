import { Suspense } from "react";
import BillingQueryListener from "@/components/BillingQueryListener";
import ChatSidebar from "@/components/ChatSidebar";
import { ChatsProvider } from "@/components/ChatsContext";

// Shared shell for the home page and /c/[chatId]. Sidebar state lives here so
// it persists across route changes. WizardProvider stays per-page so that
// navigating to a different chat naturally remounts wizard state (the
// /c/[chatId] page uses `key={chatId}` to force hydration on id change).
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
        <div className="flex flex-row flex-1 min-h-0">
          <ChatSidebar />
          <main className="flex-1 min-h-0 flex flex-col">{children}</main>
        </div>
      </ChatsProvider>
    </div>
  );
}
