import type { LucideIcon } from "lucide-react";
import {
  ClipboardList,
  LayoutDashboard,
  ShieldAlert,
  Users,
} from "lucide-react";

export interface AdminNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const adminNav: readonly AdminNavItem[] = [
  { href: "/admin", label: "Vue d'ensemble", icon: LayoutDashboard },
  { href: "/admin/clients", label: "Clients", icon: Users },
  { href: "/admin/sinistres", label: "Sinistres", icon: ShieldAlert },
  { href: "/admin/audit", label: "Audit", icon: ClipboardList },
] as const;
