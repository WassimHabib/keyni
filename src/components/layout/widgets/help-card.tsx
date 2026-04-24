"use client";

import { MessageCircle } from "lucide-react";

import { Button } from "@/components/ui/button";

export function HelpCard({
  title = "Besoin d'aide ?",
  subtitle = "Notre équipe est là pour vous accompagner.",
}: {
  title?: string;
  subtitle?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5 shadow-card">
      <h3 className="text-base font-semibold text-text-primary">{title}</h3>
      <p className="mt-1 text-sm text-text-muted">{subtitle}</p>
      <Button
        variant="secondary"
        size="sm"
        className="mt-4 w-full justify-center"
        onClick={() => {
          if (typeof document !== "undefined") {
            const btn = document.querySelector<HTMLButtonElement>(
              "button[aria-label='Ouvrir le chat']",
            );
            btn?.click();
          }
        }}
      >
        <MessageCircle className="h-4 w-4" /> Discuter avec nous
      </Button>
    </div>
  );
}
