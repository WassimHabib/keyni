"use client";

import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      theme="light"
      position="bottom-right"
      closeButton
      toastOptions={{
        className:
          "rounded-xl border border-border bg-surface shadow-card text-text-primary",
      }}
    />
  );
}
