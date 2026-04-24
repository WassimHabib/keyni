"use client";

import { MessageCircle } from "lucide-react";

export function ChatCard() {
  return (
    <button
      type="button"
      onClick={() => {
        const btn = document.querySelector<HTMLButtonElement>(
          "button[aria-label='Ouvrir le chat']",
        );
        btn?.click();
      }}
      className="flex h-full flex-col items-start gap-3 rounded-xl border border-border bg-surface p-5 text-left shadow-card transition hover:border-primary"
    >
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
        <MessageCircle className="h-5 w-5" />
      </span>
      <div>
        <h3 className="text-base font-semibold text-text-primary">
          Chat en direct
        </h3>
        <p className="text-sm text-text-muted">Réponse en moyenne en 3 min</p>
      </div>
      <span className="text-sm font-medium text-primary">Ouvrir le chat</span>
    </button>
  );
}
