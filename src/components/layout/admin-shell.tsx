import type { PublicUser } from "@/features/users/types";

import { AdminMobileNav } from "./admin-mobile-nav";
import { AdminSidebar } from "./admin-sidebar";
import { Logo } from "./logo";

interface AdminShellProps {
  user: Pick<PublicUser, "profile" | "email">;
  children: React.ReactNode;
}

export function AdminShell({ user, children }: AdminShellProps) {
  return (
    <div className="flex min-h-dvh bg-background">
      <AdminSidebar user={user} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border/60 bg-background/80 px-4 py-3 backdrop-blur lg:hidden">
          <AdminMobileNav user={user} />
          <div className="flex items-center gap-2">
            <Logo size="sm" variant="full" />
            <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary-strong">
              Admin
            </span>
          </div>
        </header>
        <main className="flex-1 px-4 pb-10 pt-6 md:px-6">{children}</main>
      </div>
    </div>
  );
}
