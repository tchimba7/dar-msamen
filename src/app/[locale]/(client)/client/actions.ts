"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getAuthSession } from "@/auth";
import {
  PhoneVerificationSendError,
  createPhoneVerificationCode,
  verifyPhoneVerificationCode,
} from "@/lib/phone-verification";
import { isValidMoroccanPhone, normalizeMoroccanPhone } from "@/lib/phone";

export async function updateClientProfileAction(formData: FormData) {
  const locale = String(formData.get("locale") ?? "fr");
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim();
  const addressLine = String(formData.get("addressLine") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();

  const session = await getAuthSession();
  if (!session?.user || session.user.role !== "CLIENT") {
    redirect(`/${locale}/connexion`);
  }

  if (!name || !email || !email.includes("@") || !phone || !addressLine || !city) {
    redirect(`/${locale}/client/profil?error=invalid`);
  }

  if (!isValidMoroccanPhone(phone)) {
    redirect(`/${locale}/client/profil?error=phone`);
  }

  const [{ db }, { userProfileChanges, users }, { and, eq, ne }] = await Promise.all([
    import("@/lib/db"),
    import("@/db/schema"),
    import("drizzle-orm"),
  ]);

  const existingUser = await db.query.users.findFirst({
    where: and(eq(users.email, email), ne(users.id, session.user.id)),
  });

  if (existingUser) {
    redirect(`/${locale}/client/profil?error=email`);
  }

  const normalizedPhone = normalizeMoroccanPhone(phone);

  const existingByPhone = await db.query.users.findFirst({
    where: and(eq(users.phone, normalizedPhone), ne(users.id, session.user.id)),
  });

  if (existingByPhone) {
    redirect(`/${locale}/client/profil?error=phone_used`);
  }

  const [currentUser] = await db
    .select({
      name: users.name,
      email: users.email,
      phone: users.phone,
      addressLine: users.addressLine,
      city: users.city,
    })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!currentUser) {
    redirect(`/${locale}/connexion`);
  }

  const hasPhoneChanged = currentUser?.phone !== normalizedPhone;
  const hasAnyProfileChange =
    currentUser.name !== name ||
    currentUser.email !== email ||
    currentUser.phone !== normalizedPhone ||
    (currentUser.addressLine ?? "") !== addressLine ||
    (currentUser.city ?? "") !== city;

  if (!hasAnyProfileChange) {
    redirect(`/${locale}/client/profil?updated=1`);
  }

  const updatePayload: {
    name: string;
    email: string;
    phone: string;
    addressLine: string;
    city: string;
    updatedAt: Date;
    phoneVerifiedAt?: Date | null;
  } = {
    name,
    email,
    phone: normalizedPhone,
    addressLine,
    city,
    updatedAt: new Date(),
  };

  if (hasPhoneChanged) {
    updatePayload.phoneVerifiedAt = null;
  }

  await db.transaction(async (tx) => {
    await tx
      .update(users)
      .set(updatePayload)
      .where(eq(users.id, session.user.id));

    await tx.insert(userProfileChanges).values({
      userId: session.user.id,
      changedByUserId: session.user.id,
      changedByRole: "CLIENT",
      previousName: currentUser.name,
      newName: name,
      previousEmail: currentUser.email,
      newEmail: email,
      previousPhone: currentUser.phone,
      newPhone: normalizedPhone,
      previousAddressLine: currentUser.addressLine,
      newAddressLine: addressLine,
      previousCity: currentUser.city,
      newCity: city,
    });
  });

  revalidatePath(`/${locale}/client`);
  revalidatePath(`/${locale}/client/profil`);

  redirect(`/${locale}/client/profil?updated=1`);
}

export async function sendPhoneVerificationCodeAction(formData: FormData) {
  const locale = String(formData.get("locale") ?? "fr");
  const channel = "WHATSAPP";

  const session = await getAuthSession();
  if (!session?.user || session.user.role !== "CLIENT") {
    redirect(`/${locale}/connexion`);
  }

  const [{ db }, { users }, { eq }] = await Promise.all([
    import("@/lib/db"),
    import("@/db/schema"),
    import("drizzle-orm"),
  ]);

  const [user] = await db
    .select({ phone: users.phone, phoneVerifiedAt: users.phoneVerifiedAt })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!user?.phone || !isValidMoroccanPhone(user.phone)) {
    redirect(`/${locale}/client/verification-telephone?error=phone`);
  }

  if (user.phoneVerifiedAt) {
    redirect(`/${locale}/client/verification-telephone?verified=1`);
  }

  try {
    await createPhoneVerificationCode({
      userId: session.user.id,
      phone: user.phone,
      channel,
    });
  } catch (error) {
    if (error instanceof PhoneVerificationSendError && error.code === "RESEND_COOLDOWN") {
      const retryAfter = error.retryAfterSeconds ?? 30;
      redirect(`/${locale}/client/verification-telephone?error=wait&retry=${retryAfter}`);
    }

    if (error instanceof PhoneVerificationSendError && error.code === "WHATSAPP_SANDBOX_NOT_JOINED") {
      redirect(`/${locale}/client/verification-telephone?error=sandbox`);
    }

    console.error("Failed to send phone verification code", {
      userId: session.user.id,
      channel,
      error,
    });
    redirect(`/${locale}/client/verification-telephone?error=send`);
  }

  redirect(`/${locale}/client/verification-telephone?sent=1&channel=whatsapp`);
}

export async function verifyPhoneCodeAction(formData: FormData) {
  const locale = String(formData.get("locale") ?? "fr");
  const code = String(formData.get("code") ?? "").trim();

  const session = await getAuthSession();
  if (!session?.user || session.user.role !== "CLIENT") {
    redirect(`/${locale}/connexion`);
  }

  if (!/^\d{6}$/.test(code)) {
    redirect(`/${locale}/client/verification-telephone?error=code`);
  }

  const result = await verifyPhoneVerificationCode(session.user.id, code);

  if (!result.ok) {
    const message =
      result.reason === "expired"
        ? "expired"
        : result.reason === "too-many-attempts"
          ? "attempts"
          : result.reason === "phone-changed"
            ? "phone"
            : "invalid";

    redirect(`/${locale}/client/verification-telephone?error=${message}`);
  }

  revalidatePath(`/${locale}/client`);
  revalidatePath(`/${locale}/client/profil`);
  revalidatePath(`/${locale}/client/verification-telephone`);

  redirect(`/${locale}/client/verification-telephone?verified=1`);
}
