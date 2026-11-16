import "server-only";
import nodemailer from "nodemailer";

type Mail = { subject: string; text: string; html?: string; replyTo?: string; to?: string };

/** Email is set up (SMTP). Without it nothing is sent — screens that promise an email say so instead. */
export function mailConfigured(): boolean {
  return !!process.env.SMTP_HOST;
}

/**
 * Sends via SMTP when configured and says whether it went. Without SMTP nothing leaves: in development the whole
 * email goes to the console; in production only that it was not sent and to whom — never a reset or invite link or a
 * visitor's request (security check 2026-11-13, K.1; docs/spec.md → Почта).
 */
export async function sendMail(m: Mail): Promise<boolean> {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM, MAIL_TO } = process.env;
  const to = m.to ?? MAIL_TO;
  if (!SMTP_HOST) {
    if (process.env.NODE_ENV === "production") console.warn(`[mail] not sent, email is not set up (SMTP_HOST): to=${to}`);
    else console.log(`[mail:dev] to=${to} subject="${m.subject}"\n${m.text}`);
    return false;
  }
  const transport = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT ?? 587),
    secure: Number(SMTP_PORT) === 465,
    auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
  });
  const { to: _t, ...rest } = m;
  void _t;
  await transport.sendMail({ from: MAIL_FROM, to, replyTo: m.replyTo, ...rest });
  return true;
}
