import Link from "next/link";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { getAuthSession } from "@/auth";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Locale } from "@/lib/i18n";

import { sendPhoneVerificationCodeAction, verifyPhoneCodeAction } from "../actions";

type PhoneVerificationPageProps = {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ sent?: string; verified?: string; error?: string; retry?: string; channel?: string }>;
};

export default async function PhoneVerificationPage({
  params,
  searchParams,
}: PhoneVerificationPageProps) {
  const { locale } = await params;
  const { sent, verified, error, retry, channel } = await searchParams;
  const session = await getAuthSession();

  if (!session?.user || session.user.role !== "CLIENT") {
    redirect(`/${locale}/connexion`);
  }

  const [{ db }, { users }] = await Promise.all([
    import("@/lib/db"),
    import("@/db/schema"),
  ]);

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  });

  if (!user) {
    redirect(`/${locale}/connexion`);
  }

  const alreadyVerified = Boolean(user.phoneVerifiedAt);
  const retrySeconds = Number.parseInt(retry ?? "", 10);

  return (
    <section className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-3xl font-bold text-amber-950">
        {locale === "fr" ? "Vérification du téléphone" : "التحقق من رقم الهاتف"}
      </h1>

      {alreadyVerified || verified === "1" ? (
        <p className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {locale === "fr"
            ? "Votre numéro est vérifié. Vous pouvez commander normalement."
            : "تم التحقق من رقمك. يمكنك الطلب بشكل عادي."}
        </p>
      ) : null}

      {sent === "1" ? (
        <p className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {channel === "sms"
            ? locale === "fr"
              ? "Code envoye par SMS. Verifiez vos messages."
              : "تم ارسال الرمز عبر SMS. تحقق من الرسائل."
            : locale === "fr"
              ? "Code envoye sur WhatsApp. Verifiez votre messagerie."
              : "تم ارسال الرمز عبر واتساب. تحقق من رسائلك."}
        </p>
      ) : null}

      {error === "send" ? (
        <p className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {locale === "fr"
            ? "Échec d'envoi du code. Réessayez plus tard."
            : "فشل إرسال الرمز. حاول لاحقاً."}
        </p>
      ) : null}

      {error === "sandbox" ? (
        <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {locale === "fr"
            ? "WhatsApp Sandbox Twilio non activé pour ce numéro. Envoyez d'abord le message 'join <code>' au +14155238886 depuis votre WhatsApp, puis réessayez."
            : "Sandbox واتساب Twilio غير مفعّل لهذا الرقم. أرسل أولاً 'join <code>' إلى +14155238886 عبر واتساب ثم أعد المحاولة."}
        </p>
      ) : null}

      {error === "wait" ? (
        <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {locale === "fr"
            ? `Veuillez patienter ${Number.isFinite(retrySeconds) ? retrySeconds : 30}s avant de redemander un code.`
            : `يرجى الانتظار ${Number.isFinite(retrySeconds) ? retrySeconds : 30} ثانية قبل طلب رمز جديد.`}
        </p>
      ) : null}

      {error === "invalid" || error === "code" ? (
        <p className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {locale === "fr" ? "Code invalide." : "رمز غير صالح."}
        </p>
      ) : null}

      {error === "expired" ? (
        <p className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {locale === "fr"
            ? "Code expiré. Demandez un nouveau code."
            : "انتهت صلاحية الرمز. اطلب رمزاً جديداً."}
        </p>
      ) : null}

      {error === "attempts" ? (
        <p className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {locale === "fr"
            ? "Trop de tentatives. Demandez un nouveau code."
            : "محاولات كثيرة. اطلب رمزاً جديداً."}
        </p>
      ) : null}

      {error === "phone" ? (
        <p className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {locale === "fr"
            ? "Numéro introuvable ou invalide. Mettez votre profil à jour."
            : "الرقم غير موجود أو غير صالح. حدّث ملفك الشخصي."}
        </p>
      ) : null}

      <Card>
        <CardTitle>{locale === "fr" ? "Numéro actuel" : "الرقم الحالي"}</CardTitle>
        <CardDescription>{user.phone ?? "-"}</CardDescription>

        <div className="mt-4 flex flex-wrap gap-2">
          <form action={sendPhoneVerificationCodeAction}>
            <input type="hidden" name="locale" value={locale} />
            <Button type="submit" variant="secondary" disabled={alreadyVerified}>
              {locale === "fr" ? "Envoyer par WhatsApp" : "إرسال عبر واتساب"}
            </Button>
          </form>
        </div>

        <form action={verifyPhoneCodeAction} className="mt-4 space-y-3">
          <input type="hidden" name="locale" value={locale} />

          <div className="space-y-1">
            <label htmlFor="code" className="text-sm font-medium text-amber-900">
              {locale === "fr" ? "Code à 6 chiffres" : "رمز من 6 أرقام"}
            </label>
            <input
              id="code"
              name="code"
              inputMode="numeric"
              pattern="[0-9]{6}"
              minLength={6}
              maxLength={6}
              required
              className="w-full rounded-md border border-amber-300 px-3 py-2"
            />
          </div>

          <Button type="submit" disabled={alreadyVerified}>
            {locale === "fr" ? "Vérifier maintenant" : "تحقق الآن"}
          </Button>
        </form>

        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <Link href={`/${locale}/client/profil`} className="font-semibold text-amber-800 underline">
            {locale === "fr" ? "Modifier mon téléphone" : "تعديل الهاتف"}
          </Link>
          <Link href={`/${locale}/client`} className="font-semibold text-amber-800 underline">
            {locale === "fr" ? "Retour au tableau de bord" : "العودة إلى لوحة التحكم"}
          </Link>
        </div>
      </Card>
    </section>
  );
}
