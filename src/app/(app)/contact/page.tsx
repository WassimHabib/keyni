import type { Metadata } from "next";
import {
  Calendar,
  CalendarCheck,
  Clock,
  Mail,
  Phone,
} from "lucide-react";

import faq from "@/content/faq.json";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { PageWithAside } from "@/components/layout/page-with-aside";
import { TrustpilotBadge } from "@/components/layout/widgets/trustpilot-badge";

import { ChatCard } from "./chat-card";

export const metadata: Metadata = {
  title: "Contact",
};

function generateSlots() {
  const now = new Date();
  const slots: { date: Date; time: string }[] = [];
  for (let day = 1; day <= 10; day += 1) {
    const date = new Date(now);
    date.setDate(now.getDate() + day);
    if (date.getDay() === 0 || date.getDay() === 6) continue;
    for (const time of ["09:30", "11:00", "14:30", "16:00"]) {
      slots.push({ date, time });
    }
  }
  return slots.slice(0, 16);
}

export default function ContactPage() {
  const slots = generateSlots();

  const main = (
    <>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Nous contacter</h1>
        <p className="mt-1 text-text-muted">
          Votre équipe Keyni est disponible du lundi au vendredi, 9 h à 19 h.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <ChatCard />
        <LinkCard
          icon={Phone}
          title="Téléphone"
          subtitle="01 23 45 67 89"
          action="Lun-Ven 9 h - 19 h"
          href="tel:+33123456789"
        />
        <LinkCard
          icon={Mail}
          title="Email"
          subtitle="contact@keyni.eu"
          action="Envoyer un email"
          href="mailto:contact@keyni.eu"
        />
      </section>

      <section className="rounded-xl border border-border bg-surface p-6 shadow-card">
        <header className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
            <Calendar className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-semibold">Prendre rendez-vous</h2>
            <p className="text-sm text-text-muted">
              Créneaux de 30 min avec votre conseiller.
            </p>
          </div>
        </header>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {slots.map((slot, idx) => (
            <Button
              key={idx}
              variant="secondary"
              size="sm"
              className="h-auto flex-col gap-0.5 py-2"
            >
              <span className="text-xs text-text-muted">
                {slot.date.toLocaleDateString("fr-FR", {
                  weekday: "short",
                  day: "2-digit",
                  month: "2-digit",
                })}
              </span>
              <span className="text-sm font-semibold">{slot.time}</span>
            </Button>
          ))}
        </div>
        <p className="mt-3 flex items-center gap-2 text-xs text-text-muted">
          <CalendarCheck className="h-3.5 w-3.5" /> La prise de rendez-vous sera
          bientôt synchronisée avec le calendrier de votre conseiller.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Questions fréquentes</h2>
        <Accordion
          type="single"
          collapsible
          className="mt-3 rounded-xl border border-border bg-surface px-5"
        >
          {(faq as { q: string; a: string }[]).map((item, idx) => (
            <AccordionItem key={idx} value={`q-${idx}`}>
              <AccordionTrigger>{item.q}</AccordionTrigger>
              <AccordionContent>{item.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
    </>
  );

  const aside = (
    <>
      <TrustpilotBadge />
      <div className="rounded-xl border border-border bg-surface p-5 shadow-card">
        <h3 className="text-base font-semibold text-text-primary">
          Votre conseiller
        </h3>
        <div className="mt-4 flex items-center gap-3">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-primary">
            <span className="text-base font-semibold">JS</span>
          </span>
          <div>
            <p className="font-semibold text-text-primary">Julie Simon</p>
            <p className="text-xs text-text-muted">
              Conseillère senior · Dossiers investisseurs
            </p>
          </div>
        </div>
        <p className="mt-3 text-sm text-text-muted">
          <span className="font-semibold text-text-primary">
            julie.simon@keyni.eu
          </span>
        </p>
        <p className="mt-1 flex items-center gap-1 text-xs text-text-muted">
          <Clock className="h-3.5 w-3.5" /> Délai de réponse moyen : 1 h
        </p>
      </div>
    </>
  );

  return <PageWithAside main={main} aside={aside} />;
}

function LinkCard({
  icon: Icon,
  title,
  subtitle,
  action,
  href,
}: {
  icon: typeof Phone;
  title: string;
  subtitle: string;
  action: string;
  href: string;
}) {
  return (
    <a
      href={href}
      className="flex h-full flex-col gap-3 rounded-xl border border-border bg-surface p-5 shadow-card transition hover:border-primary"
    >
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <h3 className="text-base font-semibold text-text-primary">{title}</h3>
        <p className="text-sm text-text-muted">{subtitle}</p>
      </div>
      <span className="text-sm font-medium text-primary">{action}</span>
    </a>
  );
}
