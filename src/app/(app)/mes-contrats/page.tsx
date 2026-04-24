import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Download,
  FilePlus2,
  ShieldCheck,
} from "lucide-react";

import { requireUser } from "@/features/auth/guards";
import { Badge } from "@/components/ui/badge";
import { BienSelector } from "@/components/ui/bien-selector";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageWithAside } from "@/components/layout/page-with-aside";
import { TrustpilotBadge } from "@/components/layout/widgets/trustpilot-badge";
import { HelpCard } from "@/components/layout/widgets/help-card";
import { formatDateFr, formatEuros } from "@/lib/utils";
import {
  CONTRACT_STATUS_LABEL,
  CONTRACT_TYPE_LABEL,
  type Contract,
  type ContractStatus,
} from "@/features/contracts/types";
import { repositories } from "@/lib/db/repositories";

export const metadata: Metadata = {
  title: "Mes contrats",
};

type Filter = "tous" | "actifs" | "a_renouveler" | "expires";

interface PageProps {
  searchParams: Promise<{ bien?: string; filtre?: string }>;
}

const FILTERS: { key: Filter; label: string }[] = [
  { key: "tous", label: "Tous" },
  { key: "actifs", label: "Actifs" },
  { key: "a_renouveler", label: "À renouveler" },
  { key: "expires", label: "Expirés" },
];

const STATUS_BADGE: Record<ContractStatus, "success" | "warning" | "danger" | "neutral"> = {
  actif: "success",
  a_renouveler: "warning",
  en_attente: "neutral",
  expire: "danger",
  resilie: "neutral",
};

export default async function MesContratsPage({ searchParams }: PageProps) {
  const user = await requireUser();
  const { bien, filtre } = await searchParams;
  const [contracts, properties] = await Promise.all([
    repositories.contracts.findAllByUser(
      user.id,
      bien && bien !== "all" ? bien : undefined,
    ),
    repositories.properties.findAllByUser(user.id),
  ]);

  const activeFilter: Filter = (FILTERS.find((f) => f.key === filtre)?.key ??
    "tous") as Filter;

  const filtered = contracts.filter((c) => {
    if (activeFilter === "tous") return true;
    if (activeFilter === "actifs") return c.status === "actif";
    if (activeFilter === "a_renouveler") return c.status === "a_renouveler";
    if (activeFilter === "expires") return c.status === "expire";
    return true;
  });

  const actifs = contracts.filter((c) => c.status === "actif").length;
  const aRenouveler = contracts.filter(
    (c) => c.status === "a_renouveler",
  ).length;
  const expires = contracts.filter((c) => c.status === "expire").length;
  const nextEcheance = [...contracts]
    .sort((a, b) => a.dateEcheance.getTime() - b.dateEcheance.getTime())
    .find((c) => c.dateEcheance.getTime() > Date.now());

  const main = (
    <>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mes contrats</h1>
          <p className="mt-1 text-text-muted">
            Tous vos contrats d'assurance en un coup d'œil.
          </p>
        </div>
        <div className="flex flex-col gap-2 lg:w-64">
          <BienSelector properties={properties} />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const isActive = activeFilter === f.key;
          const params = new URLSearchParams();
          if (bien && bien !== "all") params.set("bien", bien);
          if (f.key !== "tous") params.set("filtre", f.key);
          const href = params.toString()
            ? `/mes-contrats?${params.toString()}`
            : "/mes-contrats";
          return (
            <Link
              key={f.key}
              href={href}
              className={`inline-flex items-center rounded-full px-4 py-1.5 text-sm font-medium transition ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "bg-surface text-text-secondary shadow-card hover:bg-muted"
              }`}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={FilePlus2}
          title="Aucun contrat à afficher"
          description="Complétez votre couverture pour protéger vos investissements."
          action={{
            href: "/outils/score",
            label: "Voir les offres recommandées",
          }}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => (
            <ContractRow
              key={c.id}
              contract={c}
              propertyName={
                properties.find((p) => p.id === c.propertyId)?.name ?? "—"
              }
            />
          ))}
        </div>
      )}
    </>
  );

  const aside = (
    <>
      <TrustpilotBadge />
      <div className="rounded-xl border border-border bg-surface p-5 shadow-card">
        <h3 className="text-sm font-semibold text-text-muted">Récap</h3>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-text-secondary">Contrats actifs</dt>
            <dd className="font-semibold text-success">{actifs}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-text-secondary">À renouveler</dt>
            <dd className="font-semibold text-warning">{aRenouveler}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-text-secondary">Expirés</dt>
            <dd className="font-semibold text-danger">{expires}</dd>
          </div>
          {nextEcheance ? (
            <div className="border-t border-border pt-2 text-xs text-text-muted">
              Prochaine échéance :{" "}
              <span className="font-semibold text-text-primary">
                {formatDateFr(nextEcheance.dateEcheance)}
              </span>
            </div>
          ) : null}
        </dl>
      </div>
      <HelpCard />
    </>
  );

  return <PageWithAside main={main} aside={aside} />;
}

function ContractRow({
  contract,
  propertyName,
}: {
  contract: Contract;
  propertyName: string;
}) {
  return (
    <article className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5 shadow-card md:flex-row md:items-center md:justify-between">
      <div className="flex items-start gap-3">
        <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <div className="space-y-1">
          <p className="font-semibold text-text-primary">
            {contract.type} — {CONTRACT_TYPE_LABEL[contract.type]}
          </p>
          <p className="text-sm text-text-muted">
            🏠 {propertyName} · {contract.assureur} · {contract.numeroPolice}
          </p>
          <p className="text-xs text-text-muted">
            Prime annuelle {formatEuros(contract.primeAnnuelleCents)} · Échéance{" "}
            {formatDateFr(contract.dateEcheance)}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 md:justify-end">
        <Badge variant={STATUS_BADGE[contract.status]}>
          {CONTRACT_STATUS_LABEL[contract.status]}
        </Badge>
        <Button asChild size="sm" variant="secondary">
          <Link href={`/mes-contrats/${contract.id}`}>
            Voir le détail <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
        <Button size="sm" variant="ghost" title="Télécharger l'attestation">
          <Download className="h-4 w-4" /> Attestation
        </Button>
      </div>
    </article>
  );
}
