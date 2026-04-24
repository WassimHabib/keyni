import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CircleDollarSign,
  FileText,
  Home,
  ShieldAlert,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { ScoreRing } from "@/components/charts/score-ring";
import { computeScore } from "@/features/score/engine";
import { formatDateFr, formatEuros, formatPercent, initials } from "@/lib/utils";
import { repositories } from "@/lib/db/repositories";
import {
  CONTRACT_STATUS_LABEL,
  CONTRACT_TYPE_LABEL,
} from "@/features/contracts/types";
import {
  SINISTRE_STATUS_LABEL,
  SINISTRE_TYPE_LABEL,
} from "@/features/sinistres/types";

export const metadata: Metadata = {
  title: "Fiche client",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminClientDetailPage({ params }: PageProps) {
  const { id } = await params;
  const client = await repositories.users.findById(id);
  if (!client || client.role !== "user") notFound();

  const [properties, contracts, documents, sinistres, sessions] =
    await Promise.all([
      repositories.properties.findAllByUser(client.id),
      repositories.contracts.findAllByUser(client.id),
      repositories.documents.findAllByUser(client.id),
      repositories.sinistres.findAllByUser(client.id),
      repositories.sessions.findAllForUser(client.id),
    ]);

  const score = computeScore({
    profile: client.profile,
    properties,
    contracts,
    documents,
  });

  const patrimoine = properties.reduce(
    (acc, p) => acc + p.valeurActuelleEstimeeCents,
    0,
  );
  const cashFlow = properties.reduce(
    (acc, p) =>
      acc +
      (p.finances.loyerMensuelCents -
        p.finances.chargesMensuellesCents -
        p.finances.mensualiteCreditCents),
    0,
  );
  const loyersAnnuels = properties.reduce(
    (acc, p) => acc + p.finances.loyerMensuelCents * 12,
    0,
  );
  const rentabilite =
    patrimoine > 0 ? Number(((loyersAnnuels / patrimoine) * 100).toFixed(2)) : 0;

  return (
    <div className="space-y-6">
      <Link
        href="/admin/clients"
        className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary"
      >
        <ArrowLeft className="h-4 w-4" /> Tous les clients
      </Link>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary-soft text-lg font-semibold text-primary-strong">
            {initials(client.profile.displayName)}
          </span>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">
              {client.profile.displayName}
            </h1>
            <p className="text-sm text-text-muted">{client.email}</p>
            <p className="text-xs text-text-muted">
              Client depuis le {formatDateFr(client.createdAt)} ·{" "}
              {sessions.length} session{sessions.length > 1 ? "s" : ""} active
              {sessions.length > 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-surface p-3 shadow-card">
          <ScoreRing value={score.global} size="sm" showLevelLabel />
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MiniStat
          icon={Home}
          label="Biens"
          value={properties.length.toString()}
          hint={formatEuros(patrimoine)}
          accent="text-primary"
          bg="bg-primary-soft"
        />
        <MiniStat
          icon={FileText}
          label="Contrats"
          value={contracts.length.toString()}
          hint={`${contracts.filter((c) => c.status === "actif").length} actifs`}
          accent="text-chart-3"
          bg="bg-chart-3/10"
        />
        <MiniStat
          icon={CircleDollarSign}
          label="Cash flow / mois"
          value={formatEuros(cashFlow)}
          hint={`Rentabilité ${formatPercent(rentabilite)}`}
          accent="text-chart-1"
          bg="bg-chart-1/10"
        />
        <MiniStat
          icon={ShieldAlert}
          label="Sinistres"
          value={sinistres.length.toString()}
          hint={`${sinistres.filter((s) => s.status === "declare" || s.status === "en_cours").length} ouverts`}
          accent="text-danger"
          bg="bg-danger/10"
        />
      </section>

      <section className="rounded-xl border border-border bg-surface p-5 shadow-card">
        <h2 className="text-lg font-semibold">Profil</h2>
        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
          <Info label="Nom" value={`${client.profile.firstName ?? ""} ${client.profile.lastName ?? ""}`.trim() || "—"} />
          <Info label="Situation" value={client.profile.situation ?? "—"} />
          <Info
            label="Régime fiscal"
            value={client.profile.regimeFiscal ?? "—"}
          />
          <Info
            label="Revenus mensuels nets"
            value={
              client.profile.revenusMensuelsNetsCents !== undefined
                ? formatEuros(client.profile.revenusMensuelsNetsCents)
                : "—"
            }
          />
          <Info
            label="Charges mensuelles"
            value={
              client.profile.chargesMensuellesCents !== undefined
                ? formatEuros(client.profile.chargesMensuellesCents)
                : "—"
            }
          />
          <Info
            label="Personnes au foyer"
            value={(client.profile.personnesFoyer ?? "—").toString()}
          />
        </dl>
      </section>

      <section className="rounded-xl border border-border bg-surface p-5 shadow-card">
        <h2 className="text-lg font-semibold">Biens ({properties.length})</h2>
        {properties.length === 0 ? (
          <p className="mt-2 text-sm text-text-muted">
            Aucun bien enregistré.
          </p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {properties.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between rounded-md border border-border bg-background p-3"
              >
                <div>
                  <p className="font-medium">{p.name}</p>
                  <p className="text-xs text-text-muted">
                    {p.type} · {p.usage} · {p.surface} m² ·{" "}
                    {formatEuros(p.valeurActuelleEstimeeCents)}
                  </p>
                </div>
                <span className="text-xs text-text-muted">
                  {formatDateFr(p.dateAcquisition)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-border bg-surface p-5 shadow-card">
        <h2 className="text-lg font-semibold">Contrats ({contracts.length})</h2>
        {contracts.length === 0 ? (
          <p className="mt-2 text-sm text-text-muted">Aucun contrat.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {contracts.map((c) => {
              const property = properties.find((p) => p.id === c.propertyId);
              return (
                <li
                  key={c.id}
                  className="flex items-center justify-between rounded-md border border-border bg-background p-3"
                >
                  <div>
                    <p className="font-medium">
                      {c.type} — {CONTRACT_TYPE_LABEL[c.type]}
                    </p>
                    <p className="text-xs text-text-muted">
                      {property?.name ?? "—"} · {c.assureur} ·{" "}
                      {formatEuros(c.primeAnnuelleCents)}/an
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        c.status === "actif"
                          ? "success"
                          : c.status === "a_renouveler"
                            ? "warning"
                            : c.status === "expire"
                              ? "danger"
                              : "neutral"
                      }
                    >
                      {CONTRACT_STATUS_LABEL[c.status]}
                    </Badge>
                    <span className="text-xs text-text-muted">
                      {formatDateFr(c.dateEcheance)}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-border bg-surface p-5 shadow-card">
        <h2 className="text-lg font-semibold">
          Sinistres ({sinistres.length})
        </h2>
        {sinistres.length === 0 ? (
          <p className="mt-2 text-sm text-text-muted">Aucun sinistre.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {sinistres.map((s) => (
              <li
                key={s.id}
                className="rounded-md border border-border bg-background p-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">
                    {SINISTRE_TYPE_LABEL[s.type]}
                  </span>
                  <Badge
                    variant={
                      s.status === "cloture"
                        ? "success"
                        : s.status === "refuse"
                          ? "danger"
                          : "warning"
                    }
                  >
                    {SINISTRE_STATUS_LABEL[s.status]}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-text-muted">
                  {s.referenceInterne} · déclaré le{" "}
                  {formatDateFr(s.dateDeclaration)} · {s.description.slice(0, 90)}
                  {s.description.length > 90 ? "…" : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-border bg-surface p-5 shadow-card">
        <h2 className="text-lg font-semibold">
          Documents ({documents.length})
        </h2>
        {documents.length === 0 ? (
          <p className="mt-2 text-sm text-text-muted">Aucun document.</p>
        ) : (
          <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            {documents.map((d) => (
              <li
                key={d.id}
                className="flex items-center justify-between rounded-md border border-border bg-background p-3"
              >
                <div>
                  <p className="font-medium">{d.filename}</p>
                  <p className="text-xs text-text-muted">
                    {d.type} · {Math.round(d.sizeBytes / 1024)} Ko ·{" "}
                    {formatDateFr(d.uploadedAt)}
                  </p>
                </div>
                <Badge
                  variant={
                    d.conformity === "conform"
                      ? "success"
                      : d.conformity === "non_conform"
                        ? "danger"
                        : d.conformity === "needs_review"
                          ? "warning"
                          : "neutral"
                  }
                >
                  {d.conformity}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
  hint,
  accent,
  bg,
}: {
  icon: typeof Home;
  label: string;
  value: string;
  hint?: string;
  accent: string;
  bg: string;
}) {
  return (
    <article className="rounded-xl border border-border bg-surface p-5 shadow-card">
      <div className="flex items-center gap-3">
        <span
          className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${bg} ${accent}`}
        >
          <Icon className="h-5 w-5" />
        </span>
        <span className="text-sm font-medium text-text-secondary">{label}</span>
      </div>
      <p className="mt-3 text-2xl font-bold text-text-primary">{value}</p>
      {hint ? <p className="text-xs text-text-muted">{hint}</p> : null}
    </article>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-text-muted">{label}</p>
      <p className="font-medium text-text-primary">{value}</p>
    </div>
  );
}
