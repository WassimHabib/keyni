import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateFr } from "@/lib/utils";
import { repositories } from "@/lib/db/repositories";
import {
  SINISTRE_STATUS_LABEL,
  SINISTRE_TYPE_LABEL,
  type SinistreStatus,
} from "@/features/sinistres/types";

export const metadata: Metadata = {
  title: "Sinistres — Back-office",
};

const STATUS_FILTERS: { key: "tous" | SinistreStatus; label: string }[] = [
  { key: "tous", label: "Tous" },
  { key: "declare", label: "Déclarés" },
  { key: "en_cours", label: "En cours" },
  { key: "cloture", label: "Clôturés" },
  { key: "refuse", label: "Refusés" },
];

interface PageProps {
  searchParams: Promise<{ statut?: string }>;
}

export default async function AdminSinistresPage({ searchParams }: PageProps) {
  const { statut } = await searchParams;
  const users = await repositories.users.findAll();
  const clients = users.filter((u) => u.role === "user");

  const rows = (
    await Promise.all(
      clients.map(async (client) => {
        const sinistres = await repositories.sinistres.findAllByUser(client.id);
        return sinistres.map((s) => ({ sinistre: s, client }));
      }),
    )
  )
    .flat()
    .sort(
      (a, b) =>
        b.sinistre.dateDeclaration.getTime() -
        a.sinistre.dateDeclaration.getTime(),
    );

  const activeFilter = (STATUS_FILTERS.find((f) => f.key === statut)?.key ??
    "tous") as (typeof STATUS_FILTERS)[number]["key"];
  const filtered =
    activeFilter === "tous"
      ? rows
      : rows.filter((r) => r.sinistre.status === activeFilter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Sinistres</h1>
        <p className="mt-1 text-text-muted">
          Tous les sinistres déclarés par les clients Keyni.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => {
          const isActive = activeFilter === f.key;
          const href =
            f.key === "tous"
              ? "/admin/sinistres"
              : `/admin/sinistres?statut=${f.key}`;
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
        <div className="rounded-xl border border-dashed border-border bg-surface p-10 text-center text-sm text-text-muted">
          Aucun sinistre pour ce filtre.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-card">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left text-xs uppercase tracking-wide text-text-muted">
              <tr>
                <th className="px-4 py-3">Référence</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Déclaré le</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(({ sinistre, client }) => (
                <tr
                  key={sinistre.id}
                  className="border-t border-border bg-surface"
                >
                  <td className="px-4 py-3 font-mono text-xs text-text-secondary">
                    {sinistre.referenceInterne}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/clients/${client.id}`}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      {client.profile.displayName}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    {SINISTRE_TYPE_LABEL[sinistre.type]}
                  </td>
                  <td className="px-4 py-3 text-xs text-text-muted">
                    {formatDateFr(sinistre.dateDeclaration)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={
                        sinistre.status === "cloture"
                          ? "success"
                          : sinistre.status === "refuse"
                            ? "danger"
                            : "warning"
                      }
                    >
                      {SINISTRE_STATUS_LABEL[sinistre.status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button asChild size="sm" variant="ghost">
                      <Link href={`/admin/clients/${client.id}`}>
                        Ouvrir <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
