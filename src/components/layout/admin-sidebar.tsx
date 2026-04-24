"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, LogOut } from "lucide-react";

import { adminNav } from "@/config/admin-nav";
import { logoutAction } from "@/features/auth/actions";
import { cn } from "@/lib/utils";
import type { PublicUser } from "@/features/users/types";

import { Logo } from "./logo";

function isActivePath(path: string, pathname: string): boolean {
  if (path === "/admin") return pathname === "/admin";
  return pathname.startsWith(path);
}

export function AdminSidebar({
  user,
}: {
  user: Pick<PublicUser, "profile" | "email">;
}) {
  const pathname = usePathname();
  return (
    <aside className="hidden h-dvh shrink-0 flex-col gap-5 border-r border-border bg-surface p-5 lg:flex lg:w-[72px] xl:w-60">
      <div className="flex items-center justify-center xl:justify-start">
        <span className="xl:hidden">
          <Logo size="sm" variant="mark" />
        </span>
        <span className="hidden xl:inline">
          <Logo size="md" variant="full" />
        </span>
      </div>

      <div className="hidden rounded-md border border-primary/30 bg-primary-soft px-3 py-2 text-center xl:block">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary-strong">
          Back-office
        </p>
        <p className="mt-0.5 text-[10px] text-primary-strong/80">
          Accès interne Keyni
        </p>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {adminNav.map((item) => {
          const active = isActivePath(item.href, pathname);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition",
                active
                  ? "bg-primary-soft text-primary-strong"
                  : "text-text-secondary hover:bg-muted hover:text-text-primary",
              )}
              title={item.label}
            >
              <Icon
                className={cn(
                  "h-5 w-5 shrink-0",
                  active
                    ? "text-primary"
                    : "text-text-muted group-hover:text-text-primary",
                )}
              />
              <span className="hidden xl:inline">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="flex flex-col gap-2 border-t border-border pt-4">
        <div className="hidden flex-col xl:flex">
          <span className="text-sm font-semibold text-text-primary">
            {user.profile.displayName}
          </span>
          <span className="text-xs text-text-muted truncate">{user.email}</span>
        </div>
        <Link
          href="/tableau-de-bord"
          className="flex w-full items-center justify-center gap-2 rounded-md px-2 py-2 text-xs font-medium text-text-secondary hover:bg-muted xl:justify-start"
          title="Espace client"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span className="hidden xl:inline">Espace client</span>
        </Link>
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-md px-2 py-2 text-sm font-medium text-text-secondary hover:bg-muted hover:text-text-primary xl:justify-start"
            aria-label="Se déconnecter"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden xl:inline">Se déconnecter</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
