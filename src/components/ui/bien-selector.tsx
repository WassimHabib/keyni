"use client";

import { Home } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BienSelectorProps {
  properties: { id: string; name: string }[];
  value?: string;
  paramName?: string;
  className?: string;
  allowAll?: boolean;
}

export function BienSelector({
  properties,
  value,
  paramName = "bien",
  className,
  allowAll = true,
}: BienSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = value ?? searchParams.get(paramName) ?? "all";

  function handleChange(next: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "all") params.delete(paramName);
    else params.set(paramName, next);
    const query = params.toString();
    router.replace(query ? `?${query}` : window.location.pathname, {
      scroll: false,
    });
  }

  return (
    <Select value={current} onValueChange={handleChange}>
      <SelectTrigger className={className} aria-label="Bien concerné">
        <span className="flex items-center gap-2 text-sm font-medium text-text-primary">
          <Home className="h-4 w-4 text-text-muted" />
          <SelectValue placeholder="Tous mes biens" />
        </span>
      </SelectTrigger>
      <SelectContent>
        {allowAll ? <SelectItem value="all">Tous mes biens</SelectItem> : null}
        {properties.map((p) => (
          <SelectItem key={p.id} value={p.id}>
            {p.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
