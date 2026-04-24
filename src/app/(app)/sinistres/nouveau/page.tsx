import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { requireUser } from "@/features/auth/guards";
import { PageWithAside } from "@/components/layout/page-with-aside";
import { TrustpilotBadge } from "@/components/layout/widgets/trustpilot-badge";
import { HelpCard } from "@/components/layout/widgets/help-card";
import { repositories } from "@/lib/db/repositories";

import { DeclareSinistreForm } from "./declare-form";

export const metadata: Metadata = {
  title: "Déclarer un sinistre",
};

export default async function DeclareSinistrePage() {
  const user = await requireUser();
  const [properties, contracts] = await Promise.all([
    repositories.properties.findAllByUser(user.id),
    repositories.contracts.findAllByUser(user.id),
  ]);

  const main = (
    <>
      <Link
        href="/tableau-de-bord"
        className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary"
      >
        <ArrowLeft className="h-4 w-4" /> Retour
      </Link>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Déclarer un sinistre
        </h1>
        <p className="mt-1 text-text-muted">
          Trois étapes, quelques informations et votre déclaration part chez
          nous.
        </p>
      </div>
      <DeclareSinistreForm
        properties={properties.map((p) => ({ id: p.id, name: p.name }))}
        contracts={contracts.map((c) => ({
          id: c.id,
          type: c.type,
          propertyId: c.propertyId,
        }))}
      />
    </>
  );

  const aside = (
    <>
      <TrustpilotBadge />
      <HelpCard
        title="Besoin d'aide ?"
        subtitle="Notre équipe sinistre vous recontacte sous 24 h ouvrées."
      />
    </>
  );

  return <PageWithAside main={main} aside={aside} />;
}
