import "server-only";

import { z } from "zod";

const booleanFromString = z
  .enum(["true", "false"])
  .transform((value) => value === "true");

const envSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    APP_URL: z.string().url(),
    LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),

    SESSION_SECRET: z
      .string()
      .min(32, "SESSION_SECRET doit faire au moins 32 caractères"),

    EMAIL_PROVIDER: z.enum(["console", "resend", "smtp"]).default("console"),
    EMAIL_FROM: z.string().email().default("noreply@keyni.local"),
    RESEND_API_KEY: z.string().optional(),

    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.coerce.number().int().positive().optional(),
    SMTP_USER: z.string().optional(),
    SMTP_PASSWORD: z.string().optional(),

    DATABASE_URL: z.string().url().optional(),

    SKIP_ENV_VALIDATION: booleanFromString.optional(),
  })
  .superRefine((value, ctx) => {
    if (value.EMAIL_PROVIDER === "resend" && !value.RESEND_API_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["RESEND_API_KEY"],
        message: "RESEND_API_KEY requis lorsque EMAIL_PROVIDER=resend",
      });
    }
    if (
      value.EMAIL_PROVIDER === "smtp" &&
      (!value.SMTP_HOST || !value.SMTP_PORT)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["SMTP_HOST"],
        message: "SMTP_HOST et SMTP_PORT requis lorsque EMAIL_PROVIDER=smtp",
      });
    }
  });

function parseEnv(): z.infer<typeof envSchema> {
  // eslint-disable-next-line no-process-env
  const raw = process.env;
  if (raw.SKIP_ENV_VALIDATION === "true") {
    return envSchema.parse(raw);
  }

  const parsed = envSchema.safeParse(raw);

  if (!parsed.success) {
    const formatted = parsed.error.issues
      .map((issue) => `  · ${issue.path.join(".")} — ${issue.message}`)
      .join("\n");

    const onVercel = Boolean(raw.VERCEL);
    const onCi = Boolean(raw.CI);
    const where = onVercel
      ? "Settings → Environment Variables de votre projet Vercel"
      : onCi
        ? "secrets/variables d'environnement de votre pipeline CI"
        : "fichier .env.local (cf. .env.example)";

    // eslint-disable-next-line no-console
    console.error(
      `\n❌ Variables d'environnement invalides :\n${formatted}\n\nÀ corriger dans : ${where}\nGénérer un SESSION_SECRET : openssl rand -base64 48\n`,
    );
    throw new Error("Variables d'environnement invalides");
  }

  return parsed.data;
}

export const env = parseEnv();
export type Env = typeof env;
