import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  CircleDollarSign,
  FileCheck2,
  FileText,
  Home,
  Receipt,
  Shield,
  TrendingUp,
} from "lucide-react";

import { requireUser } from "@/features/auth/guards";
import { BienSelector } from "@/components/ui/bien-selector";
import { Button } from "@/components/ui/button";
import { InfoBanner } from "@/components/ui/info-banner";
import { KpiCard } from "@/components/charts/kpi-card";
import { PageWithAside } from "@/components/layout/page-with-aside";
import { ScoreRing } from "@/components/charts/score-ring";
import { TrustpilotBadge } from "@/components/layout/widgets/trustpilot-badge";
import { HelpCard } from "@/components/layout/widgets/help-card";
import { formatEuros, formatPercent } from "@/lib/utils";
import { getUserScore } from "@/features/score/service";
import { repositories } from "@/lib/db/repositories";

export const metadata: Metadata = {
  title: "Tableau de bord",
};

interface PageProps {
  searchParams: Promise<{ bien?: string }>;
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const user = await requireUser();
  const { bien } = await searchParams;

  const [properties, documents, snapshots, score, contracts] = await Promise.all([
    repositories.properties.findAllByUser(user.id),
    repositories.documents.findAllByUser(user.id),
    repositories.scoreSnapshots.findRecentByUser(user.id, 6),
    getUserScore(user),
    repositories.contracts.findAllByUser(user.id),
  ]);

  const activeProperties =
    bien && bien !== "all"
      ? properties.filter((p) => p.id === bien)
      : properties;

  const cashFlow = activeProperties.reduce(
    (acc, p) =>
      acc +
      (p.finances.loyerMensuelCents -
        p.finances.chargesMensuellesCents -
        p.finances.mensualiteCreditCents),
    0,
  );

  const patrimoine = activeProperties.reduce(
    (acc, p) => acc + p.valeurActuelleEstimeeCents,
    0,
  );

  const loyersAnnuels = activeProperties.reduce(
    (acc, p) => acc + p.finances.loyerMensuelCents * 12,
    0,
  );
  const rentabilite =
    patrimoine > 0 ? Number(((loyersAnnuels / patrimoine) * 100).toFixed(2)) : 0;

  const plusValue = activeProperties.reduce(
    (acc, p) => acc + (p.valeurActuelleEstimeeCents - p.prixAcquisitionCents),
    0,
  );
  const plusValueInit = activeProperties.reduce(
    (acc, p) => acc + p.prixAcquisitionCents,
    0,
  );
  const plusValueDeltaPct =
    plusValueInit > 0
      ? Math.round((plusValue / plusValueInit) * 100 * 10) / 10
      : 0;

  const cashFlowHistory = snapshots.map((s) => s.cashFlowCents);
  const patrimoineHistory = snapshots.map((s) => s.patrimoineCents);
  const rentabiliteHistory = snapshots.map((s) => s.rentabiliteNette);
  const plusValueHistory = snapshots.map((s) => s.plusValueCents);

  const docsByType = documents.reduce<Record<string, number>>(
    (acc, d) => ({ ...acc, [d.type]: (acc[d.type] ?? 0) + 1 }),
    {},
  );

  const activeContractCount = contracts.filter(
    (c) => c.status === "actif" || c.status === "a_renouveler",
  ).length;

  const main = (
    <>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Bonjour {user.profile.displayName} !{" "}
            <span aria-hidden>👋</span>
          </h1>
          <p className="mt-1 text-text-muted">
            Bienvenue dans votre espace personnel.
          </p>
        </div>
        <div className="flex flex-col gap-2 lg:w-64">
          <BienSelector properties={properties} />
        </div>
      </div>

      <InfoBanner>
        <Link
          href="/outils/informations"
          className="font-semibold text-primary-strong hover:underline"
        >
          Complétez vos informations personnelles
        </Link>{" "}
        pour profiter pleinement de votre espace et affiner vos indicateurs.
      </InfoBanner>

      <section className="overflow-hidden rounded-xl border border-border bg-surface shadow-card">
        <div className="flex flex-col items-center gap-5 p-6 lg:flex-row lg:gap-8 lg:p-8">
          <ScoreRing value={score.global} size="md" showLevelLabel />
          <div className="flex-1 space-y-3 text-center lg:text-left">
            <h2 className="text-xl font-bold text-text-primary">
              Niveau de risque{" "}
              <span className="text-primary">
                de vos investissements immobiliers
              </span>
            </h2>
            <p className="text-sm text-text-muted">
              Objectif {score.target}/100 — il vous manque{" "}
              <span className="font-semibold text-text-primary">
                {score.gap} points
              </span>{" "}
              pour atteindre le niveau suivant.
            </p>
            <div>
              <Button asChild>
                <Link href="/outils/score">
                  Améliorer mon score Keyni
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          icon={CircleDollarSign}
          title="Cash flow"
          value={`${formatEuros(cashFlow)} /mois`}
          deltaLabel="−1,8 % vs mois dernier"
          deltaDirection="down"
          deltaTone="negative"
          chart="bar"
          chartColor="#0ea5e9"
          iconBg="rgba(14, 165, 233, 0.14)"
          chartData={
            cashFlowHistory.length
              ? cashFlowHistory
              : [34_000, 38_000, 42_000, 48_000, 52_000, 55_000]
          }
        />
        <KpiCard
          icon={Home}
          title="Patrimoine immobilier"
          value={formatEuros(patrimoine)}
          deltaLabel="−0,45 %"
          deltaDirection="down"
          deltaTone="negative"
          chart="line"
          chartColor="#f59e0b"
          iconBg="rgba(245, 158, 11, 0.14)"
          chartData={
            patrimoineHistory.length
              ? patrimoineHistory.map((v) => Math.round(v / 1000))
              : [59_000, 59_800, 60_500, 61_200, 61_800, 62_000]
          }
        />
        <KpiCard
          icon={FileCheck2}
          title="Rentabilité nette"
          value={formatPercent(rentabilite)}
          deltaLabel="−1,1 pt"
          deltaDirection="down"
          deltaTone="negative"
          chart="line"
          chartColor="#f97316"
          iconBg="rgba(249, 115, 22, 0.12)"
          chartData={
            rentabiliteHistory.length
              ? rentabiliteHistory
              : [4.1, 3.9, 3.6, 3.4, 3.25, 3.12]
          }
        />
        <KpiCard
          icon={TrendingUp}
          title="Plus-value réalisée"
          value={formatEuros(plusValue, { showSign: true })}
          deltaLabel={`+${plusValueDeltaPct} % depuis acquisition`}
          deltaDirection="up"
          deltaTone="positive"
          chart="area"
          chartColor="#14b8a6"
          iconBg="rgba(20, 184, 166, 0.14)"
          chartData={
            plusValueHistory.length
              ? plusValueHistory.map((v) => Math.round(v / 100))
              : [72_000, 75_000, 78_000, 81_000, 85_000, 87_300]
          }
        />
      </section>

      <p className="text-xs text-text-muted">
        {activeContractCount} contrat{activeContractCount > 1 ? "s" : ""} actif
        {activeContractCount > 1 ? "s" : ""} · {documents.length} document
        {documents.length > 1 ? "s" : ""} partagés
      </p>
    </>
  );

  const aside = (
    <>
      <TrustpilotBadge />
      <div className="rounded-xl border border-border bg-surface p-5 shadow-card">
        <h3 className="text-base font-semibold text-text-primary">Documents</h3>
        <p className="mt-1 text-xs text-text-muted">
          Téléchargez vos documents importants.
        </p>
        <div className="mt-4 grid gap-2">
          <DocLink
            icon={<Shield className="h-4 w-4" />}
            label="Attestations"
            count={docsByType.attestation ?? 0}
          />
          <DocLink
            icon={<Calendar className="h-4 w-4" />}
            label="Échéanciers"
            count={docsByType.echeancier ?? 0}
          />
          <DocLink
            icon={<Receipt className="h-4 w-4" />}
            label="Factures"
            count={docsByType.facture ?? 0}
          />
        </div>
      </div>
      <div className="rounded-xl border border-border bg-surface p-5 shadow-card">
        <h3 className="text-base font-semibold text-text-primary">Sinistre +</h3>
        <p className="mt-1 text-sm text-text-muted">
          Déclarez un sinistre en 2 clics.
        </p>
        <Button asChild size="sm" className="mt-4 w-full justify-center">
          <Link href="/sinistres/nouveau">
            <FileText className="h-4 w-4" /> Déclarer un sinistre
          </Link>
        </Button>
      </div>
      <HelpCard />
    </>
  );

  return <PageWithAside main={main} aside={aside} />;
}

function DocLink({
  icon,
  label,
  count,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
}) {
  return (
    <Link
      href="/mes-contrats"
      className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-sm transition hover:border-primary"
    >
      <span className="flex items-center gap-2 text-text-primary">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-primary-soft text-primary">
          {icon}
        </span>
        <span>
          <span className="block font-medium">{label}</span>
          <span className="block text-xs text-text-muted">
            {count} document{count > 1 ? "s" : ""} disponible
            {count > 1 ? "s" : ""}
          </span>
        </span>
      </span>
      <ArrowRight className="h-4 w-4 text-text-muted" />
    </Link>
  );
}
