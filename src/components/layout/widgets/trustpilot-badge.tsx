import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

export function TrustpilotBadge({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 shadow-card",
        className,
      )}
      aria-label="Note Trustpilot 4,7 sur 5"
    >
      <span className="flex items-center gap-1 text-sm font-semibold text-text-primary">
        <Star className="h-4 w-4 fill-[#00b67a] text-[#00b67a]" aria-hidden />
        Trustpilot
      </span>
      <span className="flex items-center gap-0.5">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className="flex h-4 w-4 items-center justify-center rounded-[2px] bg-[#00b67a]"
          >
            <Star className="h-3 w-3 fill-white text-white" />
          </span>
        ))}
        <span className="flex h-4 w-4 items-center justify-center rounded-[2px] bg-[#dcdce6]">
          <Star className="h-3 w-3 fill-white text-white" />
        </span>
      </span>
      <span className="text-sm font-semibold text-text-primary">4,7/5</span>
    </div>
  );
}
