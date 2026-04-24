"use client";

import { UploadCloud } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DropZoneProps {
  onFile: (file: File) => void;
  accept?: string;
  maxBytes?: number;
  helperText?: string;
  disabled?: boolean;
}

export function DropZone({
  onFile,
  accept = "application/pdf,image/jpeg,image/png",
  maxBytes = 10 * 1024 * 1024,
  helperText = "PDF, JPG ou PNG — 10 Mo max",
  disabled = false,
}: DropZoneProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [over, setOver] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  function handleFile(file: File) {
    if (file.size > maxBytes) {
      setError(`Fichier trop lourd (max ${Math.round(maxBytes / 1024 / 1024)} Mo)`);
      return;
    }
    setError(null);
    onFile(file);
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-primary-soft/40 px-5 py-10 text-center transition",
        over && !disabled
          ? "border-primary bg-primary-soft"
          : "hover:border-primary/60",
        disabled ? "opacity-60" : "cursor-pointer",
      )}
      onDragOver={(e) => {
        if (disabled) return;
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        if (disabled) return;
        e.preventDefault();
        setOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleFile(file);
      }}
      onClick={() => {
        if (disabled) return;
        inputRef.current?.click();
      }}
      role="button"
      aria-disabled={disabled}
      tabIndex={0}
    >
      <UploadCloud className="h-7 w-7 text-primary" />
      <span className="text-sm font-semibold text-text-primary">
        Déposez vos documents
      </span>
      <span className="text-xs text-text-muted">Bail de location, état des lieux, avenant…</span>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={accept}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
        disabled={disabled}
      />
      <Button type="button" size="sm" className="mt-2" disabled={disabled}>
        Joindre un fichier
      </Button>
      <span className="text-xs text-text-muted">{helperText}</span>
      {error ? <span className="text-xs text-danger">{error}</span> : null}
    </div>
  );
}
