import { createHash } from "node:crypto";

import { and, desc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { phoneVerificationCodes, users } from "@/db/schema";
import { toMoroccanE164 } from "@/lib/phone";

export type PhoneVerificationChannel = "SMS" | "WHATSAPP";

type CreateCodeParams = {
  userId: string;
  phone: string;
  channel: PhoneVerificationChannel;
};

type VerificationResult =
  | { ok: true }
  | { ok: false; reason: "not-found" | "expired" | "too-many-attempts" | "invalid-code" | "phone-changed" };

export class PhoneVerificationSendError extends Error {
  constructor(
    public readonly code: "RESEND_COOLDOWN" | "PROVIDER_FAILURE" | "WHATSAPP_SANDBOX_NOT_JOINED",
    public readonly retryAfterSeconds?: number,
    message?: string,
  ) {
    super(message ?? code);
    this.name = "PhoneVerificationSendError";
  }
}

const CODE_LENGTH = 6;
const CODE_TTL_MINUTES = 10;
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

function formatWhatsAppAddress(value: string) {
  const trimmed = value.trim();
  if (trimmed.toLowerCase().startsWith("whatsapp:")) {
    return trimmed;
  }
  return `whatsapp:${trimmed}`;
}

async function sendTwilioMessage(phone: string, code: string, channel: PhoneVerificationChannel) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const smsFrom = process.env.TWILIO_SMS_FROM;
  const whatsappFrom = process.env.TWILIO_WHATSAPP_FROM;

  if (!sid || !token) {
    throw new Error("Twilio credentials are not configured.");
  }

  const fromRaw = channel === "WHATSAPP" ? whatsappFrom : smsFrom;
  const from = channel === "WHATSAPP" && fromRaw ? formatWhatsAppAddress(fromRaw) : fromRaw;
  if (!from) {
    throw new Error(`Twilio sender for ${channel} is not configured.`);
  }

  const toPhone = toMoroccanE164(phone);
  const to = channel === "WHATSAPP" ? formatWhatsAppAddress(toPhone) : toPhone;
  const message = `Code de verification Msamen: ${code}. Il expire dans ${CODE_TTL_MINUTES} minutes.`;

  const body = new URLSearchParams({
    From: from,
    To: to,
    Body: message,
  });

  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) {
    const details = await response.text();
    let parsed: { code?: number; message?: string } | null = null;
    try {
      parsed = JSON.parse(details) as { code?: number; message?: string };
    } catch {
      // Keep raw response details below when payload is not valid JSON.
    }

    if (parsed?.code === 63015) {
      throw new PhoneVerificationSendError(
        "WHATSAPP_SANDBOX_NOT_JOINED",
        undefined,
        parsed.message ?? "WhatsApp Sandbox not joined",
      );
    }

    throw new Error(`Twilio send failed: ${details}`);
  }
}

async function sendCode(phone: string, code: string, channel: PhoneVerificationChannel) {
  const provider = (process.env.PHONE_VERIFICATION_PROVIDER ?? "mock").toLowerCase();

  if (provider === "twilio") {
    try {
      await sendTwilioMessage(phone, code, channel);
    } catch (error) {
      if (error instanceof PhoneVerificationSendError) {
        throw error;
      }
      throw new PhoneVerificationSendError("PROVIDER_FAILURE", undefined, String(error));
    }
    return;
  }

  // Development fallback to keep local flows testable without an external provider.
  console.info(`[phone-verification:${channel}] ${phone} => ${code}`);
}

export async function createPhoneVerificationCode({ userId, phone, channel }: CreateCodeParams) {
  const [latestEntry] = await db
    .select({
      phone: phoneVerificationCodes.phone,
      createdAt: phoneVerificationCodes.createdAt,
      expiresAt: phoneVerificationCodes.expiresAt,
    })
    .from(phoneVerificationCodes)
    .where(eq(phoneVerificationCodes.userId, userId))
    .orderBy(desc(phoneVerificationCodes.createdAt))
    .limit(1);

  if (latestEntry?.phone === phone && latestEntry.expiresAt.getTime() > Date.now()) {
    const elapsedMs = Date.now() - latestEntry.createdAt.getTime();
    const cooldownMs = RESEND_COOLDOWN_SECONDS * 1000;
    if (elapsedMs < cooldownMs) {
      const retryAfterSeconds = Math.ceil((cooldownMs - elapsedMs) / 1000);
      throw new PhoneVerificationSendError("RESEND_COOLDOWN", retryAfterSeconds);
    }
  }

  const code = generateCode();
  const codeHash = hashCode(code);
  const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000);

  await db.delete(phoneVerificationCodes).where(eq(phoneVerificationCodes.userId, userId));

  await db.insert(phoneVerificationCodes).values({
    userId,
    phone,
    channel,
    codeHash,
    attempts: 0,
    expiresAt,
  });

  try {
    await sendCode(phone, code, channel);
  } catch (error) {
    await db.delete(phoneVerificationCodes).where(eq(phoneVerificationCodes.userId, userId));
    throw error;
  }
}

export async function createPhoneVerificationCodeByEmail(
  email: string,
  channel: PhoneVerificationChannel = "WHATSAPP",
) {
  const normalizedEmail = email.trim().toLowerCase();

  const [user] = await db
    .select({ id: users.id, phone: users.phone, role: users.role })
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  if (!user || user.role !== "CLIENT" || !user.phone) {
    return { ok: false as const, reason: "not-found" as const };
  }

  await createPhoneVerificationCode({
    userId: user.id,
    phone: user.phone,
    channel,
  });

  return { ok: true as const };
}

export async function verifyPhoneVerificationCode(userId: string, code: string): Promise<VerificationResult> {
  const [entry] = await db
    .select()
    .from(phoneVerificationCodes)
    .where(eq(phoneVerificationCodes.userId, userId))
    .orderBy(desc(phoneVerificationCodes.createdAt))
    .limit(1);

  if (!entry) {
    return { ok: false, reason: "not-found" };
  }

  if (entry.attempts >= MAX_ATTEMPTS) {
    return { ok: false, reason: "too-many-attempts" };
  }

  if (entry.expiresAt.getTime() < Date.now()) {
    return { ok: false, reason: "expired" };
  }

  const [user] = await db
    .select({ phone: users.phone })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user || !user.phone || user.phone !== entry.phone) {
    return { ok: false, reason: "phone-changed" };
  }

  const providedHash = hashCode(code);
  if (providedHash !== entry.codeHash) {
    await db
      .update(phoneVerificationCodes)
      .set({ attempts: entry.attempts + 1 })
      .where(and(eq(phoneVerificationCodes.id, entry.id), eq(phoneVerificationCodes.userId, userId)));

    return { ok: false, reason: "invalid-code" };
  }

  await db.update(users).set({ phoneVerifiedAt: new Date() }).where(eq(users.id, userId));
  await db.delete(phoneVerificationCodes).where(eq(phoneVerificationCodes.userId, userId));

  return { ok: true };
}

export async function verifyPhoneVerificationCodeByEmail(
  email: string,
  code: string,
): Promise<VerificationResult> {
  const normalizedEmail = email.trim().toLowerCase();
  const [user] = await db
    .select({ id: users.id, role: users.role })
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  if (!user || user.role !== "CLIENT") {
    return { ok: false, reason: "not-found" };
  }

  return verifyPhoneVerificationCode(user.id, code);
}
