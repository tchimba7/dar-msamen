"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { encode } from "next-auth/jwt";

import { registerSchema } from "@/lib/auth-schema";
import { isMissingSchemaError, MISSING_SCHEMA_MESSAGE } from "@/lib/db-errors";
import { isLocale } from "@/lib/i18n";
import { normalizeMoroccanPhone } from "@/lib/phone";
import { isPhoneVerificationRequired } from "@/lib/verification-policy";

function isStrongPassword(value: string) {
  return (
    value.length >= 8 &&
    /[A-Za-z]/.test(value) &&
    /[0-9]/.test(value) &&
    /[^A-Za-z0-9]/.test(value)
  );
}

async function signInClientAfterVerification(params: {
  userId: string;
  name: string;
  email: string;
  locale: "fr" | "ar";
}) {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    redirect(`/${params.locale}/connexion?verified=1`);
  }

  const maxAge = 30 * 24 * 60 * 60;
  const token = await encode({
    token: {
      sub: params.userId,
      name: params.name,
      email: params.email,
      role: "CLIENT",
      adminOwnerId: null,
      phoneVerified: true,
    },
    secret,
    maxAge,
  });

  const cookieStore = await cookies();
  const isSecure = process.env.NODE_ENV === "production";
  const cookieName = isSecure ? "__Secure-next-auth.session-token" : "next-auth.session-token";

  cookieStore.set(cookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isSecure,
    path: "/",
    maxAge,
  });

  redirect(`/${params.locale}/client`);
}

export type AuthFormState = {
  error?: string;
  fieldErrors?: {
    name?: string;
    email?: string;
    phone?: string;
    password?: string;
  };
};

export async function registerAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const localeRaw = String(formData.get("locale") ?? "fr");
  const locale = isLocale(localeRaw) ? localeRaw : "fr";

  const payload = {
    name: String(formData.get("name") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    phone: String(formData.get("phone") ?? "").trim(),
    password: String(formData.get("password") ?? "").trim(),
  };
  const phoneVerificationRequired = isPhoneVerificationRequired();

  const parsed = registerSchema.safeParse(payload);

  if (!parsed.success) {
    const flattened = parsed.error.flatten().fieldErrors;
    return {
      error: parsed.error.issues[0]?.message ?? "Vérifiez les champs saisis.",
      fieldErrors: {
        name: flattened.name?.[0],
        email: flattened.email?.[0],
        phone: flattened.phone?.[0],
        password: flattened.password?.[0],
      },
    };
  }

  const [{ db }, { users }, { hashPassword }, { createPhoneVerificationCode }] = await Promise.all([
    import("@/lib/db"),
    import("@/db/schema"),
    import("@/lib/password"),
    import("@/lib/phone-verification"),
  ]);

  try {
    const exists = await db.query.users.findFirst({
      where: (table, { eq: eqOperator }) => eqOperator(table.email, parsed.data.email),
    });

    if (exists) {
      return {
        error: "Cet email est déjà utilisé.",
        fieldErrors: { email: "Cet email est déjà utilisé." },
      };
    }

    const normalizedPhone = normalizeMoroccanPhone(parsed.data.phone);

    const existsByPhone = await db.query.users.findFirst({
      where: (table, { eq: eqOperator }) => eqOperator(table.phone, normalizedPhone),
    });

    if (existsByPhone) {
      return {
        error: "Ce numéro de téléphone est déjà utilisé.",
        fieldErrors: { phone: "Ce numéro de téléphone est déjà utilisé." },
      };
    }

    const [createdUser] = await db
      .insert(users)
      .values({
        name: parsed.data.name,
        email: parsed.data.email,
        phone: normalizedPhone,
        phoneVerifiedAt: phoneVerificationRequired ? null : new Date(),
        passwordHash: await hashPassword(parsed.data.password),
        role: "CLIENT",
      })
      .returning({ id: users.id, name: users.name, email: users.email, phone: users.phone });

    if (!phoneVerificationRequired) {
      await signInClientAfterVerification({
        userId: createdUser.id,
        name: createdUser.name,
        email: createdUser.email,
        locale,
      });
    }

    try {
      await createPhoneVerificationCode({
        userId: createdUser.id,
        phone: createdUser.phone ?? normalizedPhone,
        channel: "WHATSAPP",
      });
      redirect(
        `/${locale}/verification-inscription?email=${encodeURIComponent(createdUser.email)}&sent=1`,
      );
    } catch {
      redirect(
        `/${locale}/verification-inscription?email=${encodeURIComponent(createdUser.email)}&error=send`,
      );
    }
  } catch (error) {
    if (isMissingSchemaError(error)) {
      return { error: MISSING_SCHEMA_MESSAGE };
    }

    throw error;
  }

  redirect(`/${locale}/verification-inscription?error=invalid`);
}

export async function resendSignupPhoneCodeAction(formData: FormData) {
  const localeRaw = String(formData.get("locale") ?? "fr");
  const locale = isLocale(localeRaw) ? localeRaw : "fr";
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!isPhoneVerificationRequired()) {
    redirect(`/${locale}/connexion?verified=1`);
  }

  const { createPhoneVerificationCodeByEmail, PhoneVerificationSendError } = await import(
    "@/lib/phone-verification"
  );

  try {
    await createPhoneVerificationCodeByEmail(email, "WHATSAPP");
  } catch (error) {
    if (error instanceof PhoneVerificationSendError && error.code === "RESEND_COOLDOWN") {
      const retryAfter = error.retryAfterSeconds ?? 30;
      redirect(
        `/${locale}/verification-inscription?email=${encodeURIComponent(email)}&error=wait&retry=${retryAfter}`,
      );
    }

    if (
      error instanceof PhoneVerificationSendError &&
      error.code === "WHATSAPP_SANDBOX_NOT_JOINED"
    ) {
      redirect(`/${locale}/verification-inscription?email=${encodeURIComponent(email)}&error=sandbox`);
    }

    redirect(`/${locale}/verification-inscription?email=${encodeURIComponent(email)}&error=send`);
  }

  redirect(`/${locale}/verification-inscription?email=${encodeURIComponent(email)}&sent=1`);
}

export async function verifySignupPhoneCodeAction(formData: FormData) {
  const localeRaw = String(formData.get("locale") ?? "fr");
  const locale = isLocale(localeRaw) ? localeRaw : "fr";
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const code = String(formData.get("code") ?? "").trim();

  if (!isPhoneVerificationRequired()) {
    redirect(`/${locale}/connexion?verified=1`);
  }

  if (!/^\d{6}$/.test(code)) {
    redirect(`/${locale}/verification-inscription?email=${encodeURIComponent(email)}&error=code`);
  }

  const { verifyPhoneVerificationCodeByEmail } = await import("@/lib/phone-verification");
  const result = await verifyPhoneVerificationCodeByEmail(email, code);

  if (!result.ok) {
    const message =
      result.reason === "expired"
        ? "expired"
        : result.reason === "too-many-attempts"
          ? "attempts"
          : result.reason === "phone-changed"
            ? "phone"
            : "invalid";

    redirect(`/${locale}/verification-inscription?email=${encodeURIComponent(email)}&error=${message}`);
  }

  const [{ db }, { users }, { and, eq }] = await Promise.all([
    import("@/lib/db"),
    import("@/db/schema"),
    import("drizzle-orm"),
  ]);

  const [user] = await db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(and(eq(users.email, email), eq(users.role, "CLIENT")))
    .limit(1);

  if (!user) {
    redirect(`/${locale}/connexion?verified=1`);
  }

  await signInClientAfterVerification({
    userId: user.id,
    name: user.name,
    email: user.email,
    locale,
  });
}

export async function requestPasswordResetAction(formData: FormData) {
  const localeRaw = String(formData.get("locale") ?? "fr");
  const locale = isLocale(localeRaw) ? localeRaw : "fr";
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  const { requestPasswordResetByEmail, PasswordResetSendError } = await import(
    "@/lib/password-reset"
  );

  try {
    const result = await requestPasswordResetByEmail(email);
    const mode = result.mode;
    redirect(`/${locale}/mot-de-passe-oublie?email=${encodeURIComponent(email)}&sent=1&mode=${mode}`);
  } catch (error) {
    if (error instanceof PasswordResetSendError && error.code === "RESEND_COOLDOWN") {
      const retryAfter = error.retryAfterSeconds ?? 30;
      redirect(
        `/${locale}/mot-de-passe-oublie?email=${encodeURIComponent(email)}&error=wait&retry=${retryAfter}`,
      );
    }

    if (error instanceof PasswordResetSendError && error.code === "PROVIDER_NOT_CONFIGURED") {
      redirect(`/${locale}/mot-de-passe-oublie?email=${encodeURIComponent(email)}&error=config`);
    }

    redirect(`/${locale}/mot-de-passe-oublie?email=${encodeURIComponent(email)}&error=send`);
  }
}

export async function resetPasswordWithCodeAction(formData: FormData) {
  const localeRaw = String(formData.get("locale") ?? "fr");
  const locale = isLocale(localeRaw) ? localeRaw : "fr";
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const code = String(formData.get("code") ?? "").trim();
  const newPassword = String(formData.get("newPassword") ?? "").trim();

  if (!/^\d{6}$/.test(code)) {
    redirect(`/${locale}/mot-de-passe-oublie?email=${encodeURIComponent(email)}&error=code`);
  }

  if (!isStrongPassword(newPassword)) {
    redirect(`/${locale}/mot-de-passe-oublie?email=${encodeURIComponent(email)}&error=password`);
  }

  const { resetPasswordWithCodeByEmail } = await import("@/lib/password-reset");
  const result = await resetPasswordWithCodeByEmail(email, code, newPassword);

  if (!result.ok) {
    const codeMessage =
      result.reason === "attempts"
        ? "attempts"
        : result.reason === "expired"
          ? "expired"
          : result.reason === "phone-changed"
            ? "phone"
            : "invalid";

    redirect(`/${locale}/mot-de-passe-oublie?email=${encodeURIComponent(email)}&error=${codeMessage}`);
  }

  redirect(`/${locale}/connexion?reset=1`);
}
