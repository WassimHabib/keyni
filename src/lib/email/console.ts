import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { render } from "@react-email/render";

import { logger } from "@/lib/logger";

import type { EmailMessage, EmailSender } from "./types";

const TMP_DIR = path.resolve(process.cwd(), ".tmp", "emails");

export class ConsoleEmailSender implements EmailSender {
  constructor(private readonly from: string) {}

  async send(message: EmailMessage): Promise<void> {
    const html = await render(message.react);
    const text = await render(message.react, { plainText: true });

    logger.info(`[email] ${this.from} → ${message.to} : ${message.subject}`);
    // eslint-disable-next-line no-console
    console.log("----- début email -----");
    // eslint-disable-next-line no-console
    console.log(text);
    // eslint-disable-next-line no-console
    console.log("----- fin email -----");

    try {
      await mkdir(TMP_DIR, { recursive: true });
      const timestamp = Date.now();
      const file = path.join(
        TMP_DIR,
        `${timestamp}-${message.subject.slice(0, 40).replace(/[^a-z0-9]/gi, "_")}.html`,
      );
      await writeFile(file, html, "utf8");
      logger.info(`[email] preview sauvegardé : ${file}`);
    } catch (err) {
      logger.warn("[email] écriture du preview impossible", {
        err: err instanceof Error ? err.message : String(err),
      });
    }
  }
}
