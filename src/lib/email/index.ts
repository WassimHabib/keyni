import { env } from "@/config/env";

import { ConsoleEmailSender } from "./console";
import { ResendEmailSender } from "./resend";
import type { EmailSender } from "./types";

let sender: EmailSender | null = null;

export function getEmailSender(): EmailSender {
  if (sender) return sender;

  switch (env.EMAIL_PROVIDER) {
    case "resend":
      if (!env.RESEND_API_KEY) {
        throw new Error("RESEND_API_KEY manquant");
      }
      sender = new ResendEmailSender(env.RESEND_API_KEY, env.EMAIL_FROM);
      break;
    case "smtp":
      throw new Error(
        "Le provider SMTP n'est pas encore implémenté. Utilisez 'console' ou 'resend'.",
      );
    case "console":
    default:
      sender = new ConsoleEmailSender(env.EMAIL_FROM);
      break;
  }

  return sender;
}

export type { EmailMessage, EmailSender } from "./types";
