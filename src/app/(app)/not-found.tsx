import Link from "next/link";
import { Compass } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[50dvh] flex-col items-center justify-center gap-4 rounded-xl border border-border bg-surface p-10 text-center shadow-card">
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-primary">
        <Compass className="h-6 w-6" />
      </span>
      <h2 className="text-xl font-semibold">Page introuvable</h2>
      <p className="max-w-sm text-sm text-text-muted">
        La page que vous cherchez n'existe pas ou a été déplacée.
      </p>
      <Button asChild>
        <Link href="/tableau-de-bord">Retour au tableau de bord</Link>
      </Button>
    </div>
  );
}
