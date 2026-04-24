"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LogOut, Menu } from "lucide-react";

import { logoutAction } from "@/features/auth/actions";
import { cn } from "@/lib/utils";
import type { PublicUser } from "@/features/users/types";

import { nav } from "@/config/nav";

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { Logo } from "./logo";

export function MobileNav({ user }: { user: Pick<PublicUser, "profile"> }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border bg-surface text-text-primary shadow-card transition hover:bg-muted lg:hidden"
            aria-label="Ouvrir le menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </SheetTrigger>
        <SheetContent side="left" className="flex flex-col gap-6 p-6">
          <SheetHeader className="p-0">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <Logo size="md" variant="full" href="/tableau-de-bord" />
          </SheetHeader>

          <nav className="flex flex-col gap-1">
            {nav.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href));
              const Icon = item.icon;
              return (
                <SheetClose asChild key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-3 text-sm font-medium transition",
                      active
                        ? "bg-primary-soft text-primary-strong"
                        : "text-text-secondary hover:bg-muted",
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                </SheetClose>
              );
            })}
          </nav>

          <div className="mt-auto flex flex-col gap-3 border-t border-border pt-4">
            <div>
              <span className="block text-sm font-semibold text-text-primary">
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
                className="flex w-full items-center justify-start gap-2 rounded-md px-2 py-2 text-sm font-medium text-text-secondary hover:bg-muted"
              >
                <LogOut className="h-4 w-4" /> Se déconnecter
              </button>
            </form>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
