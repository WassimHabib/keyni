import * as React from "react";

import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  suffix?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, suffix, ...props }, ref) => {
    const field = (
      <input
        type={type}
        ref={ref}
        className={cn(
          "flex h-11 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary placeholder:text-text-muted file:mr-3 file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
          suffix ? "pr-12" : undefined,
          className,
        )}
        {...props}
      />
    );

    if (!suffix) return field;
    return (
      <div className="relative w-full">
        {field}
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-text-muted">
          {suffix}
        </span>
      </div>
    );
  },
);
Input.displayName = "Input";

export { Input };
