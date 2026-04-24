"use client";

import { Home, Info, Plus, Save, Scale, UserRound } from "lucide-react";
import { useActionState, useMemo, useState } from "react";
import { toast } from "sonner";

import { updateProfileAction } from "@/features/users/actions";
import {
  PropertyTypeSchema,
  PropertyUsageSchema,
  type Property,
} from "@/features/properties/types";
import { SituationProSchema, RegimeFiscalSchema } from "@/features/users/types";
import type { UserProfile } from "@/features/users/types";

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

interface InformationsFormProps {
  user: { email: string; profile: UserProfile };
  properties: Property[];
  selectedPropertyId?: string;
}

const SITUATION_LABEL: Record<string, string> = {
  salarie: "Salarié",
  cadre: "Cadre",
  independant: "Indépendant",
  chef_entreprise: "Chef d'entreprise",
  retraite: "Retraité",
  etudiant: "Étudiant",
  sans_emploi: "Sans emploi",
};

const REGIME_LABEL: Record<string, string> = {
  micro_foncier: "Micro-foncier",
  reel_simplifie: "Réel simplifié",
  lmnp_micro: "LMNP micro",
  lmnp_reel: "LMNP au réel",
  lmp: "LMP",
  sci_is: "SCI à l'IS",
  sci_ir: "SCI à l'IR",
  autre: "Autre",
};

const USAGE_LABEL: Record<string, string> = {
  location_nue: "Location nue",
  location_meublee: "Location meublée",
  residence_principale: "Résidence principale",
  residence_secondaire: "Résidence secondaire",
  vacant: "Vacant",
};

const TYPE_LABEL: Record<string, string> = {
  appartement: "Appartement",
  maison: "Maison",
  commerce: "Commerce",
  bureau: "Bureau",
  immeuble: "Immeuble",
  autre: "Autre",
};

function eurosToCents(value: string): number | "" {
  if (!value) return "";
  return Math.round(Number(value.replace(",", ".")) * 100);
}

function centsToEuros(value?: number): string {
  if (value === undefined) return "";
  return String(Math.round(value / 100));
}

export function InformationsForm({
  user,
  properties,
  selectedPropertyId,
}: InformationsFormProps) {
  const [state, formAction, pending] = useActionState(updateProfileAction, {
    ok: false,
  });
  const [propertyId, setPropertyId] = useState(
    selectedPropertyId ?? properties[0]?.id,
  );

  const selected = useMemo(
    () => properties.find((p) => p.id === propertyId),
    [propertyId, properties],
  );

  if (state.ok && state.message) {
    toast.success(state.message);
  }

  return (
    <form action={formAction} className="space-y-6" noValidate>
      <input type="hidden" name="propertyId" value={propertyId ?? ""} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <Label htmlFor="propertySelect">Bien concerné</Label>
          <Select
            value={propertyId}
            onValueChange={(v) => setPropertyId(v)}
            name="propertySelect"
          >
            <SelectTrigger className="w-full sm:w-72">
              <span className="flex items-center gap-2">
                <Home className="h-4 w-4 text-text-muted" />
                <SelectValue placeholder="Sélectionner un bien" />
              </span>
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
        <Button
          type="button"
          variant="secondary"
          size="md"
          className="self-end"
          disabled
          title="Disponible prochainement"
        >
          <Plus className="h-4 w-4" /> Ajouter un bien
        </Button>
      </div>

      <FormSection icon={UserRound} title="Informations sur vous">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Situation professionnelle">
            <Select
              name="situation"
              defaultValue={user.profile.situation ?? undefined}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner" />
              </SelectTrigger>
              <SelectContent>
                {SituationProSchema.options.map((o) => (
                  <SelectItem key={o} value={o}>
                    {SITUATION_LABEL[o] ?? o}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Email">
            <Input
              name="email"
              type="email"
              value={user.email}
              readOnly
              disabled
            />
          </Field>
          <Field label="Revenus mensuels nets (tous revenus)">
            <Input
              name="revenusMensuelsNetsCents"
              type="number"
              inputMode="numeric"
              min={0}
              defaultValue={centsToEuros(user.profile.revenusMensuelsNetsCents)}
              onBlur={(e) => {
                const target = e.currentTarget as HTMLInputElement;
                const val = eurosToCents(target.value);
                if (val !== "") target.value = String(val);
              }}
              suffix="€"
            />
          </Field>
          <Field label="Charges mensuelles (hors crédit)">
            <Input
              name="chargesMensuellesCents"
              type="number"
              inputMode="numeric"
              min={0}
              defaultValue={centsToEuros(user.profile.chargesMensuellesCents)}
              onBlur={(e) => {
                const target = e.currentTarget as HTMLInputElement;
                const val = eurosToCents(target.value);
                if (val !== "") target.value = String(val);
              }}
              suffix="€"
            />
          </Field>
          <Field label="Nombre de personnes dans le foyer">
            <Input
              name="personnesFoyer"
              type="number"
              min={1}
              max={20}
              defaultValue={user.profile.personnesFoyer}
            />
          </Field>
          <Field
            label="Régime fiscal"
            tooltip="Pour adapter vos outils de simulation"
          >
            <Select
              name="regimeFiscal"
              defaultValue={user.profile.regimeFiscal ?? undefined}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner" />
              </SelectTrigger>
              <SelectContent>
                {RegimeFiscalSchema.options.map((o) => (
                  <SelectItem key={o} value={o}>
                    {REGIME_LABEL[o] ?? o}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
      </FormSection>

      {selected ? (
        <>
          <FormSection icon={Home} title="Informations sur votre bien">
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Type de bien">
                <Select name="type" defaultValue={selected.type}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PropertyTypeSchema.options.map((o) => (
                      <SelectItem key={o} value={o}>
                        {TYPE_LABEL[o] ?? o}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Surface">
                <Input
                  name="surface"
                  type="number"
                  min={1}
                  defaultValue={selected.surface}
                  suffix="m²"
                />
              </Field>
              <Field label="Date d'acquisition">
                <Input
                  name="dateAcquisition"
                  type="date"
                  defaultValue={
                    selected.dateAcquisition.toISOString().split("T")[0]
                  }
                />
              </Field>
              <Field label="Prix d'acquisition (frais inclus)">
                <Input
                  name="prixAcquisitionCents"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  defaultValue={centsToEuros(selected.prixAcquisitionCents)}
                  suffix="€"
                />
              </Field>
              <Field label="Valeur actuelle estimée" tooltip="Valeur au prix de marché">
                <Input
                  name="valeurActuelleEstimeeCents"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  defaultValue={centsToEuros(
                    selected.valeurActuelleEstimeeCents,
                  )}
                  suffix="€"
                />
              </Field>
              <Field label="Usage du bien">
                <Select name="usage" defaultValue={selected.usage}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PropertyUsageSchema.options.map((o) => (
                      <SelectItem key={o} value={o}>
                        {USAGE_LABEL[o] ?? o}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </FormSection>

          <FormSection
            icon={Scale}
            title="Informations financières liées au bien"
          >
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Loyer mensuel (hors charges)">
                <Input
                  name="loyerMensuelCents"
                  type="number"
                  min={0}
                  defaultValue={centsToEuros(selected.finances.loyerMensuelCents)}
                  suffix="€"
                />
              </Field>
              <Field label="Charges mensuelles (copro, taxe foncière…)">
                <Input
                  name="chargesMensuellesBienCents"
                  type="number"
                  min={0}
                  defaultValue={centsToEuros(
                    selected.finances.chargesMensuellesCents,
                  )}
                  suffix="€"
                />
              </Field>
              <Field label="Mensualité de crédit">
                <Input
                  name="mensualiteCreditCents"
                  type="number"
                  min={0}
                  defaultValue={centsToEuros(
                    selected.finances.mensualiteCreditCents,
                  )}
                  suffix="€"
                />
              </Field>
              <Field label="Taux d'intérêt">
                <Input
                  name="tauxInteret"
                  type="number"
                  step="0.01"
                  min={0}
                  defaultValue={selected.finances.tauxInteret}
                  suffix="%"
                />
              </Field>
              <Field label="Durée restante du prêt">
                <Input
                  name="dureeRestantePretAnnees"
                  type="number"
                  min={0}
                  max={50}
                  defaultValue={selected.finances.dureeRestantePretAnnees}
                  suffix="ans"
                />
              </Field>
              <Field label="Apport personnel">
                <Input
                  name="apportPersonnelCents"
                  type="number"
                  min={0}
                  defaultValue={centsToEuros(
                    selected.finances.apportPersonnelCents,
                  )}
                  suffix="€"
                />
              </Field>
            </div>
          </FormSection>
        </>
      ) : null}

      <div className="flex items-center justify-between gap-3 pt-2">
        <Button type="reset" variant="ghost">
          Annuler
        </Button>
        <Button type="submit" disabled={pending}>
          <Save className="h-4 w-4" />
          {pending ? "Enregistrement…" : "Enregistrer"}
        </Button>
      </div>
    </form>
  );
}

function FormSection({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Home;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-surface p-5 shadow-card">
      <header className="mb-4 flex items-center gap-2 text-text-primary">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary-soft text-primary">
          <Icon className="h-4 w-4" />
        </span>
        <h2 className="text-base font-semibold">{title}</h2>
      </header>
      {children}
    </section>
  );
}

function Field({
  label,
  tooltip,
  children,
}: {
  label: string;
  tooltip?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="flex items-center gap-1">
        {label}
        {tooltip ? (
          <span title={tooltip} className="text-text-muted">
            <Info className="h-3.5 w-3.5" />
          </span>
        ) : null}
      </Label>
      {children}
    </div>
  );
}
