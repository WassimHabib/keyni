"use client";

import { Eye, EyeOff, LogIn } from "lucide-react";
import { useActionState, useEffect, useState } from "react";

import { loginAction } from "@/features/auth/actions";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState = { ok: false } as const;

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (state.ok && state.redirectTo) {
      // Navigation « hard » : garantit que le cookie de session posé par
      // l'action est envoyé dans la requête suivante. Avec router.replace
      // (soft routing) on observe sur Vercel des cas où le GET suivant part
      // avant que le navigateur ait stocké le Set-Cookie, ce qui renvoie
      // sur /login.
      window.location.assign(state.redirectTo);
    }
  }, [state]);

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

      <div className="space-y-1.5">
        <Label htmlFor="password">Mot de passe</Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={visible ? "text" : "password"}
            autoComplete="current-password"
            required
            className="pr-12"
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-text-muted hover:text-text-primary"
            aria-label={
              visible ? "Masquer le mot de passe" : "Afficher le mot de passe"
            }
          >
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {state.message && !state.ok ? (
        <div
          role="alert"
          className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger"
        >
          {state.message}
        </div>
      ) : null}

      <Button type="submit" className="w-full" disabled={pending}>
        <LogIn className="h-4 w-4" />
        {pending ? "Connexion…" : "Se connecter"}
      </Button>
    </form>
  );
}
