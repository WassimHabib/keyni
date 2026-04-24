"use client";

import { AlertTriangle } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { logger } from "@/lib/logger";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AppError({ error, reset }: ErrorProps) {
  useEffect(() => {
    logger.error("rendering error", {
      message: error.message,
      digest: error.digest,
    });
  }, [error]);

  return (
    <div className="flex min-h-[50dvh] flex-col items-center justify-center gap-4 rounded-xl border border-danger/30 bg-danger/5 p-10 text-center">
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-danger/10 text-danger">
        <AlertTriangle className="h-6 w-6" />
      </span>
      <h2 className="text-xl font-semibold text-text-primary">
        Une erreur est survenue
      </h2>
      <p className="max-w-sm text-sm text-text-muted">
        Nous n'avons pas pu charger cette page. Réessayez dans un instant ou
        contactez le support si le problème persiste.
      </p>
      <Button onClick={reset}>Réessayer</Button>
    </div>
  );
}
