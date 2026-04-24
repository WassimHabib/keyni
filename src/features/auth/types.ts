import { z } from "zod";

import { IsoDateSchema, UlidSchema } from "@/lib/validation";

export const SessionSchema = z.object({
  id: UlidSchema,
  userId: UlidSchema,
  tokenHash: z.string().length(64),
  createdAt: IsoDateSchema,
  expiresAt: IsoDateSchema,
  lastSeenAt: IsoDateSchema,
  ip: z.string().optional(),
  userAgent: z.string().optional(),
});
export type Session = z.infer<typeof SessionSchema>;
export type SessionId = Session["id"];

export const AuditEventSchema = z.enum([
  "login.success",
  "login.failure",
  "login.lockout",
  "password_reset.requested",
  "password_reset.completed",
  "password_changed",
  "session.revoked",
  "logout",
]);
export type AuditEvent = z.infer<typeof AuditEventSchema>;

export const AuditLogSchema = z.object({
  id: UlidSchema,
  userId: UlidSchema.optional(),
  event: AuditEventSchema,
  ip: z.string().optional(),
  userAgent: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  at: IsoDateSchema,
});
export type AuditLog = z.infer<typeof AuditLogSchema>;

export const PasswordResetTokenSchema = z.object({
  id: UlidSchema,
  userId: UlidSchema,
  tokenHash: z.string().length(64),
  createdAt: IsoDateSchema,
  expiresAt: IsoDateSchema,
  usedAt: IsoDateSchema.optional(),
});
export type PasswordResetToken = z.infer<typeof PasswordResetTokenSchema>;
