import { createHmac, timingSafeEqual } from "node:crypto";

import { env } from "@/config/env";
import type { Session } from "./types";

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 jours

export interface SessionMeta {
  ip?: string;
  userAgent?: string;
}

export interface ValidatedSession {
  session: Session;
  userId: string;
  renewed: boolean;
}

export const SESSION_COOKIE_NAME = "keyni_session";
export const SESSION_COOKIE_MAX_AGE_SECONDS = Math.floor(
  SESSION_DURATION_MS / 1000,
);

/**
 * Sessions « stateless » signées : le cookie contient le payload
 * (userId, expiresAt) encodé en base64url, suivi d'une signature HMAC-SHA256
 * calculée avec SESSION_SECRET. Aucun store partagé requis — compatible avec
 * n'importe quel runtime (Vercel serverless, Node persistant, edge).
 *
 * Rotation possible : changer SESSION_SECRET invalide tous les tokens en
 * circulation (déconnexion globale immédiate côté serveur).
 *
 * Quand une vraie base de données sera branchée, on pourra réintroduire un
 * SessionRepository pour avoir révocation fine et liste des sessions actives.
 */

interface TokenPayload {
  uid: string;
  iat: number;
  exp: number;
  ip?: string;
  ua?: string;
  v: 1;
}

function b64urlEncode(buf: Buffer): string {
  return buf.toString("base64url");
}

function b64urlDecode(str: string): Buffer {
  return Buffer.from(str, "base64url");
}

function sign(payload: string): string {
  return createHmac("sha256", env.SESSION_SECRET).update(payload).digest("base64url");
}

export function generateSessionToken(
  userId: string,
  meta: SessionMeta = {},
): string {
  const now = Date.now();
  const payload: TokenPayload = {
    uid: userId,
    iat: now,
    exp: now + SESSION_DURATION_MS,
    ip: meta.ip,
    ua: meta.userAgent?.slice(0, 200),
    v: 1,
  };
  const payloadStr = b64urlEncode(Buffer.from(JSON.stringify(payload)));
  const signature = sign(payloadStr);
  return `${payloadStr}.${signature}`;
}

function decode(token: string): TokenPayload | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payloadStr, signature] = parts;
  if (!payloadStr || !signature) return null;

  const expected = sign(payloadStr);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return null;
  if (!timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(b64urlDecode(payloadStr).toString("utf8")) as TokenPayload;
    if (payload.v !== 1) return null;
    if (typeof payload.uid !== "string" || !payload.uid) return null;
    if (typeof payload.exp !== "number") return null;
    if (Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

/**
 * Compatibilité avec l'API précédente (DB-backed) : on construit un objet
 * Session synthétique à partir du payload du token. L'`id` ne pointe vers
 * aucune ligne en base — c'est un identifiant dérivé du payload, stable pour
 * la durée du token, utile pour l'UI « sessions actives ».
 */
function syntheticSession(payload: TokenPayload, tokenHash: string): Session {
  return {
    id: tokenHash.slice(0, 26).toUpperCase().padEnd(26, "0"),
    userId: payload.uid,
    tokenHash,
    createdAt: new Date(payload.iat),
    expiresAt: new Date(payload.exp),
    lastSeenAt: new Date(),
    ip: payload.ip,
    userAgent: payload.ua,
  };
}

export async function createSession(
  userId: string,
  meta: SessionMeta = {},
): Promise<{ token: string; session: Session }> {
  const token = generateSessionToken(userId, meta);
  const payload = decode(token)!;
  const session = syntheticSession(payload, hashTokenForId(token));
  return { token, session };
}

export async function validateSessionToken(
  token: string,
): Promise<ValidatedSession | null> {
  const payload = decode(token);
  if (!payload) return null;
  const session = syntheticSession(payload, hashTokenForId(token));
  return { session, userId: payload.uid, renewed: false };
}

export async function invalidateSessionByToken(_token: string): Promise<void> {
  // En sessions stateless, l'invalidation côté serveur n'a pas d'effet :
  // le cookie est supprimé côté client par le caller (logoutAction).
  // Si vraiment besoin de blocage immédiat global, faire tourner SESSION_SECRET.
}

export async function invalidateAllUserSessions(
  _userId: string,
  _except?: string,
): Promise<void> {
  // Idem : pas de store. À reconnecter quand DB branchée.
}

/**
 * Hash stable du token, utile uniquement pour générer un identifiant de
 * session synthétique (pas pour de la sécurité — on a déjà la signature).
 */
function hashTokenForId(token: string): string {
  return createHmac("sha256", "keyni-session-id").update(token).digest("hex");
}

/**
 * Conservé pour compatibilité avec l'API précédente.
 */
export function hashSessionToken(token: string): string {
  return hashTokenForId(token);
}
