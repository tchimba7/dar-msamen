import { createHash } from "node:crypto";

import { and, desc, eq } from "drizzle-orm";
import nodemailer from "nodemailer";

import { db } from "@/lib/db";
import { passwordResetCodes, users } from "@/db/schema";
import { hashPassword } from "@/lib/password";

type ResetResult =
  | { ok: true }
  | {
      ok: false;
      reason: "invalid" | "expired" | "attempts" | "phone-changed" | "code";
    };

export type PasswordResetDeliveryMode = "smtp" | "mock";

export class PasswordResetSendError extends Error {
  constructor(
    public readonly code: "RESEND_COOLDOWN" | "PROVIDER_FAILURE" | "PROVIDER_NOT_CONFIGURED",
    public readonly retryAfterSeconds?: number,
    message?: string,
  ) {
    super(message ?? code);
    this.name = "PasswordResetSendError";
  }
}

const CODE_TTL_MINUTES = 10;
const CODE_LENGTH = 6;
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_SECONDS = 90;

function hashCode(code: string) {
  return createHash("sha256").update(code).digest("hex");
}

function generateCode() {
  const min = 10 ** (CODE_LENGTH - 1);
  const max = 10 ** CODE_LENGTH - 1;
  return `${Math.floor(min + Math.random() * (max - min + 1))}`;
}

function isTruthy(value: string | undefined) {
  if (!value) return false;
  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}

function getPasswordResetDeliveryMode(): PasswordResetDeliveryMode {
  const provider = (process.env.PASSWORD_RESET_PROVIDER ?? "mock").trim().toLowerCase();
  return provider === "smtp" ? "smtp" : "mock";
}

async function sendEmailCode(email: string, code: string, mode: PasswordResetDeliveryMode) {
  if (mode === "mock") {
    // Safe local fallback for environments without email provider costs.
    console.info(`[password-reset:EMAIL] ${email} => ${code}`);
    return;
  }

  const smtpHost = process.env.SMTP_HOST;
  const smtpPortRaw = process.env.SMTP_PORT ?? "587";
  const smtpPort = Number.parseInt(smtpPortRaw, 10);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const secure = isTruthy(process.env.SMTP_SECURE);
  const fromEmail = process.env.MAIL_FROM ?? smtpUser;

  if (!smtpHost || !Number.isFinite(smtpPort) || !fromEmail) {
    throw new PasswordResetSendError(
      "PROVIDER_NOT_CONFIGURED",
      undefined,
      "SMTP credentials are not configured.",
    );
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure,
    auth: smtpUser && smtpPass ? { user: smtpUser, pass: smtpPass } : undefined,
  });

  const text = `Code de reinitialisation Dar Msamen: ${code}\nCe code expire dans ${CODE_TTL_MINUTES} minutes.`;
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.55;color:#2b160a">
      <h2 style="margin:0 0 12px">Reinitialisation du mot de passe</h2>
      <p style="margin:0 0 10px">Voici votre code de verification :</p>
      <p style="margin:0 0 10px;font-size:28px;font-weight:700;letter-spacing:4px">${code}</p>
      <p style="margin:0">Ce code expire dans ${CODE_TTL_MINUTES} minutes.</p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: fromEmail,
      to: email,
      subject: "Code de reinitialisation - Dar Msamen",
      text,
      html,
    });
  } catch (error) {
    throw new PasswordResetSendError("PROVIDER_FAILURE", undefined, String(error));
  }
}

export async function requestPasswordResetByEmail(email: string) {
  const deliveryMode = getPasswordResetDeliveryMode();
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) {
    return { mode: deliveryMode } as const;
  }

  const [user] = await db
    .select({ id: users.id, email: users.email, phone: users.phone })
    .from(users)
    .where(and(eq(users.email, normalizedEmail), eq(users.role, "CLIENT")))
    .limit(1);

  // Return silently for unknown users to avoid account enumeration.
  if (!user) {
    return { mode: deliveryMode } as const;
  }

  // Keep compatibility with the current schema (password_reset_codes.phone is required).
  const resetTarget = user.phone ?? normalizedEmail;

  const [latestEntry] = await db
    .select({ createdAt: passwordResetCodes.createdAt, expiresAt: passwordResetCodes.expiresAt })
    .from(passwordResetCodes)
    .where(eq(passwordResetCodes.userId, user.id))
    .orderBy(desc(passwordResetCodes.createdAt))
    .limit(1);

  if (latestEntry?.expiresAt.getTime() > Date.now()) {
    const elapsedMs = Date.now() - latestEntry.createdAt.getTime();
    const cooldownMs = RESEND_COOLDOWN_SECONDS * 1000;
    if (elapsedMs < cooldownMs) {
      const retryAfterSeconds = Math.ceil((cooldownMs - elapsedMs) / 1000);
      throw new PasswordResetSendError("RESEND_COOLDOWN", retryAfterSeconds);
    }
  }

  const code = generateCode();
  const codeHash = hashCode(code);
  const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000);

  await db.delete(passwordResetCodes).where(eq(passwordResetCodes.userId, user.id));

  await db.insert(passwordResetCodes).values({
    userId: user.id,
    phone: resetTarget,
    codeHash,
    attempts: 0,
    expiresAt,
  });

  try {
    await sendEmailCode(user.email, code, deliveryMode);
  } catch (error) {
    await db.delete(passwordResetCodes).where(eq(passwordResetCodes.userId, user.id));
    throw error;
  }

  return { mode: deliveryMode } as const;
}

export async function resetPasswordWithCodeByEmail(
  email: string,
  code: string,
  newPassword: string,
): Promise<ResetResult> {
  const normalizedEmail = email.trim().toLowerCase();

  const [user] = await db
    .select({ id: users.id, email: users.email, phone: users.phone })
    .from(users)
    .where(and(eq(users.email, normalizedEmail), eq(users.role, "CLIENT")))
    .limit(1);

  if (!user) {
    return { ok: false, reason: "invalid" };
  }

  const [entry] = await db
    .select()
    .from(passwordResetCodes)
    .where(eq(passwordResetCodes.userId, user.id))
    .orderBy(desc(passwordResetCodes.createdAt))
    .limit(1);

  if (!entry) {
    return { ok: false, reason: "invalid" };
  }

  if (entry.attempts >= MAX_ATTEMPTS) {
    return { ok: false, reason: "attempts" };
  }

  if (entry.expiresAt.getTime() < Date.now()) {
    return { ok: false, reason: "expired" };
  }

  const resetTarget = user.phone ?? normalizedEmail;
  if (resetTarget !== entry.phone) {
    return { ok: false, reason: "phone-changed" };
  }

  const providedHash = hashCode(code);
  if (providedHash !== entry.codeHash) {
    await db
      .update(passwordResetCodes)
      .set({ attempts: entry.attempts + 1 })
      .where(and(eq(passwordResetCodes.id, entry.id), eq(passwordResetCodes.userId, user.id)));

    return { ok: false, reason: "code" };
  }

  await db
    .update(users)
    .set({ passwordHash: await hashPassword(newPassword), updatedAt: new Date() })
    .where(eq(users.id, user.id));

  await db.delete(passwordResetCodes).where(eq(passwordResetCodes.userId, user.id));

  return { ok: true };
}
