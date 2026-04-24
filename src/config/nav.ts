import type { LucideIcon } from "lucide-react";
import {
  FileText,
  Gift,
  LayoutDashboard,
  Phone,
  Wrench,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const nav: readonly NavItem[] = [
  { href: "/tableau-de-bord", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/mes-contrats", label: "Mes contrats", icon: FileText },
  { href: "/outils", label: "Outils", icon: Wrench },
  { href: "/bons-plans", label: "Bons plans", icon: Gift },
  { href: "/contact", label: "Contact", icon: Phone },
] as const;
