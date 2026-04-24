import type { Metadata } from "next";
import Image from "next/image";
import { Check, Copy, Gift, Scale, Wallet } from "lucide-react";

import { requireUser } from "@/features/auth/guards";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageWithAside } from "@/components/layout/page-with-aside";
import { TrustpilotBadge } from "@/components/layout/widgets/trustpilot-badge";
import { formatDateFr, formatEuros, initials } from "@/lib/utils";
import {
  REFERRAL_STATUS_LABEL,
  REWARD_STATUS_LABEL,
} from "@/features/referrals/types";
import { repositories } from "@/lib/db/repositories";

import { ClaimRewardDialog } from "./claim-reward";

export const metadata: Metadata = {
  title: "Bons plans",
};

export default async function BonsPlansPage() {
  const user = await requireUser();
  const [rewards, referrals] = await Promise.all([
    repositories.rewards.findAllByUser(user.id),
    repositories.referrals.findAllByUser(user.id),
  ]);

  const pending = rewards.find((r) => r.status === "en_attente");
  const pendingCents = rewards
    .filter((r) => r.status === "en_attente" || r.status === "valide")
    .reduce((acc, r) => acc + r.amountCents, 0);

  const validated = referrals.filter((r) => r.status === "valide").length;
  const active = referrals.filter((r) => r.status === "en_cours").length;
  const invited = referrals.filter((r) => r.status === "invite").length;
  const gagnes = referrals.reduce((acc, r) => acc + r.rewardCents, 0);

  const slug = initials(user.profile.displayName).toLowerCase();
  const referralLink = `https://keyni.eu/p/${slug}-${user.id.slice(0, 6).toLowerCase()}`;

  const main = (
    <>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Bons plans</h1>
        <p className="mt-1 text-text-muted">
          Vos gains en attente, votre lien de parrainage et les offres
          partenaires Keyni.
        </p>
      </div>

      <section className="relative overflow-hidden rounded-xl border border-border bg-gradient-to-br from-primary/15 via-primary-soft to-surface p-6 shadow-card">
        <div className="flex flex-col items-center gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-5">
            <Image
              src="/illustrations/money-waiting.svg"
              alt=""
              width={120}
              height={90}
              aria-hidden
            />
            <div>
              <Badge variant="success">
                <Check className="h-3 w-3" /> {formatEuros(pendingCents)} à
                récupérer
              </Badge>
              <h2 className="mt-2 text-2xl font-bold text-text-primary">
                {formatEuros(pendingCents)} vous attendent !
              </h2>
              <p className="mt-1 text-sm text-text-muted">
                Récupérez vos gains de parrainage directement sur votre compte
                bancaire.
              </p>
            </div>
          </div>
          {pending ? <ClaimRewardDialog rewardId={pending.id} /> : null}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-surface p-6 shadow-card">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
            <Gift className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-semibold">Parrainez vos proches</h2>
            <p className="text-sm text-text-muted">
              Gagnez 20 € par souscription, pour vous et votre filleul.
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 rounded-lg border border-dashed border-primary/30 bg-primary-soft/30 p-4 sm:flex-row sm:items-center sm:justify-between">
          <code className="select-all text-sm font-medium text-primary-strong">
            {referralLink}
          </code>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary">
              <Copy className="h-4 w-4" /> Copier le lien
            </Button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-4">
          <Stat label="Invités" value={invited} />
          <Stat label="En cours" value={active} />
          <Stat label="Validés" value={validated} />
          <Stat label="Gagnés" value={formatEuros(gagnes)} tone="primary" />
        </div>

        {referrals.length > 0 ? (
          <div className="mt-6 overflow-hidden rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted text-left text-xs uppercase tracking-wide text-text-muted">
                <tr>
                  <th className="px-4 py-3">Filleul</th>
                  <th className="px-4 py-3">Invité le</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3 text-right">Gain</th>
                </tr>
              </thead>
              <tbody>
                {referrals.map((r) => (
                  <tr key={r.id} className="border-t border-border bg-surface">
                    <td className="px-4 py-3 font-medium">{r.maskedName}</td>
                    <td className="px-4 py-3 text-text-muted">
                      {formatDateFr(r.invitedAt)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          r.status === "valide"
                            ? "success"
                            : r.status === "en_cours"
                              ? "warning"
                              : r.status === "invite"
                                ? "neutral"
                                : "danger"
                        }
                      >
                        {REFERRAL_STATUS_LABEL[r.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {r.rewardCents > 0 ? formatEuros(r.rewardCents) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Offres partenaires Keyni</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <PartnerOffer
            icon={Wallet}
            title="Logiciel de gestion locative"
            discount="-20 %"
            description="Automatisez la gestion de vos lots (quittances, CAF, relances)."
          />
          <PartnerOffer
            icon={Scale}
            title="Conseil juridique immobilier"
            discount="1ʳᵉ consultation offerte"
            description="Avocats spécialisés pour sécuriser vos baux et vos montages."
          />
        </div>
      </section>

      {rewards.length > 0 ? (
        <section>
          <h2 className="text-lg font-semibold">Historique des gains</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {rewards.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between rounded-md border border-border bg-surface px-4 py-3"
              >
                <span>{r.label}</span>
                <span className="flex items-center gap-3">
                  <Badge
                    variant={
                      r.status === "paye"
                        ? "success"
                        : r.status === "en_attente"
                          ? "warning"
                          : "neutral"
                    }
                  >
                    {REWARD_STATUS_LABEL[r.status]}
                  </Badge>
                  <span className="font-semibold">
                    {formatEuros(r.amountCents)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );

  const aside = (
    <>
      <TrustpilotBadge />
      <div className="rounded-xl border border-border bg-surface p-5 shadow-card">
        <h3 className="text-base font-semibold text-text-primary">
          Comment ça marche ?
        </h3>
        <ol className="mt-3 space-y-3 text-sm">
          <Step
            n={1}
            label="Partagez votre lien"
            description="Via email, WhatsApp ou LinkedIn."
          />
          <Step
            n={2}
            label="Votre filleul souscrit"
            description="Un contrat Keyni (PNO, GLI, ADP, MRH…)."
          />
          <Step
            n={3}
            label="Gagnez 20 € chacun"
            description="Crédités après le premier prélèvement."
          />
        </ol>
      </div>
      <div className="rounded-xl border border-border bg-surface p-5 shadow-card">
        <h3 className="text-base font-semibold text-text-primary">
          Historique synthétique
        </h3>
        <p className="mt-1 text-xs text-text-muted">
          {validated} parrainage{validated > 1 ? "s" : ""} validé
          {validated > 1 ? "s" : ""} · {formatEuros(gagnes)} gagnés au total.
        </p>
      </div>
    </>
  );

  return <PageWithAside main={main} aside={aside} />;
}

function Stat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number | string;
  tone?: "default" | "primary";
}) {
  return (
    <div className="rounded-lg border border-border bg-background p-4 text-center">
      <p className="text-xs font-medium text-text-muted">{label}</p>
      <p
        className={`mt-1 text-xl font-bold ${tone === "primary" ? "text-primary" : "text-text-primary"}`}
      >
        {value}
      </p>
    </div>
  );
}

function PartnerOffer({
  icon: Icon,
  title,
  discount,
  description,
}: {
  icon: typeof Wallet;
  title: string;
  discount: string;
  description: string;
}) {
  return (
    <article className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-5 shadow-card">
      <header className="flex items-center justify-between gap-2">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
          <Icon className="h-5 w-5" />
        </span>
        <Badge variant="default">{discount}</Badge>
      </header>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="text-sm text-text-muted">{description}</p>
      <Button asChild size="sm" variant="secondary" className="mt-2 self-start">
        <a
          href="https://keyni.eu"
          target="_blank"
          rel="noreferrer"
        >
          Découvrir
        </a>
      </Button>
    </article>
  );
}

function Step({
  n,
  label,
  description,
}: {
  n: number;
  label: string;
  description: string;
}) {
  return (
    <li className="flex items-start gap-3">
      <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary-strong">
        {n}
      </span>
      <div>
        <p className="font-medium text-text-primary">{label}</p>
        <p className="text-xs text-text-muted">{description}</p>
      </div>
    </li>
  );
}
