import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  FileText,
  Info,
  Lightbulb,
  ShieldCheck,
  ShieldOff,
  Sparkles,
  Target,
} from "lucide-react";

import { requireUser } from "@/features/auth/guards";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InfoBanner } from "@/components/ui/info-banner";
import { PageWithAside } from "@/components/layout/page-with-aside";
import { Progress } from "@/components/ui/progress";
import { ScoreRing } from "@/components/charts/score-ring";
import { TrustpilotBadge } from "@/components/layout/widgets/trustpilot-badge";
import { formatPercent } from "@/lib/utils";
import { scoreRules } from "@/features/score/rules";
import { CONTRACT_TYPE_LABEL } from "@/features/contracts/types";
import { getUserScore } from "@/features/score/service";
import { repositories } from "@/lib/db/repositories";

import { DocumentAnalyzerPanel } from "./analyzer-panel";

export const metadata: Metadata = {
  title: "Améliorer mon score Keyni",
};

interface PageProps {
  searchParams: Promise<{ bien?: string }>;
}

const CONTRACT_OFFERS = [
  {
    type: "PNO" as const,
    description:
      "Couvre les dommages sur le bien (incendie, dégâts des eaux, etc.).",
    icon: ShieldCheck,
  },
  {
    type: "GLI" as const,
    description: "Vous protège en cas d'impayés de vos locataires.",
    icon: ShieldOff,
  },
  {
    type: "ADP" as const,
    description:
      "Protège votre prêt bancaire en cas d'aléas de la vie (décès, invalidité, perte d'emploi…).",
    icon: ShieldCheck,
  },
];

export default async function ScoreToolPage({ searchParams }: PageProps) {
  const user = await requireUser();
  const { bien } = await searchParams;

  const [score, properties, contracts] = await Promise.all([
    getUserScore(user),
    repositories.properties.findAllByUser(user.id),
    repositories.contracts.findAllByUser(user.id),
  ]);

  const scopedPropertyId = bien && bien !== "all" ? bien : undefined;
  const activeContractTypes = new Set(
    contracts
      .filter(
        (c) =>
          (!scopedPropertyId || c.propertyId === scopedPropertyId) &&
          (c.status === "actif" || c.status === "a_renouveler"),
      )
      .map((c) => c.type),
  );

  const contractsBreakdown = score.breakdown.find((b) => b.category === "contracts")!;
  const docsBreakdown = score.breakdown.find((b) => b.category === "documents")!;
  const profileBreakdown = score.breakdown.find((b) => b.category === "profile")!;
  const totalPossible =
    contractsBreakdown.possible - contractsBreakdown.earned +
    docsBreakdown.possible - docsBreakdown.earned +
    profileBreakdown.possible - profileBreakdown.earned;

  const progressToTarget =
    score.target > 0 ? Math.min(100, (score.global / score.target) * 100) : 0;

  const main = (
    <>
      <Link
        href="/outils"
        className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary"
      >
        <ArrowLeft className="h-4 w-4" /> Retour
      </Link>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Améliorer mon score Keyni
          </h1>
          <p className="mt-1 text-text-muted">
            Agissez sur les leviers ci-dessous pour augmenter votre score et
            réduire vos risques.
          </p>
        </div>
        <div className="hidden shrink-0 items-center gap-4 rounded-xl border border-border bg-surface p-3 shadow-card lg:flex">
          <ScoreRing value={score.global} size="sm" />
          <div className="space-y-1 text-sm">
            <p className="font-semibold text-text-primary">Votre progression</p>
            <p className="text-xs text-text-muted">
              +{totalPossible} pts possibles en complétant les actions
            </p>
          </div>
        </div>
      </div>

      <InfoBanner>
        Votre score Keyni est calculé à partir de 2 grands axes :{" "}
        <span className="font-semibold text-text-primary">
          risques financiers
        </span>{" "}
        et{" "}
        <span className="font-semibold text-text-primary">
          risques juridiques
        </span>
        .
      </InfoBanner>

      <section className="space-y-4 rounded-xl border border-border bg-surface p-6 shadow-card">
        <header className="flex items-center gap-3">
          <Badge variant="module">Module 1</Badge>
          <h2 className="text-lg font-semibold">Risques financiers</h2>
          <Info className="h-4 w-4 text-text-muted" />
        </header>
        <p className="text-sm text-text-muted">
          Les assurances renforcent votre protection financière et votre score.
        </p>
        <div className="space-y-3">
          {CONTRACT_OFFERS.map((offer) => {
            const rule = scoreRules.contracts[offer.type];
            const subscribed = activeContractTypes.has(offer.type);
            const Icon = offer.icon;
            return (
              <article
                key={offer.type}
                className="flex flex-col gap-3 rounded-xl border border-border bg-background p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-semibold text-text-primary">
                      {offer.type} — {CONTRACT_TYPE_LABEL[offer.type]}
                    </p>
                    <p className="text-sm text-text-muted">
                      {offer.description}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                  {subscribed ? (
                    <div className="flex flex-col items-end text-right">
                      <Badge variant="success">
                        <CheckCircle2 className="h-3 w-3" /> Souscrite
                      </Badge>
                      <span className="mt-0.5 text-xs text-success">
                        +{rule.points} pts
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-end text-right">
                      <Badge variant="danger">
                        <AlertTriangle className="h-3 w-3" /> Manquante
                      </Badge>
                      <span className="mt-0.5 text-xs font-semibold text-danger">
                        +{rule.points} pts
                      </span>
                    </div>
                  )}
                  <Button
                    asChild
                    size="sm"
                    variant={subscribed ? "secondary" : "primary"}
                  >
                    <Link href="/contact">
                      {subscribed ? "Voir le contrat" : "Voir les offres"}
                    </Link>
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-border bg-surface p-6 shadow-card">
        <header className="flex items-center gap-3">
          <Badge variant="module">Module 2</Badge>
          <h2 className="text-lg font-semibold">Risques juridiques</h2>
          <Info className="h-4 w-4 text-text-muted" />
        </header>
        <p className="text-sm text-text-muted">
          Évaluez vos documents juridiques pour détecter les failles et
          sécuriser vos relations.
        </p>
        <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
          <DocumentAnalyzerPanel
            properties={properties.map((p) => ({ id: p.id, name: p.name }))}
          />
          <aside className="flex flex-col justify-between gap-3 rounded-xl border border-border bg-primary-soft/40 p-5 text-sm">
            <div className="space-y-3">
              <p className="text-sm font-semibold text-primary-strong">
                Notre analyse automatisée passe en revue vos documents
              </p>
              <ul className="space-y-2 text-sm text-text-secondary">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" /> Détection des
                  clauses à risque
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" /> Vérification
                  de la conformité
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" /> Évaluation
                  des obligations
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />{" "}
                  Recommandations d'amélioration
                </li>
              </ul>
            </div>
            <p className="text-sm font-semibold text-primary">
              Jusqu'à +{scoreRules.legal.maxPerProperty} pts par bien
            </p>
          </aside>
        </div>
      </section>

      <section className="flex items-start gap-3 rounded-xl bg-primary-soft/60 px-4 py-3 text-sm text-primary-strong">
        <Lightbulb className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          <span className="font-semibold">Bon à savoir :</span> plus vos risques
          sont couverts et vos documents en règle, plus votre score Keyni
          augmente.
        </p>
      </section>
    </>
  );

  const aside = (
    <>
      <TrustpilotBadge />

      <div className="rounded-xl border border-border bg-surface p-5 shadow-card">
        <h3 className="text-sm font-semibold text-text-muted">Mon score actuel</h3>
        <div className="mt-2 flex flex-col items-center gap-3">
          <ScoreRing value={score.global} size="sm" showLevelLabel />
          <div className="w-full space-y-1">
            <div className="flex items-center justify-between text-xs text-text-muted">
              <span className="inline-flex items-center gap-1">
                <Target className="h-3.5 w-3.5" /> Objectif : {score.target}/100
              </span>
              <span>
                +{score.gap} pts pour atteindre le niveau suivant
              </span>
            </div>
            <Progress value={progressToTarget} />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface p-5 shadow-card">
        <h3 className="text-sm font-semibold text-text-muted">Impact des actions</h3>
        <dl className="mt-3 space-y-2 text-sm">
          <BreakdownRow
            icon={<ShieldCheck className="h-4 w-4" />}
            label="Assurances souscrites"
            earned={contractsBreakdown.earned}
            possible={contractsBreakdown.possible}
          />
          <BreakdownRow
            icon={<FileText className="h-4 w-4" />}
            label="Documents conformes"
            earned={docsBreakdown.earned}
            possible={docsBreakdown.possible}
          />
          <BreakdownRow
            icon={<Sparkles className="h-4 w-4" />}
            label="Profil complété"
            earned={profileBreakdown.earned}
            possible={profileBreakdown.possible}
          />
          <div className="flex items-center justify-between border-t border-border pt-2 text-sm font-semibold">
            <span>Total possible</span>
            <span className="text-primary">+{totalPossible} pts</span>
          </div>
        </dl>
      </div>

      <div className="rounded-xl border border-border bg-surface p-5 shadow-card">
        <h3 className="text-sm font-semibold text-text-muted">Recommandations</h3>
        {score.recommendations.length === 0 ? (
          <p className="mt-2 text-sm text-text-muted">
            Vous êtes à jour — continuez comme ça !
          </p>
        ) : (
          <ol className="mt-3 space-y-2 text-sm">
            {score.recommendations.map((reco, index) => (
              <li key={reco.id} className="flex items-start gap-2">
                <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary-strong">
                  {index + 1}
                </span>
                <div>
                  <p className="font-medium text-text-primary">{reco.label}</p>
                  <p className="text-xs text-text-muted">{reco.description}</p>
                </div>
              </li>
            ))}
          </ol>
        )}
        <p className="mt-3 text-xs text-text-muted">
          Chaque action vous rapproche d'un meilleur score.
        </p>
      </div>
    </>
  );

  return <PageWithAside main={main} aside={aside} />;
}

function BreakdownRow({
  icon,
  label,
  earned,
  possible,
}: {
  icon: React.ReactNode;
  label: string;
  earned: number;
  possible: number;
}) {
  const remaining = Math.max(0, possible - earned);
  const ratio = possible > 0 ? (earned / possible) * 100 : 0;
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-text-secondary">
          <span className="text-primary">{icon}</span>
          {label}
        </span>
        <span className="text-xs font-semibold text-success">
          {remaining > 0 ? `+${remaining} pts` : "complet"}
        </span>
      </div>
      <div className="mt-1 flex items-center justify-between text-xs text-text-muted">
        <span>
          {earned} / {possible} pts ({formatPercent(ratio, 0)})
        </span>
      </div>
    </div>
  );
}
