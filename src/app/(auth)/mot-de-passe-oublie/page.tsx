import type { Metadata } from "next";
import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { RequestResetForm } from "./reset-request-form";

export const metadata: Metadata = {
  title: "Mot de passe oublié",
};

export default function ForgotPasswordPage() {
  return (
    <Card className="p-2">
      <CardHeader>
        <CardTitle>Réinitialiser votre mot de passe</CardTitle>
        <CardDescription>
          Indiquez l'email associé à votre compte. Si un compte existe, nous
          vous enverrons un lien pour définir un nouveau mot de passe.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <RequestResetForm />
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
