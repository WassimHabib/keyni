"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { logoutAction } from "@/features/auth/actions";
import { cn } from "@/lib/utils";
import type { PublicUser } from "@/features/users/types";

import { nav } from "@/config/nav";
import { LogOut } from "lucide-react";

import { Logo } from "./logo";

function isActivePath(path: string, pathname: string): boolean {
  if (path === "/outils") return pathname.startsWith("/outils");
  if (path === "/mes-contrats") return pathname.startsWith("/mes-contrats");
  return pathname === path;
}

export function Sidebar({ user }: { user: Pick<PublicUser, "profile"> }) {
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

      <nav className="flex flex-1 flex-col gap-1">
        {nav.map((item) => {
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
              <Icon className={cn("h-5 w-5 shrink-0", active ? "text-primary" : "text-text-muted group-hover:text-text-primary")} />
              <span className="hidden xl:inline">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <Link
        href="/bons-plans"
        className="relative flex flex-col items-center gap-1 rounded-xl border border-border bg-background p-3 text-xs font-semibold text-text-primary transition hover:border-primary hover:shadow-card xl:flex-row xl:items-start xl:gap-3 xl:p-4"
        aria-label="20 € vous attendent, consulter la page Bons plans"
      >
        <Image
          src="/illustrations/money-waiting.svg"
          alt=""
          width={72}
          height={54}
          className="h-12 w-auto"
          aria-hidden
        />
        <span className="hidden text-center xl:block xl:text-left">
          <span className="block font-semibold text-text-primary">20 € vous attendent !</span>
        </span>
      </Link>

      <div className="flex flex-col gap-2 border-t border-border pt-4">
        <div className="hidden flex-col xl:flex">
          <span className="text-sm font-semibold text-text-primary">
            {user.profile.displayName}
          </span>
          {user.profile.firstName && user.profile.lastName ? (
            <span className="text-xs text-text-muted">
              {user.profile.firstName} {user.profile.lastName}
            </span>
          ) : null}
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-md px-2 py-2 text-sm font-medium text-text-secondary transition hover:bg-muted hover:text-text-primary xl:justify-start"
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
