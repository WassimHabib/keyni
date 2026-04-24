"use client";

import { Eye, EyeOff, Save } from "lucide-react";
import Link from "next/link";
import { useActionState, useMemo, useState } from "react";

import { resetPasswordAction } from "@/features/auth/actions";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";

const initialState = { ok: false } as const;

function strengthFor(value: string): {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
} {
  if (value.length === 0) return { score: 0, label: "" };
  let score = 0;
  if (value.length >= 12) score += 1;
  if (/[A-Z]/.test(value)) score += 1;
  if (/[0-9]/.test(value)) score += 1;
  if (/[^A-Za-z0-9]/.test(value)) score += 1;
  const labels = ["Très faible", "Faible", "Correct", "Fort", "Très fort"];
  return {
    score: Math.min(4, score) as 0 | 1 | 2 | 3 | 4,
    label: labels[Math.min(4, score)]!,
  };
}

export function ResetPasswordForm({ token }: { token: string }) {
  const actionWithToken = resetPasswordAction.bind(null, token);
  const [state, formAction, pending] = useActionState(
    actionWithToken,
    initialState,
  );
  const [pwd, setPwd] = useState("");
  const [visible, setVisible] = useState(false);
  const strength = useMemo(() => strengthFor(pwd), [pwd]);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="password">Nouveau mot de passe</Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={visible ? "text" : "password"}
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            autoComplete="new-password"
            minLength={12}
            required
            className="pr-12"
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-text-muted hover:text-text-primary"
            aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          >
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <Progress value={(strength.score / 4) * 100} className="mt-1 h-1.5" />
        <p className="text-xs text-text-muted">
          {strength.label || "12 caractères minimum"}
        </p>
        {state.fieldErrors?.password ? (
          <p className="text-xs text-danger">
            {state.fieldErrors.password[0]}
          </p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="confirm">Confirmez le mot de passe</Label>
        <Input
          id="confirm"
          name="confirm"
          type={visible ? "text" : "password"}
          autoComplete="new-password"
          minLength={12}
          required
        />
        {state.fieldErrors?.confirm ? (
          <p className="text-xs text-danger">
            {state.fieldErrors.confirm[0]}
          </p>
        ) : null}
      </div>

      {state.message ? (
        <div
          role={state.ok ? "status" : "alert"}
          className={
            state.ok
              ? "rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success"
              : "rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger"
          }
        >
          {state.message}
          {state.ok ? (
            <div className="mt-2">
              <Link href="/login" className="font-medium text-primary hover:underline">
                Aller à la connexion
              </Link>
            </div>
          ) : null}
        </div>
      ) : null}

      <Button type="submit" className="w-full" disabled={pending}>
        <Save className="h-4 w-4" /> {pending ? "Enregistrement…" : "Enregistrer le nouveau mot de passe"}
      </Button>
    </form>
  );
}
