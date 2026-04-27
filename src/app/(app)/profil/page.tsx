import type { Metadata } from "next";
import { cookies } from "next/headers";
import { KeyRound, Laptop } from "lucide-react";

import { requireUser } from "@/features/auth/guards";
import {
  SESSION_COOKIE_NAME,
  validateSessionToken,
} from "@/features/auth/session";
import { Badge } from "@/components/ui/badge";
import { formatDateFr } from "@/lib/utils";

import { ChangePasswordForm } from "./change-password-form";

export const metadata: Metadata = {
  title: "Profil",
};

export default async function ProfilPage() {
  const user = await requireUser();
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const validated = token ? await validateSessionToken(token) : null;
  const session = validated?.session;

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mon profil</h1>
        <p className="mt-1 text-text-muted">
          Gérez votre email, votre mot de passe et votre session active.
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
          La modification prend effet immédiatement.
        </p>
        <div className="mt-4">
          <ChangePasswordForm />
        </div>
      </section>

      <section className="rounded-xl border border-border bg-surface p-6 shadow-card">
        <header>
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Laptop className="h-4 w-4 text-primary" /> Session actuelle
          </h2>
          <p className="mt-1 text-sm text-text-muted">
            La gestion multi-appareils sera enrichie au branchement de la base
            de données.
          </p>
        </header>
        {session ? (
          <div className="mt-4 flex items-center justify-between gap-3 rounded-md border border-border bg-background px-4 py-3 text-sm">
            <div>
              <p className="font-medium">
                {session.userAgent?.slice(0, 80) ?? "Navigateur inconnu"}
              </p>
              <p className="text-xs text-text-muted">
                Connecté depuis {formatDateFr(session.createdAt)} · IP{" "}
                {session.ip ?? "inconnue"}
              </p>
            </div>
            <Badge variant="success">Active</Badge>
          </div>
        ) : (
          <p className="mt-4 text-sm text-text-muted">
            Aucune session active détectée.
          </p>
        )}
      </section>
    </div>
  );
}
