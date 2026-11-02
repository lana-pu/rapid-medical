import "server-only";
import nodemailer from "nodemailer";

type Mail = { subject: string; text: string; html?: string; replyTo?: string; to?: string };

/** Sends via SMTP when configured; otherwise logs to the console (dev). */
export async function sendMail(m: Mail) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM, MAIL_TO } = process.env;
  const to = m.to ?? MAIL_TO;
  if (!SMTP_HOST) {
    console.log(`[mail:dev] to=${to} subject="${m.subject}"\n${m.text}`);
    return;
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
}
