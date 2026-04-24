import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { cn } from "@/lib/utils";

interface TopBarProps {
  backHref?: string;
  breadcrumb?: string;
  className?: string;
}

export function TopBar({ backHref, breadcrumb, className }: TopBarProps) {
  if (!backHref && !breadcrumb) return null;
  return (
    <div className={cn("flex items-center gap-3 text-sm", className)}>
      {backHref ? (
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 text-text-secondary transition hover:text-text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Retour
        </Link>
      ) : null}
      {breadcrumb ? (
        <span className="text-text-muted">{breadcrumb}</span>
      ) : null}
    </div>
  );
}
