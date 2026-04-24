import { render } from "@react-email/render";
import { Resend } from "resend";

import type { EmailMessage, EmailSender } from "./types";

export class ResendEmailSender implements EmailSender {
  private readonly client: Resend;

  constructor(
    apiKey: string,
    private readonly from: string,
  ) {
    this.client = new Resend(apiKey);
  }

  async send(message: EmailMessage): Promise<void> {
    const html = await render(message.react);
    const text = await render(message.react, { plainText: true });
    const { error } = await this.client.emails.send({
      from: this.from,
      to: message.to,
      subject: message.subject,
      html,
      text,
    });
    if (error) {
      throw new Error(`Resend: ${error.message}`);
    }
  }
}
