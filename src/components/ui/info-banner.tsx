import { Info } from "lucide-react";

import { cn } from "@/lib/utils";

interface InfoBannerProps {
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
}

export function InfoBanner({ children, className, icon }: InfoBannerProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl bg-primary-soft px-4 py-3 text-sm text-primary-strong",
        className,
      )}
    >
      <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
        {icon ?? <Info className="h-3.5 w-3.5" />}
      </span>
      <div className="leading-relaxed text-text-secondary">{children}</div>
    </div>
  );
}
