import type { Metadata } from "next";
import { cookies } from "next/headers";
import { KeyRound, Laptop } from "lucide-react";

import { requireUser } from "@/features/auth/guards";
import {
  SESSION_COOKIE_NAME,
  hashSessionToken,
} from "@/features/auth/session";
import { revokeAllOtherSessionsAction } from "@/features/auth/session-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateFr } from "@/lib/utils";
import { repositories } from "@/lib/db/repositories";

import { ChangePasswordForm } from "./change-password-form";
import { RevokeSessionButton } from "./revoke-session-button";

export const metadata: Metadata = {
  title: "Profil",
};

export default async function ProfilPage() {
  const user = await requireUser();
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const currentTokenHash = token ? hashSessionToken(token) : undefined;

  const sessions = await repositories.sessions.findAllForUser(user.id);
  const currentSession = sessions.find(
    (s) => s.tokenHash === currentTokenHash,
  );

  async function revokeOthers() {
    "use server";
    if (currentSession) {
      await revokeAllOtherSessionsAction(currentSession.id);
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mon profil</h1>
        <p className="mt-1 text-text-muted">
          Gérez votre email, votre mot de passe et vos sessions actives.
        </p>
      </div>

      <section className="rounded-xl border border-border bg-surface p-6 shadow-card">
        <h2 className="text-lg font-semibold">Identifiants</h2>
        <p className="mt-1 text-sm text-text-muted">
          Votre email est géré par votre conseiller Keyni.
        </p>
        <div className="mt-4 flex items-center justify-between rounded-md border border-border bg-background px-4 py-3 text-sm">
          <div>
            <p className="text-xs font-medium text-text-muted">Email</p>
            <p className="font-medium">{user.email}</p>
          </div>
          <Badge variant="neutral">Lecture seule</Badge>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-surface p-6 shadow-card">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <KeyRound className="h-4 w-4 text-primary" /> Changer le mot de passe
        </h2>
        <p className="mt-1 text-sm text-text-muted">
          Vos autres sessions seront automatiquement déconnectées à la validation.
        </p>
        <div className="mt-4">
          <ChangePasswordForm />
        </div>
      </section>

      <section className="rounded-xl border border-border bg-surface p-6 shadow-card">
        <header className="flex items-center justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Laptop className="h-4 w-4 text-primary" /> Sessions actives
            </h2>
            <p className="mt-1 text-sm text-text-muted">
              Liste des appareils actuellement connectés à votre compte.
            </p>
          </div>
          {sessions.length > 1 ? (
            <form action={revokeOthers}>
              <Button type="submit" variant="secondary" size="sm">
                Se déconnecter partout ailleurs
              </Button>
            </form>
          ) : null}
        </header>
        <ul className="mt-4 space-y-2 text-sm">
          {sessions.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between gap-3 rounded-md border border-border bg-background px-4 py-3"
            >
              <div>
                <p className="font-medium">
                  {s.userAgent?.slice(0, 80) ?? "Navigateur inconnu"}
                </p>
                <p className="text-xs text-text-muted">
                  Dernière activité : {formatDateFr(s.lastSeenAt)} · IP{" "}
                  {s.ip ?? "inconnue"}
                </p>
              </div>
              {currentSession?.id === s.id ? (
                <Badge variant="success">Session actuelle</Badge>
              ) : (
                <RevokeSessionButton sessionId={s.id} />
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
