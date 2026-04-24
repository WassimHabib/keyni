import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  FileText,
  Gauge,
  Home,
  ShieldAlert,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateFr, formatEuros, initials } from "@/lib/utils";
import { repositories } from "@/lib/db/repositories";
import {
  SINISTRE_STATUS_LABEL,
  SINISTRE_TYPE_LABEL,
} from "@/features/sinistres/types";

export const metadata: Metadata = {
  title: "Back-office — Vue d'ensemble",
};

export default async function AdminDashboardPage() {
  const users = await repositories.users.findAll();
  const clients = users.filter((u) => u.role === "user");

  const clientStats = await Promise.all(
    clients.map(async (client) => {
      const [properties, contracts, sinistres] = await Promise.all([
        repositories.properties.findAllByUser(client.id),
        repositories.contracts.findAllByUser(client.id),
        repositories.sinistres.findAllByUser(client.id),
      ]);
      const patrimoine = properties.reduce(
        (acc, p) => acc + p.valeurActuelleEstimeeCents,
        0,
      );
      return { client, properties, contracts, sinistres, patrimoine };
    }),
  );

  const totalProperties = clientStats.reduce(
    (acc, s) => acc + s.properties.length,
    0,
  );
  const totalContracts = clientStats.reduce(
    (acc, s) => acc + s.contracts.length,
    0,
  );
  const activeContracts = clientStats.reduce(
    (acc, s) => acc + s.contracts.filter((c) => c.status === "actif").length,
    0,
  );
  const totalSinistres = clientStats.reduce(
    (acc, s) => acc + s.sinistres.length,
    0,
  );
  const openSinistres = clientStats.reduce(
    (acc, s) =>
      acc +
      s.sinistres.filter(
        (x) => x.status === "declare" || x.status === "en_cours",
      ).length,
    0,
  );
  const totalPatrimoine = clientStats.reduce((acc, s) => acc + s.patrimoine, 0);

  const recentClients = [...clients]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 5);

  const recentSinistres = clientStats
    .flatMap((s) =>
      s.sinistres.map((sin) => ({ sin, clientId: s.client.id, clientName: s.client.profile.displayName })),
    )
    .sort(
      (a, b) => b.sin.dateDeclaration.getTime() - a.sin.dateDeclaration.getTime(),
    )
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Back-office Keyni
        </h1>
        <p className="mt-1 text-text-muted">
          Pilotage des clients, contrats et sinistres.
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Users}
          label="Clients actifs"
          value={clients.length.toString()}
          hint={`${users.length - clients.length} administrateur${users.length - clients.length > 1 ? "s" : ""}`}
          accent="text-chart-1"
          bg="bg-chart-1/10"
        />
        <StatCard
          icon={Home}
          label="Biens gérés"
          value={totalProperties.toString()}
          hint={`${formatEuros(totalPatrimoine)} de patrimoine total`}
          accent="text-primary"
          bg="bg-primary-soft"
        />
        <StatCard
          icon={FileText}
          label="Contrats"
          value={totalContracts.toString()}
          hint={`${activeContracts} actifs`}
          accent="text-chart-3"
          bg="bg-chart-3/10"
        />
        <StatCard
          icon={ShieldAlert}
          label="Sinistres"
          value={totalSinistres.toString()}
          hint={`${openSinistres} ouvert${openSinistres > 1 ? "s" : ""}`}
          accent="text-danger"
          bg="bg-danger/10"
        />
      </section>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <section className="rounded-xl border border-border bg-surface p-5 shadow-card">
          <header className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Clients récents</h2>
              <p className="text-sm text-text-muted">
                Les 5 derniers comptes ouverts.
              </p>
            </div>
            <Button asChild size="sm" variant="secondary">
              <Link href="/admin/clients">
                Tous les clients <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </header>
          <ul className="space-y-2">
            {recentClients.map((client) => {
              const stats = clientStats.find((s) => s.client.id === client.id);
              return (
                <li
                  key={client.id}
                  className="flex items-center justify-between gap-3 rounded-md border border-border bg-background px-4 py-3 text-sm"
                >
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary-strong">
                      {initials(client.profile.displayName)}
                    </span>
                    <div>
                      <p className="font-medium text-text-primary">
                        {client.profile.displayName}
                      </p>
                      <p className="text-xs text-text-muted">{client.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-text-muted">
                      {stats?.properties.length ?? 0} bien
                      {(stats?.properties.length ?? 0) > 1 ? "s" : ""}
                    </span>
                    <Button asChild size="sm" variant="ghost">
                      <Link href={`/admin/clients/${client.id}`}>
                        Voir
                      </Link>
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="rounded-xl border border-border bg-surface p-5 shadow-card">
          <header className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Derniers sinistres</h2>
              <p className="text-sm text-text-muted">À suivre en priorité.</p>
            </div>
            <Button asChild size="sm" variant="secondary">
              <Link href="/admin/sinistres">
                Tous <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </header>
          {recentSinistres.length === 0 ? (
            <p className="text-sm text-text-muted">Aucun sinistre déclaré.</p>
          ) : (
            <ul className="space-y-2">
              {recentSinistres.map(({ sin, clientId, clientName }) => (
                <li
                  key={sin.id}
                  className="rounded-md border border-border bg-background p-3 text-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">
                      {SINISTRE_TYPE_LABEL[sin.type]}
                    </span>
                    <Badge
                      variant={
                        sin.status === "cloture"
                          ? "success"
                          : sin.status === "refuse"
                            ? "danger"
                            : "warning"
                      }
                    >
                      {SINISTRE_STATUS_LABEL[sin.status]}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-text-muted">
                    {sin.referenceInterne} ·{" "}
                    <Link
                      href={`/admin/clients/${clientId}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {clientName}
                    </Link>{" "}
                    · {formatDateFr(sin.dateDeclaration)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="rounded-xl border border-border bg-surface p-5 shadow-card">
        <header className="mb-3 flex items-center gap-2">
          <Gauge className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Performances globales</h2>
        </header>
        <dl className="grid gap-4 sm:grid-cols-3">
          <MetricRow
            label="Patrimoine total sous gestion"
            value={formatEuros(totalPatrimoine)}
          />
          <MetricRow
            label="Ratio contrats actifs / biens"
            value={
              totalProperties > 0
                ? `${Math.round((activeContracts / totalProperties) * 100)} %`
                : "—"
            }
          />
          <MetricRow
            label="Sinistres en cours"
            value={openSinistres.toString()}
          />
        </dl>
      </section>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  accent,
  bg,
}: {
  icon: typeof Users;
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
        <span className="text-sm font-medium text-text-secondary">
          {label}
        </span>
      </div>
      <p className="mt-3 text-2xl font-bold text-text-primary">{value}</p>
      {hint ? <p className="text-xs text-text-muted">{hint}</p> : null}
    </article>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-background p-4">
      <dt className="text-xs font-medium text-text-muted">{label}</dt>
      <dd className="mt-1 text-xl font-semibold text-text-primary">{value}</dd>
    </div>
  );
}
