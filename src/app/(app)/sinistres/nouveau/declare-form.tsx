"use client";

import { Check, ChevronLeft, ChevronRight, Send } from "lucide-react";
import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";

import { declareSinistreAction } from "@/features/sinistres/actions";
import {
  SINISTRE_TYPE_LABEL,
  type SinistreType,
  SinistreTypeSchema,
} from "@/features/sinistres/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface DeclareFormProps {
  properties: { id: string; name: string }[];
  contracts: { id: string; type: string; propertyId: string }[];
}

const STEPS = [
  { key: "bien", label: "Bien concerné" },
  { key: "details", label: "Détails" },
  { key: "recap", label: "Récapitulatif" },
] as const;

export function DeclareSinistreForm({
  properties,
  contracts,
}: DeclareFormProps) {
  const [state, formAction, pending] = useActionState(declareSinistreAction, {
    ok: false,
  });
  const [step, setStep] = useState(0);

  const [propertyId, setPropertyId] = useState(properties[0]?.id ?? "");
  const [contractId, setContractId] = useState<string | undefined>(undefined);
  const [type, setType] = useState<SinistreType>("degat_des_eaux");
  const [dateSurvenue, setDateSurvenue] = useState(
    new Date().toISOString().split("T")[0]!,
  );
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (state.ok && state.message) {
      toast.success(state.message);
    }
    if (!state.ok && state.message) {
      toast.error(state.message);
    }
  }, [state]);

  const availableContracts = contracts.filter(
    (c) => c.propertyId === propertyId,
  );

  return (
    <div className="space-y-4">
      <nav className="flex items-center gap-2">
        {STEPS.map((s, idx) => {
          const active = idx === step;
          const done = idx < step;
          return (
            <div
              key={s.key}
              className={cn(
                "flex-1 rounded-md border px-3 py-2 text-xs font-medium",
                active && "border-primary bg-primary-soft text-primary-strong",
                done && "border-success bg-success/10 text-success",
                !active && !done && "border-border bg-surface text-text-muted",
              )}
            >
              Étape {idx + 1} · {s.label}
            </div>
          );
        })}
      </nav>

      <form action={formAction} className="space-y-5" noValidate>
        <input type="hidden" name="propertyId" value={propertyId} />
        <input type="hidden" name="contractId" value={contractId ?? ""} />
        <input type="hidden" name="type" value={type} />
        <input type="hidden" name="dateSurvenue" value={dateSurvenue} />
        <input type="hidden" name="description" value={description} />

        {step === 0 ? (
          <div className="space-y-4 rounded-xl border border-border bg-surface p-5 shadow-card">
            <div className="space-y-1.5">
              <Label>Bien concerné</Label>
              <Select value={propertyId} onValueChange={setPropertyId}>
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
            <div className="space-y-1.5">
              <Label>Contrat rattaché (optionnel)</Label>
              <Select
                value={contractId ?? "aucun"}
                onValueChange={(v) =>
                  setContractId(v === "aucun" ? undefined : v)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Aucun" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aucun">Aucun / à déterminer</SelectItem>
                  {availableContracts.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="space-y-4 rounded-xl border border-border bg-surface p-5 shadow-card">
            <div className="space-y-1.5">
              <Label>Type de sinistre</Label>
              <Select
                value={type}
                onValueChange={(v) => setType(v as SinistreType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SinistreTypeSchema.options.map((o) => (
                    <SelectItem key={o} value={o}>
                      {SINISTRE_TYPE_LABEL[o]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Date de survenue</Label>
              <Input
                type="date"
                value={dateSurvenue}
                onChange={(e) => setDateSurvenue(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Description du sinistre</Label>
              <Textarea
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Décrivez ce qu'il s'est passé, les dégâts constatés, les éléments utiles pour l'expertise…"
              />
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-3 rounded-xl border border-border bg-surface p-5 shadow-card">
            <h3 className="text-base font-semibold">Récapitulatif</h3>
            <dl className="grid gap-3 sm:grid-cols-2">
              <Pair
                label="Bien"
                value={
                  properties.find((p) => p.id === propertyId)?.name ?? "—"
                }
              />
              <Pair
                label="Contrat"
                value={
                  contractId
                    ? availableContracts.find((c) => c.id === contractId)
                        ?.type ?? "—"
                    : "À déterminer"
                }
              />
              <Pair label="Type" value={SINISTRE_TYPE_LABEL[type]} />
              <Pair label="Date" value={dateSurvenue} />
              <div className="sm:col-span-2">
                <p className="text-xs font-medium text-text-muted">
                  Description
                </p>
                <p className="mt-1 whitespace-pre-line rounded-md bg-background p-3 text-sm">
                  {description || "—"}
                </p>
              </div>
            </dl>
            {state.ok && state.sinistreId ? (
              <div className="flex items-center gap-2 rounded-md border border-success/30 bg-success/10 p-3 text-sm text-success">
                <Check className="h-4 w-4" />
                Sinistre déclaré — {state.message}
                <Link
                  href="/tableau-de-bord"
                  className="ml-auto font-semibold underline"
                >
                  Retour au tableau de bord
                </Link>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-2">
          {step > 0 ? (
            <Button
              type="button"
              variant="secondary"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
            >
              <ChevronLeft className="h-4 w-4" /> Précédent
            </Button>
          ) : (
            <span />
          )}
          {step < STEPS.length - 1 ? (
            <Button
              type="button"
              onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
              disabled={step === 0 && !propertyId}
            >
              Suivant <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button type="submit" disabled={pending || description.length < 10}>
              <Send className="h-4 w-4" />{" "}
              {pending ? "Envoi…" : "Confirmer la déclaration"}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}

function Pair({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-text-muted">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
