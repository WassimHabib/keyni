import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeEuro,
  BarChart3,
  CheckCircle2,
  CircleDollarSign,
  Home,
  Info,
  Scale,
  TrendingUp,
  UserRound,
} from "lucide-react";

import { requireUser } from "@/features/auth/guards";
import { InfoBanner } from "@/components/ui/info-banner";
import { PageWithAside } from "@/components/layout/page-with-aside";
import { TrustpilotBadge } from "@/components/layout/widgets/trustpilot-badge";
import { HelpCard } from "@/components/layout/widgets/help-card";
import { repositories } from "@/lib/db/repositories";

import { InformationsForm } from "./informations-form";

export const metadata: Metadata = {
  title: "Informations personnelles",
};

interface PageProps {
  searchParams: Promise<{ bien?: string }>;
}

export default async function InformationsPage({ searchParams }: PageProps) {
  const user = await requireUser();
  const { bien } = await searchParams;
  const properties = await repositories.properties.findAllByUser(user.id);
  const selected = properties.find((p) => p.id === bien) ?? properties[0];

  const main = (
    <>
      <Link
        href="/outils"
        className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary"
      >
        <ArrowLeft className="h-4 w-4" /> Retour
      </Link>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Informations personnelles
        </h1>
        <p className="mt-1 text-text-muted">
          Complétez vos informations pour personnaliser vos indicateurs et
          calculer votre score Keyni avec précision.
        </p>
      </div>

      <InfoBanner>
        Ces informations nous permettent de calculer vos KPI (cash flow,
        patrimoine, rentabilité, plus-value) et de vous proposer des
        recommandations adaptées.
      </InfoBanner>

      <InformationsForm
        user={{
          email: user.email,
          profile: user.profile,
        }}
        properties={properties}
        selectedPropertyId={selected?.id}
      />
    </>
  );

  const aside = (
    <>
      <TrustpilotBadge />
      <div className="rounded-xl border border-border bg-surface p-5 shadow-card">
        <h3 className="text-base font-semibold text-text-primary">
          À quoi servent ces informations ?
        </h3>
        <p className="mt-1 text-xs text-text-muted">Elles nous permettent de :</p>
        <ul className="mt-3 space-y-2 text-sm text-text-secondary">
          {[
            "Calculer vos KPI avec précision",
            "Évaluer votre niveau de risque",
            "Vous proposer des offres adaptées",
            "Suivre l'évolution de vos performances",
          ].map((item) => (
            <li key={item} className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" /> {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-xl border border-border bg-surface p-5 shadow-card">
        <h3 className="text-base font-semibold text-text-primary">
          Vos KPI mis à jour
        </h3>
        <p className="mt-1 text-xs text-text-muted">
          Une fois enregistrées, vos données permettront de mettre à jour :
        </p>
        <ul className="mt-3 space-y-2 text-sm text-text-secondary">
          <li className="flex items-center gap-2">
            <CircleDollarSign className="h-4 w-4 text-chart-1" /> Cash flow
          </li>
          <li className="flex items-center gap-2">
            <Home className="h-4 w-4 text-chart-3" /> Patrimoine immobilier
          </li>
          <li className="flex items-center gap-2">
            <BadgeEuro className="h-4 w-4 text-warning" /> Rentabilité nette
          </li>
          <li className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" /> Plus-value réalisée
          </li>
        </ul>
        <div className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-muted py-3">
          <BarChart3 className="h-6 w-6 text-chart-1" />
          <BarChart3 className="h-6 w-6 text-chart-3" />
        </div>
      </div>

      <HelpCard />
    </>
  );

  return <PageWithAside main={main} aside={aside} />;
}

export const icons = {
  UserRound,
  Home,
  Info,
  Scale,
};
