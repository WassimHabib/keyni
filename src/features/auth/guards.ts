import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { repositories } from "@/lib/db/repositories";

import { SESSION_COOKIE_NAME, validateSessionToken } from "./session";
import type { User } from "@/features/users/types";

/**
 * Lit la session courante côté Server Component.
 *
 * Important : on ne tente JAMAIS de `cookies().set()` ou `.delete()` ici —
 * Next.js 15 interdit la mutation de cookies dans un Server Component.
 * - Si le token est invalide, on renvoie simplement null ; la Server Action
 *   `logoutAction` est le seul endroit qui nettoie le cookie.
 * - Le renouvellement glissant d'une session met à jour la DB (expiresAt) :
 *   comme le cookie contient un token opaque inchangé, aucune écriture côté
 *   cookie n'est nécessaire.
 */
export async function getOptionalUser(): Promise<User | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  const validated = await validateSessionToken(token);
  if (!validated) return null;
  const user = await repositories.users.findById(validated.userId);
  if (!user) return null;
  return user;
}

export async function requireUser(): Promise<User> {
  const user = await getOptionalUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

export async function requireAdmin(): Promise<User> {
  const user = await requireUser();
  if (user.role !== "admin") {
    redirect("/tableau-de-bord");
  }
  return user;
}

export async function redirectIfAuthenticated(
  destination = "/tableau-de-bord",
): Promise<void> {
  const user = await getOptionalUser();
  if (user) {
    redirect(user.role === "admin" ? "/admin" : destination);
  }
}
