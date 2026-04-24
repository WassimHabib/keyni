"use client";

import { Send } from "lucide-react";
import { useActionState } from "react";

import { requestPasswordResetAction } from "@/features/auth/actions";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState = { ok: false } as const;

export function RequestResetForm() {
  const [state, formAction, pending] = useActionState(
    requestPasswordResetAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="vous@exemple.fr"
          required
        />
        {state.fieldErrors?.email ? (
          <p className="text-xs text-danger">{state.fieldErrors.email[0]}</p>
        ) : null}
      </div>

      {state.ok && state.message ? (
        <div
          role="status"
          className="rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success"
        >
          {state.message}
        </div>
      ) : null}

      <Button type="submit" className="w-full" disabled={pending}>
        <Send className="h-4 w-4" />
        {pending ? "Envoi en cours…" : "Envoyer le lien de réinitialisation"}
      </Button>
    </form>
  );
}
