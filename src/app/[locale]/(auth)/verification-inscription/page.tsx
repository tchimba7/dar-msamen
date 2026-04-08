import Link from "next/link";
import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import {
  resendSignupPhoneCodeAction,
  verifySignupPhoneCodeAction,
} from "@/app/[locale]/(auth)/actions";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Locale, t } from "@/lib/i18n";

type SignupVerificationPageProps = {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{
    email?: string;
    sent?: string;
    error?: string;
    retry?: string;
  }>;
};

export default async function SignupVerificationPage({
  params,
  searchParams,
}: SignupVerificationPageProps) {
  const { locale } = await params;
  const { email = "", sent, error, retry } = await searchParams;
  const normalizedEmail = email.trim().toLowerCase();
  const dict = t(locale);

  if (!normalizedEmail || !normalizedEmail.includes("@")) {
    redirect(`/${locale}/inscription`);
  }

  const [{ db }, { users }] = await Promise.all([
    import("@/lib/db"),
    import("@/db/schema"),
  ]);

  const [user] = await db
    .select({ phone: users.phone })
    .from(users)
    .where(and(eq(users.email, normalizedEmail), eq(users.role, "CLIENT")))
    .limit(1);

  if (!user?.phone) {
    redirect(`/${locale}/inscription`);
  }

  const retrySeconds = Number.parseInt(retry ?? "", 10);

  return (
    <section className="mx-auto w-full max-w-md space-y-4">
      <h1 className="text-3xl font-bold text-amber-950">
        {locale === "fr" ? "Vérification du téléphone" : "التحقق من رقم الهاتف"}
      </h1>

      {sent === "1" ? (
        <p className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {locale === "fr"
            ? "Code envoyé sur WhatsApp. Vérifiez votre messagerie."
            : "تم إرسال الرمز عبر واتساب. تحقق من رسائلك."}
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

      <Card>
        <CardTitle>{locale === "fr" ? "Numéro WhatsApp" : "رقم واتساب"}</CardTitle>
        <CardDescription>{user.phone}</CardDescription>

        <div className="mt-4 flex flex-wrap gap-2">
          <form action={resendSignupPhoneCodeAction}>
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="email" value={normalizedEmail} />
            <button
              type="submit"
              className="rounded-md bg-amber-700 px-4 py-2 text-sm font-semibold text-white"
            >
              {locale === "fr" ? "Renvoyer le code WhatsApp" : "إعادة إرسال الرمز عبر واتساب"}
            </button>
          </form>
        </div>

        <form action={verifySignupPhoneCodeAction} className="mt-4 space-y-3">
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="email" value={normalizedEmail} />

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

          <button
            type="submit"
            className="rounded-md bg-amber-700 px-4 py-2 text-sm font-semibold text-white"
          >
            {locale === "fr" ? "Valider le code" : "تأكيد الرمز"}
          </button>
        </form>
      </Card>

      <p className="text-sm text-amber-800">
        <Link href={`/${locale}/connexion`} className="font-semibold text-amber-900 underline">
          {dict.navLogin}
        </Link>
      </p>
    </section>
  );
}
