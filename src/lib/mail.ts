import nodemailer from "nodemailer";
export type EmailDeliveryMode = "smtp" | "console" | "unavailable";
export function getEmailDeliveryMode(): EmailDeliveryMode {
  if (process.env.MAIL_MODE === "disabled") return "unavailable";
  if (process.env.SMTP_HOST && process.env.MAIL_FROM) return "smtp";
  if (
    process.env.NODE_ENV === "development" &&
    process.env.MAIL_MODE !== "smtp"
  )
    return "console";
  return "unavailable";
}
async function sendAccountEmail({
  to,
  url,
  subject,
  intro,
}: {
  to: string;
  url: string;
  subject: string;
  intro: string;
}) {
  const mode = getEmailDeliveryMode();
  if (mode === "console") {
    console.info(
      `[ArzDesk local development email]\nTo: ${to}\n${subject}: ${url}\nThis link expires in 15 minutes. No email was sent.`,
    );
    return;
  }
  if (mode !== "smtp")
    throw new Error("Password recovery email is not configured.");
  const host = process.env.SMTP_HOST!;
  const port = Number(process.env.SMTP_PORT || 587);
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw new Error("Invalid SMTP port.");
  const secure = process.env.SMTP_SECURE === "true" || port === 465;
  const local = ["localhost", "127.0.0.1", "::1"].includes(host);
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    name: "arzdesk.local",
    requireTLS: !secure && !local,
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
      : undefined,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject,
    text: `${intro}\n\nOpen this private link to continue:\n${url}\n\nThe link expires in 15 minutes and can only be used once. If you did not request this, you can ignore this email.\n\nArzCore Technologies`,
  });
}

export function sendPasswordResetEmail(data: { to: string; url: string }) {
  return sendAccountEmail({
    ...data,
    subject: "Reset your ArzDesk password",
    intro: "You requested a new password for your ArzDesk account.",
  });
}
export function sendVerificationEmail(data: { to: string; url: string }) {
  return sendAccountEmail({
    ...data,
    subject: "Confirm your ArzDesk email address",
    intro:
      "Confirm this address to complete your ArzDesk email change. Your old address stays active until you confirm.",
  });
}
export function sendEmailChangeConfirmation(data: { to: string; url: string }) {
  return sendAccountEmail({
    ...data,
    subject: "Approve your ArzDesk email change",
    intro:
      "Someone requested an email address change for your ArzDesk account. Approve it using this link only if you made this request. The new address must also be verified.",
  });
}
