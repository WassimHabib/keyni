import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download, FileText, ShieldCheck } from "lucide-react";

import { requireUser } from "@/features/auth/guards";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageWithAside } from "@/components/layout/page-with-aside";
import { TrustpilotBadge } from "@/components/layout/widgets/trustpilot-badge";
import { HelpCard } from "@/components/layout/widgets/help-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDateFr, formatEuros } from "@/lib/utils";
import {
  CONTRACT_STATUS_LABEL,
  CONTRACT_TYPE_LABEL,
} from "@/features/contracts/types";
import { repositories } from "@/lib/db/repositories";

export const metadata: Metadata = {
  title: "Détail du contrat",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ContractDetailPage({ params }: PageProps) {
  const user = await requireUser();
  const { id } = await params;
  const contract = await repositories.contracts.findById(id);
  if (!contract || contract.userId !== user.id) notFound();

  const [property, documents, sinistres] = await Promise.all([
    repositories.properties.findById(contract.propertyId),
    repositories.documents.findAllByUser(user.id, contract.propertyId),
    repositories.sinistres.findAllByContract(contract.id),
  ]);

  const linkedDocs = documents.filter(
    (d) => d.contractId === contract.id || d.propertyId === contract.propertyId,
  );

  const main = (
    <>
      <Link
        href="/mes-contrats"
        className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary"
      >
        <ArrowLeft className="h-4 w-4" /> Retour
      </Link>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {contract.type} — {CONTRACT_TYPE_LABEL[contract.type]}
          </h1>
          <p className="mt-1 text-text-muted">
            {property?.name ?? "—"} · {contract.assureur} ·{" "}
            {contract.numeroPolice}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant={
              contract.status === "actif"
                ? "success"
                : contract.status === "a_renouveler"
                  ? "warning"
                  : contract.status === "expire"
                    ? "danger"
                    : "neutral"
            }
          >
            {CONTRACT_STATUS_LABEL[contract.status]}
          </Badge>
          <Button size="sm" variant="secondary">
            <Download className="h-4 w-4" /> Attestation
          </Button>
        </div>
      </div>

      <Tabs defaultValue="infos" className="w-full">
        <TabsList>
          <TabsTrigger value="infos">Informations</TabsTrigger>
          <TabsTrigger value="garanties">Garanties</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="sinistres">Sinistres liés</TabsTrigger>
        </TabsList>

        <TabsContent value="infos">
          <div className="grid gap-4 rounded-xl border border-border bg-surface p-5 shadow-card sm:grid-cols-2">
            <Detail label="Assureur" value={contract.assureur} />
            <Detail label="N° de police" value={contract.numeroPolice} />
            <Detail
              label="Prime annuelle"
              value={formatEuros(contract.primeAnnuelleCents)}
            />
            <Detail
              label="Début de contrat"
              value={formatDateFr(contract.dateDebut)}
            />
            <Detail
              label="Date d'échéance"
              value={formatDateFr(contract.dateEcheance)}
            />
            <Detail
              label="Statut"
              value={CONTRACT_STATUS_LABEL[contract.status]}
            />
          </div>
        </TabsContent>

        <TabsContent value="garanties">
          <ul className="space-y-2">
            {contract.garanties.length === 0 ? (
              <li className="text-sm text-text-muted">
                Aucune garantie enregistrée pour ce contrat.
              </li>
            ) : (
              contract.garanties.map((g) => (
                <li
                  key={g}
                  className="flex items-center gap-2 rounded-md border border-border bg-surface px-4 py-3 text-sm"
                >
                  <ShieldCheck className="h-4 w-4 text-primary" /> {g}
                </li>
              ))
            )}
          </ul>
        </TabsContent>

        <TabsContent value="documents">
          <div className="grid gap-3 sm:grid-cols-2">
            {linkedDocs.length === 0 ? (
              <p className="text-sm text-text-muted">Aucun document lié.</p>
            ) : (
              linkedDocs.map((doc) => (
                <article
                  key={doc.id}
                  className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface p-4 text-sm"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <div>
                      <p className="font-medium">{doc.filename}</p>
                      <p className="text-xs text-text-muted">
                        {Math.round(doc.sizeBytes / 1024)} Ko ·{" "}
                        {formatDateFr(doc.uploadedAt)}
                      </p>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost">
                    <Download className="h-4 w-4" />
                  </Button>
                </article>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="sinistres">
          {sinistres.length === 0 ? (
            <p className="text-sm text-text-muted">Aucun sinistre lié.</p>
          ) : (
            <ul className="space-y-2">
              {sinistres.map((s) => (
                <li
                  key={s.id}
                  className="rounded-md border border-border bg-surface p-4 text-sm"
                >
                  <p className="font-medium text-text-primary">
                    {s.referenceInterne}
                  </p>
                  <p className="text-xs text-text-muted">
                    {formatDateFr(s.dateSurvenue)} — {s.description.slice(0, 80)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>
    </>
  );

  const aside = (
    <>
      <TrustpilotBadge />
      <HelpCard />
    </>
  );

  return <PageWithAside main={main} aside={aside} />;
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-text-muted">{label}</p>
      <p className="font-medium text-text-primary">{value}</p>
    </div>
  );
}
