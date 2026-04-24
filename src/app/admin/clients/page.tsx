import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Search, UserPlus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDateFr, formatEuros, initials } from "@/lib/utils";
import { repositories } from "@/lib/db/repositories";

export const metadata: Metadata = {
  title: "Clients — Back-office",
};

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function AdminClientsPage({ searchParams }: PageProps) {
  const { q } = await searchParams;
  const users = await repositories.users.findAll();
  const clients = users.filter((u) => u.role === "user");

  const query = (q ?? "").trim().toLowerCase();
  const filtered = query
    ? clients.filter(
        (c) =>
          c.email.includes(query) ||
          c.profile.displayName.toLowerCase().includes(query) ||
          (c.profile.firstName ?? "").toLowerCase().includes(query) ||
          (c.profile.lastName ?? "").toLowerCase().includes(query),
      )
    : clients;

  const rows = await Promise.all(
    filtered.map(async (client) => {
      const [properties, contracts, sinistres] = await Promise.all([
        repositories.properties.findAllByUser(client.id),
        repositories.contracts.findAllByUser(client.id),
        repositories.sinistres.findAllByUser(client.id),
      ]);
      const patrimoine = properties.reduce(
        (acc, p) => acc + p.valeurActuelleEstimeeCents,
        0,
      );
      const activeContracts = contracts.filter(
        (c) => c.status === "actif",
      ).length;
      const openSinistres = sinistres.filter(
        (s) => s.status === "declare" || s.status === "en_cours",
      ).length;
      return { client, properties, activeContracts, openSinistres, patrimoine };
    }),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
          <p className="mt-1 text-text-muted">
            {clients.length} client{clients.length > 1 ? "s" : ""} actif
            {clients.length > 1 ? "s" : ""} dans le portefeuille Keyni.
          </p>
        </div>
        <Button variant="secondary" size="md" disabled title="Disponible prochainement">
          <UserPlus className="h-4 w-4" /> Nouveau client
        </Button>
      </div>

      <form className="relative" action="/admin/clients">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <Input
          name="q"
          placeholder="Rechercher par nom, prénom ou email"
          defaultValue={q ?? ""}
          className="pl-10"
        />
      </form>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface p-10 text-center text-sm text-text-muted">
          Aucun client ne correspond à cette recherche.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-card">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left text-xs uppercase tracking-wide text-text-muted">
              <tr>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Biens</th>
                <th className="px-4 py-3">Contrats</th>
                <th className="px-4 py-3">Sinistres</th>
                <th className="px-4 py-3">Patrimoine</th>
                <th className="px-4 py-3">Inscrit le</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ client, properties, activeContracts, openSinistres, patrimoine }) => (
                <tr
                  key={client.id}
                  className="border-t border-border bg-surface"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary-strong">
                        {initials(client.profile.displayName)}
                      </span>
                      <div>
                        <p className="font-medium text-text-primary">
                          {client.profile.displayName}
                        </p>
                        <p className="text-xs text-text-muted">
                          {client.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {properties.length}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={activeContracts > 0 ? "success" : "neutral"}>
                      {activeContracts} actif{activeContracts > 1 ? "s" : ""}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {openSinistres > 0 ? (
                      <Badge variant="warning">
                        {openSinistres} ouvert{openSinistres > 1 ? "s" : ""}
                      </Badge>
                    ) : (
                      <span className="text-xs text-text-muted">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {formatEuros(patrimoine)}
                  </td>
                  <td className="px-4 py-3 text-xs text-text-muted">
                    {formatDateFr(client.createdAt)}
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
