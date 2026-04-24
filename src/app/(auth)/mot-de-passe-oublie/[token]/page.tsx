import type { Metadata } from "next";
import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { repositories } from "@/lib/db/repositories";
import { hashResetToken } from "@/features/auth/tokens";

import { ResetPasswordForm } from "./reset-form";

export const metadata: Metadata = {
  title: "Nouveau mot de passe",
};

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function ResetTokenPage({ params }: PageProps) {
  const { token } = await params;
  const record = await repositories.resetTokens.findByTokenHash(
    hashResetToken(token),
  );

  const invalid =
    !record || record.usedAt || record.expiresAt.getTime() < Date.now();

  return (
    <Card className="p-2">
      <CardHeader>
        <CardTitle>Définir un nouveau mot de passe</CardTitle>
        <CardDescription>
          Choisissez un mot de passe d'au moins 12 caractères. Toutes vos autres
          sessions seront automatiquement déconnectées.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {invalid ? (
          <div
            role="alert"
            className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger"
          >
            Ce lien est invalide ou a expiré. Veuillez refaire une demande.
            <div className="mt-2">
              <Link
                href="/mot-de-passe-oublie"
                className="font-medium text-primary hover:underline"
              >
                Renvoyer un lien
              </Link>
            </div>
          </div>
        ) : (
          <ResetPasswordForm token={token} />
        )}
        <p className="text-center text-sm text-text-muted">
          <Link
            href="/login"
            className="font-medium text-primary hover:underline"
          >
            Retour à la connexion
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
