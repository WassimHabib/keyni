import type { Metadata } from "next";
import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Connexion",
};

export default function LoginPage() {
  return (
    <Card className="p-2">
      <CardHeader>
        <CardTitle>Bienvenue sur votre espace Keyni</CardTitle>
        <CardDescription>
          Connectez-vous pour retrouver vos contrats, votre score Keyni et vos
          documents.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <LoginForm />
        <p className="text-center text-sm text-text-muted">
          <Link
            href="/mot-de-passe-oublie"
            className="font-medium text-primary hover:underline"
          >
            Mot de passe oublié ?
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
