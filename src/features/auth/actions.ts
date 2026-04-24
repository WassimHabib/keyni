"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { env } from "@/config/env";
import { repositories } from "@/lib/db/repositories";
import { getEmailSender } from "@/lib/email";
import { PasswordResetEmail } from "@/lib/email/templates/PasswordReset";
import {
  EmailSchema,
  PasswordSchema,
} from "@/lib/validation";

import { logAuditEvent } from "./audit";
import {
  hashPassword,
  verifyAgainstFakeHash,
  verifyPassword,
} from "./password";
import {
  LOGIN_LIMITS,
  RESET_LIMITS,
  checkRateLimit,
} from "./rate-limit";
import {
  SESSION_COOKIE_MAX_AGE_SECONDS,
  SESSION_COOKIE_NAME,
  createSession,
  invalidateAllUserSessions,
  invalidateSessionByToken,
} from "./session";
import {
  constantTimeEquals,
  generateResetToken,
  hashResetToken,
} from "./tokens";

const RESET_TOKEN_TTL_MS = 30 * 60 * 1000;

const LoginSchema = z.object({
  email: EmailSchema,
  password: z.string().min(1, "Mot de passe requis"),
});

const RequestResetSchema = z.object({
  email: EmailSchema,
});

const ResetPasswordSchema = z
  .object({
    password: PasswordSchema,
    confirm: PasswordSchema,
  })
  .refine((v) => v.password === v.confirm, {
    path: ["confirm"],
    message: "Les mots de passe ne correspondent pas",
  });

interface ActionState<T = unknown> {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string[]>;
  redirectTo?: string;
  data?: T;
}

async function requestContext() {
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    undefined;
  const userAgent = h.get("user-agent") ?? undefined;
  return { ip, userAgent };
}

export async function loginAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      message: "Identifiants invalides",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { email, password } = parsed.data;
  const ctx = await requestContext();

  const ipKey = `login:ip:${ctx.ip ?? "unknown"}`;
  const emailKey = `login:email:${email}`;
  const ipCheck = await checkRateLimit({ key: ipKey, ...LOGIN_LIMITS.perIp });
  const emailCheck = await checkRateLimit({
    key: emailKey,
    ...LOGIN_LIMITS.perEmail,
  });

  if (!ipCheck.allowed || !emailCheck.allowed) {
    await logAuditEvent("login.lockout", { ...ctx, metadata: { email } });
    return { ok: false, message: "Identifiants invalides" };
  }

  const user = await repositories.users.findByEmail(email);
  let valid = false;
  if (user) {
    valid = await verifyPassword(user.passwordHash, password);
  } else {
    // Maintient un temps de réponse comparable pour éviter l'énumération.
    await verifyAgainstFakeHash();
  }

  if (!user || !valid) {
    await logAuditEvent("login.failure", { ...ctx, metadata: { email } });
    return { ok: false, message: "Identifiants invalides" };
  }

  const { token } = await createSession(user.id, ctx);
  const cookieStore = await cookies();
  cookieStore.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_COOKIE_MAX_AGE_SECONDS,
  });

  await logAuditEvent("login.success", { ...ctx, userId: user.id });
  // On NE fait PAS `redirect()` ici : dans Next 15 + React 19, la combinaison
  // redirect() + useActionState peut faire remonter un rejet non-Error (un
  // Event) dans le handler global de la devtool. Le client redirige via
  // router.push(state.redirectTo) — même effet, plus stable.
  return { ok: true, redirectTo: "/tableau-de-bord" };
}

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const ctx = await requestContext();
  if (token) {
    await invalidateSessionByToken(token);
    await logAuditEvent("logout", ctx);
  }
  cookieStore.delete(SESSION_COOKIE_NAME);
  redirect("/login");
}

const GENERIC_RESET_CONFIRMATION =
  "Si un compte existe pour cet email, un lien de réinitialisation vient d'être envoyé.";

export async function requestPasswordResetAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = RequestResetSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return {
      ok: false,
      message: "Email invalide",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { email } = parsed.data;
  const ctx = await requestContext();
  const ipKey = `reset:ip:${ctx.ip ?? "unknown"}`;
  const emailKey = `reset:email:${email}`;
  const ipCheck = await checkRateLimit({ key: ipKey, ...RESET_LIMITS.perIp });
  const emailCheck = await checkRateLimit({
    key: emailKey,
    ...RESET_LIMITS.perEmail,
  });

  if (!ipCheck.allowed || !emailCheck.allowed) {
    return { ok: true, message: GENERIC_RESET_CONFIRMATION };
  }

  const user = await repositories.users.findByEmail(email);
  if (user) {
    const token = generateResetToken();
    const tokenHash = hashResetToken(token);
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);
    await repositories.resetTokens.create(user.id, tokenHash, expiresAt);

    const resetUrl = `${env.APP_URL}/mot-de-passe-oublie/${token}`;
    try {
      await getEmailSender().send({
        to: user.email,
        subject: "Réinitialisation de votre mot de passe Keyni",
        react: PasswordResetEmail({
          displayName: user.profile.displayName,
          resetUrl,
          expiresInMinutes: 30,
        }),
      });
      await logAuditEvent("password_reset.requested", {
        userId: user.id,
        ...ctx,
      });
    } catch {
      // Ne pas leaker l'erreur au client — on log simplement.
    }
  }

  return { ok: true, message: GENERIC_RESET_CONFIRMATION };
}

export async function resetPasswordAction(
  token: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = ResetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      message: "Mot de passe invalide",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const tokenHash = hashResetToken(token);
  const record = await repositories.resetTokens.findByTokenHash(tokenHash);
  if (
    !record ||
    record.usedAt ||
    record.expiresAt.getTime() < Date.now() ||
    !constantTimeEquals(hashResetToken(token), record.tokenHash)
  ) {
    return {
      ok: false,
      message: "Lien invalide ou expiré. Veuillez refaire une demande.",
    };
  }

  const newHash = await hashPassword(parsed.data.password);
  await repositories.users.updatePassword(record.userId, newHash);
  await repositories.resetTokens.markUsed(record.id, new Date());
  await invalidateAllUserSessions(record.userId);

  const ctx = await requestContext();
  await logAuditEvent("password_reset.completed", {
    userId: record.userId,
    ...ctx,
  });

  return {
    ok: true,
    message: "Mot de passe mis à jour. Vous pouvez maintenant vous connecter.",
  };
}
