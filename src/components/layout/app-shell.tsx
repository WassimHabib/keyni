import type { PublicUser } from "@/features/users/types";

import { ChatBubble } from "./chat-bubble";
import { MobileNav } from "./mobile-nav";
import { Sidebar } from "./sidebar";
import { Logo } from "./logo";

interface AppShellProps {
  user: Pick<PublicUser, "profile">;
  children: React.ReactNode;
}

export function AppShell({ user, children }: AppShellProps) {
  return (
    <div className="flex min-h-dvh bg-background">
      <Sidebar user={user} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border/60 bg-background/80 px-4 py-3 backdrop-blur lg:hidden">
          <MobileNav user={user} />
          <Logo size="sm" variant="full" />
        </header>
        <main className="flex-1 px-4 pb-10 pt-6 md:px-6">{children}</main>
      </div>
      <ChatBubble />
    </div>
  );
}
