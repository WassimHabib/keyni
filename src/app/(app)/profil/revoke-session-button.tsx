"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { revokeSessionAction } from "@/features/auth/session-actions";

import { Button } from "@/components/ui/button";

export function RevokeSessionButton({ sessionId }: { sessionId: string }) {
  const [pending, start] = useTransition();
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await revokeSessionAction(sessionId);
          toast.success("Session révoquée");
        })
      }
    >
      Révoquer
    </Button>
  );
}
