import Link from "next/link";

import {
  requestPasswordResetAction,
  resetPasswordWithCodeAction,
} from "@/app/[locale]/(auth)/actions";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Locale, t } from "@/lib/i18n";

type ForgotPasswordPageProps = {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{
    email?: string;
    sent?: string;
    error?: string;
    retry?: string;
    mode?: string;
  }>;
};

export default async function ForgotPasswordPage({
  params,
  searchParams,
}: ForgotPasswordPageProps) {
  const { locale } = await params;
  const { email = "", sent, error, retry, mode } = await searchParams;
  const dict = t(locale);
  const retrySeconds = Number.parseInt(retry ?? "", 10);
  const isMockMode = mode === "mock";

  return (
    <section className="mx-auto w-full max-w-md space-y-4">
      <h1 className="text-3xl font-bold text-amber-950">
        {locale === "fr" ? "Mot de passe oublié" : "نسيت كلمة المرور"}
      </h1>

      {sent === "1" ? (
        <p className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {isMockMode
            ? locale === "fr"
              ? "Mode test actif: code genere. Verifiez les logs serveur pour recuperer le code."
              : "وضع الاختبار نشط: تم توليد الرمز. تحقق من سجلات الخادم للحصول عليه."
            : locale === "fr"
              ? "Si le compte existe, un code a été envoyé par email."
              : "إذا كان الحساب موجودًا، تم إرسال رمز عبر البريد الإلكتروني."}
        </p>
      ) : null}

      {error === "wait" ? (
        <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {locale === "fr"
            ? `Veuillez patienter ${Number.isFinite(retrySeconds) ? retrySeconds : 30}s avant de redemander un code.`
            : `يرجى الانتظار ${Number.isFinite(retrySeconds) ? retrySeconds : 30} ثانية قبل طلب رمز جديد.`}
        </p>
      ) : null}

      {error === "send" || error === "sandbox" ? (
        <p className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {locale === "fr"
            ? "Impossible d'envoyer le code email pour le moment."
            : "تعذر إرسال رمز البريد الإلكتروني حالياً."}
        </p>
      ) : null}

      {error === "config" ? (
        <p className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {locale === "fr"
            ? "Mode pro email non configure. Ajoutez les variables SMTP (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM) et PASSWORD_RESET_PROVIDER=smtp."
            : "وضع البريد الاحترافي غير مهيأ. أضف متغيرات SMTP و PASSWORD_RESET_PROVIDER=smtp."}
        </p>
      ) : null}

      {error === "password" ? (
        <p className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {locale === "fr"
            ? "Mot de passe faible: minimum 8 caractères avec lettre, chiffre et symbole."
            : "كلمة مرور ضعيفة: 8 أحرف على الأقل مع حرف ورقم ورمز."}
        </p>
      ) : null}

      {error === "code" || error === "invalid" ? (
        <p className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {locale === "fr" ? "Code invalide." : "رمز غير صالح."}
        </p>
      ) : null}

      {error === "expired" ? (
        <p className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {locale === "fr" ? "Code expiré. Demandez un nouveau code." : "انتهت صلاحية الرمز. اطلب رمزًا جديدًا."}
        </p>
      ) : null}

      {error === "attempts" ? (
        <p className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {locale === "fr" ? "Trop de tentatives. Demandez un nouveau code." : "محاولات كثيرة. اطلب رمزًا جديدًا."}
        </p>
      ) : null}

      <Card>
        <CardTitle>{locale === "fr" ? "Recevoir le code par email" : "استلام الرمز عبر البريد الإلكتروني"}</CardTitle>
        <CardDescription>
          {locale === "fr"
            ? "Entrez l'email de votre compte client."
            : "أدخل البريد الإلكتروني لحساب الزبون."}
        </CardDescription>

        <form action={requestPasswordResetAction} className="mt-4 space-y-3">
          <input type="hidden" name="locale" value={locale} />
          <input
            type="email"
            name="email"
            required
            defaultValue={email}
            placeholder="client@example.com"
            className="w-full rounded-md border border-amber-300 px-3 py-2"
          />
          <button
            type="submit"
            className="rounded-md bg-amber-700 px-4 py-2 text-sm font-semibold text-white"
          >
            {locale === "fr" ? "Envoyer le code" : "إرسال الرمز"}
          </button>
        </form>
      </Card>

      <Card>
        <CardTitle>{locale === "fr" ? "Changer le mot de passe" : "تغيير كلمة المرور"}</CardTitle>
        <CardDescription>
          {locale === "fr"
            ? "Saisissez le code reçu par email et votre nouveau mot de passe."
            : "أدخل الرمز المرسل عبر البريد الإلكتروني وكلمة المرور الجديدة."}
        </CardDescription>

        <form action={resetPasswordWithCodeAction} className="mt-4 space-y-3">
          <input type="hidden" name="locale" value={locale} />
          <input
            type="email"
            name="email"
            required
            defaultValue={email}
            placeholder="client@example.com"
            className="w-full rounded-md border border-amber-300 px-3 py-2"
          />
          <input
            name="code"
            inputMode="numeric"
            pattern="[0-9]{6}"
            minLength={6}
            maxLength={6}
            required
            placeholder={locale === "fr" ? "Code 6 chiffres" : "رمز 6 أرقام"}
            className="w-full rounded-md border border-amber-300 px-3 py-2"
          />
          <input
            type="password"
            name="newPassword"
            required
            minLength={8}
            placeholder={locale === "fr" ? "Nouveau mot de passe" : "كلمة المرور الجديدة"}
            className="w-full rounded-md border border-amber-300 px-3 py-2"
          />
          <button
            type="submit"
            className="rounded-md bg-amber-700 px-4 py-2 text-sm font-semibold text-white"
          >
            {locale === "fr" ? "Mettre à jour" : "تحديث"}
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
