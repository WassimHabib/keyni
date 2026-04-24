import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { formatDateFr } from "@/lib/utils";
import { repositories } from "@/lib/db/repositories";
import type { AuditEvent } from "@/features/auth/types";

export const metadata: Metadata = {
  title: "Audit — Back-office",
};

const EVENT_LABEL: Record<AuditEvent, string> = {
  "login.success": "Connexion réussie",
  "login.failure": "Échec de connexion",
  "login.lockout": "Verrouillage par rate-limit",
  "password_reset.requested": "Demande de réinit. mot de passe",
  "password_reset.completed": "Mot de passe réinitialisé",
  password_changed: "Mot de passe changé",
  "session.revoked": "Session révoquée",
  logout: "Déconnexion",
};

const EVENT_TONE: Record<
  AuditEvent,
  "success" | "warning" | "danger" | "neutral"
> = {
  "login.success": "success",
  "login.failure": "warning",
  "login.lockout": "danger",
  "password_reset.requested": "neutral",
  "password_reset.completed": "success",
  password_changed: "success",
  "session.revoked": "warning",
  logout: "neutral",
};

export default async function AdminAuditPage() {
  // Récupère tous les logs (tri antéchronologique simple via findByEvent empilé)
  const events: AuditEvent[] = [
    "login.success",
    "login.failure",
    "login.lockout",
    "password_reset.requested",
    "password_reset.completed",
    "password_changed",
    "session.revoked",
    "logout",
  ];
  const all = (
    await Promise.all(
      events.map((event) => repositories.auditLog.findByEvent(event, 200)),
    )
  )
    .flat()
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, 100);

  const users = await repositories.users.findAll();
  const userMap = new Map(users.map((u) => [u.id, u]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Journal d'audit</h1>
        <p className="mt-1 text-text-muted">
          Les 100 derniers événements de sécurité.
        </p>
      </div>

      {all.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface p-10 text-center text-sm text-text-muted">
          Aucun événement enregistré pour l'instant.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-card">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left text-xs uppercase tracking-wide text-text-muted">
              <tr>
                <th className="px-4 py-3">Quand</th>
                <th className="px-4 py-3">Événement</th>
                <th className="px-4 py-3">Utilisateur</th>
                <th className="px-4 py-3">IP</th>
              </tr>
            </thead>
            <tbody>
              {all.map((log) => {
                const user = log.userId ? userMap.get(log.userId) : undefined;
                return (
                  <tr
                    key={log.id}
                    className="border-t border-border bg-surface"
                  >
                    <td className="px-4 py-3 text-xs text-text-muted">
                      {formatDateFr(log.at)} ·{" "}
                      {log.at.toLocaleTimeString("fr-FR")}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={EVENT_TONE[log.event]}>
                        {EVENT_LABEL[log.event]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {user ? (
                        <Link
                          href={`/admin/clients/${user.id}`}
                          className="text-sm font-medium text-primary hover:underline"
                        >
                          {user.profile.displayName}
                        </Link>
                      ) : (
                        <span className="text-xs text-text-muted">
                          {(log.metadata?.email as string | undefined) ??
                            "— (anonyme)"}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-text-muted">
                      {log.ip ?? "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
