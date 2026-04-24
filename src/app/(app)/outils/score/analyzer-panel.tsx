"use client";

import { CheckCircle2, Loader2, ShieldAlert } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  analyzeDocumentAction,
  uploadDocumentAction,
} from "@/features/documents/actions";
import { DropZone } from "@/components/ui/drop-zone";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AnalysisReport } from "@/features/documents/types";
import type { Conformity } from "@/features/documents/types";

interface AnalyzerPanelProps {
  properties: { id: string; name: string }[];
}

type AnalysisState =
  | { status: "idle" }
  | { status: "uploading" }
  | { status: "analyzing"; documentName: string }
  | {
      status: "done";
      documentName: string;
      conformity: Conformity;
      report: AnalysisReport;
    };

const CONFORMITY_LABEL: Record<Conformity, { label: string; variant: "success" | "warning" | "danger" | "neutral" }> = {
  pending: { label: "En attente", variant: "neutral" },
  conform: { label: "Conforme", variant: "success" },
  needs_review: { label: "À revoir", variant: "warning" },
  non_conform: { label: "Non conforme", variant: "danger" },
};

export function DocumentAnalyzerPanel({ properties }: AnalyzerPanelProps) {
  const [selectedProperty, setSelectedProperty] = useState<string | undefined>(
    properties[0]?.id,
  );
  const [state, setState] = useState<AnalysisState>({ status: "idle" });
  const [isPending, startTransition] = useTransition();

  async function handleFile(file: File) {
    setState({ status: "uploading" });
    const formData = new FormData();
    formData.set("file", file);
    if (selectedProperty) formData.set("propertyId", selectedProperty);

    const uploaded = await uploadDocumentAction(formData);
    if (!uploaded.ok || !uploaded.documentId) {
      setState({ status: "idle" });
      toast.error(uploaded.message ?? "Upload échoué");
      return;
    }

    setState({ status: "analyzing", documentName: file.name });
    toast.info("Analyse en cours…", { id: "analyze" });

    startTransition(async () => {
      const analysis = await analyzeDocumentAction(uploaded.documentId!);
      if (!analysis.ok) {
        toast.error(analysis.message ?? "Erreur d'analyse", { id: "analyze" });
        setState({ status: "idle" });
        return;
      }
      setState({
        status: "done",
        documentName: file.name,
        conformity: analysis.conformity,
        report: analysis.report,
      });
      toast.success("Analyse terminée", { id: "analyze" });
    });
  }

  const busy = state.status === "uploading" || state.status === "analyzing" || isPending;

  return (
    <div className="space-y-4">
      {properties.length > 0 ? (
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-text-secondary">
            Bien concerné
          </label>
          <Select
            value={selectedProperty}
            onValueChange={setSelectedProperty}
            disabled={busy}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un bien" />
            </SelectTrigger>
            <SelectContent>
              {properties.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      <DropZone onFile={handleFile} disabled={busy} />

      {state.status === "uploading" || state.status === "analyzing" ? (
        <div className="flex items-center gap-3 rounded-xl border border-border bg-background p-4 text-sm">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <div>
            <p className="font-semibold text-text-primary">
              {state.status === "uploading"
                ? "Téléversement en cours…"
                : `Analyse de ${state.documentName}`}
            </p>
            <p className="text-xs text-text-muted">
              Notre moteur vérifie les clauses clés et évalue la conformité.
            </p>
          </div>
        </div>
      ) : null}

      {state.status === "done" ? (
        <div className="space-y-3 rounded-xl border border-border bg-background p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold text-text-primary">{state.documentName}</p>
            <Badge variant={CONFORMITY_LABEL[state.conformity].variant}>
              {CONFORMITY_LABEL[state.conformity].label}
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-md bg-surface p-3">
              <p className="text-xs text-text-muted">Clauses analysées</p>
              <p className="text-lg font-semibold">
                {state.report.clausesAnalyzed}
              </p>
            </div>
            <div className="rounded-md bg-surface p-3">
              <p className="text-xs text-text-muted">Score de conformité</p>
              <p className="text-lg font-semibold text-primary">
                {state.report.conformityScore}/100
              </p>
            </div>
          </div>
          {state.report.clausesAtRisk.length > 0 ? (
            <ul className="space-y-2 text-sm">
              {state.report.clausesAtRisk.map((clause) => (
                <li
                  key={clause.id}
                  className="flex items-start gap-2 rounded-md bg-surface p-3"
                >
                  <ShieldAlert
                    className={`mt-0.5 h-4 w-4 shrink-0 ${clause.severity === "critical" ? "text-danger" : "text-warning"}`}
                  />
                  <div>
                    <p className="font-medium text-text-primary">
                      {clause.label}
                    </p>
                    <p className="text-xs text-text-muted">
                      {clause.description}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex items-center gap-2 text-sm text-success">
              <CheckCircle2 className="h-4 w-4" /> Aucune clause à risque
              détectée.
            </div>
          )}
          {state.report.recommendations.length > 0 ? (
            <div>
              <p className="text-xs font-semibold text-text-muted">
                Recommandations
              </p>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-text-secondary">
                {state.report.recommendations.map((reco, idx) => (
                  <li key={idx}>{reco}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
