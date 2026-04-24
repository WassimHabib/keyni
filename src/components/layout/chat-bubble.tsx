"use client";

import { MessageCircle } from "lucide-react";
import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function ChatBubble() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-hover transition hover:bg-primary-strong"
        aria-label="Ouvrir le chat"
      >
        <MessageCircle className="h-5 w-5" />
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Discuter avec nous</DialogTitle>
            <DialogDescription>
              Le chat en direct arrive très bientôt. En attendant, vous pouvez
              nous joindre par email ou par téléphone depuis la page Contact.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
}
