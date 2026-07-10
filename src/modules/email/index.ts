import { env } from "@/lib/env";
import type { EmailProvider } from "@/modules/email/EmailProvider";
import { MockEmailProvider } from "@/modules/email/mock/MockEmailProvider";
import { BrevoEmailProvider } from "@/modules/email/brevo/BrevoEmailProvider";

let instance: EmailProvider | null = null;

export function getEmailProvider(): EmailProvider {
  if (instance) return instance;
  instance =
    env.EMAIL_PROVIDER === "brevo"
      ? new BrevoEmailProvider()
      : new MockEmailProvider();
  return instance;
}
