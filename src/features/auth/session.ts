import { sha256 } from "@oslojs/crypto/sha2";
import {
  encodeBase32LowerCaseNoPadding,
  encodeHexLowerCase,
} from "@oslojs/encoding";

import { repositories } from "@/lib/db/repositories";

import type { Session } from "./types";

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 jours
const SESSION_RENEW_THRESHOLD_MS = 1 * 24 * 60 * 60 * 1000; // renew si < 1 jour

export interface SessionMeta {
  ip?: string;
  userAgent?: string;
}

export function generateSessionToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return encodeBase32LowerCaseNoPadding(bytes);
}

export function hashSessionToken(token: string): string {
  return encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
}

export async function createSession(
  userId: string,
  meta: SessionMeta = {},
): Promise<{ token: string; session: Session }> {
  const token = generateSessionToken();
  const tokenHash = hashSessionToken(token);
  const session = await repositories.sessions.create({
    userId,
    tokenHash,
    expiresAt: new Date(Date.now() + SESSION_DURATION_MS),
    ip: meta.ip,
    userAgent: meta.userAgent,
  });
  return { token, session };
}

export interface ValidatedSession {
  session: Session;
  userId: string;
  renewed: boolean;
}

export async function validateSessionToken(
  token: string,
): Promise<ValidatedSession | null> {
  const tokenHash = hashSessionToken(token);
  const session = await repositories.sessions.findByTokenHash(tokenHash);
  if (!session) return null;

  const now = Date.now();
  if (session.expiresAt.getTime() < now) {
    await repositories.sessions.delete(session.id);
    return null;
  }

  let renewed = false;
  if (session.expiresAt.getTime() - now < SESSION_RENEW_THRESHOLD_MS) {
    const newExpiresAt = new Date(now + SESSION_DURATION_MS);
    await repositories.sessions.extend(session.id, newExpiresAt);
    session.expiresAt = newExpiresAt;
    renewed = true;
  }
  await repositories.sessions.touch(session.id, new Date(now));

  return { session, userId: session.userId, renewed };
}

export async function invalidateSessionByToken(token: string): Promise<void> {
  const tokenHash = hashSessionToken(token);
  await repositories.sessions.deleteByTokenHash(tokenHash);
}

export async function invalidateAllUserSessions(
  userId: string,
  except?: string,
): Promise<void> {
  await repositories.sessions.deleteAllForUser(userId, except);
}

export const SESSION_COOKIE_NAME = "keyni_session";
export const SESSION_COOKIE_MAX_AGE_SECONDS = Math.floor(
  SESSION_DURATION_MS / 1000,
);
