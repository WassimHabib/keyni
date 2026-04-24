import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Sparkles, UserCog } from "lucide-react";

import { PageWithAside } from "@/components/layout/page-with-aside";
import { TrustpilotBadge } from "@/components/layout/widgets/trustpilot-badge";
import { HelpCard } from "@/components/layout/widgets/help-card";

export const metadata: Metadata = {
  title: "Outils",
};

const tools = [
  {
    href: "/outils/score",
    title: "Améliorer mon score Keyni",
    description:
      "Évaluez vos risques financiers et juridiques, et obtenez des recommandations ciblées.",
    icon: Sparkles,
    accent: "from-primary/15 to-primary-soft",
  },
  {
    href: "/outils/informations",
    title: "Informations personnelles",
    description:
      "Complétez votre profil et les caractéristiques de vos biens pour affiner vos KPI.",
    icon: UserCog,
    accent: "from-chart-1/15 to-chart-1/5",
  },
];

export default function OutilsHubPage() {
  const main = (
    <>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Outils</h1>
        <p className="mt-1 text-text-muted">
          Pilotez votre patrimoine et préparez votre fiscalité avec les outils
          Keyni.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <Link
              key={tool.href}
              href={tool.href}
              className={`group rounded-xl border border-border bg-gradient-to-br ${tool.accent} p-6 shadow-card transition hover:border-primary hover:shadow-hover`}
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-surface text-primary shadow-card">
                  <Icon className="h-5 w-5" />
                </span>
                <h2 className="text-lg font-semibold text-text-primary">
                  {tool.title}
                </h2>
              </div>
              <p className="mt-3 text-sm text-text-secondary">
                {tool.description}
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary group-hover:underline">
                Ouvrir <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          );
        })}
      </div>
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
