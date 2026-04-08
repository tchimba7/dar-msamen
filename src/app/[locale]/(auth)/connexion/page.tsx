import Link from "next/link";
import { redirect } from "next/navigation";

import { getAuthSession } from "@/auth";
import { LoginForm } from "@/components/auth/login-form";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Locale, t } from "@/lib/i18n";
import { getRoleDashboardPath } from "@/lib/roles";
import { isPhoneVerificationRequired } from "@/lib/verification-policy";

type LoginPageProps = {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ next?: string; registered?: string; verify?: string; verified?: string; reset?: string }>;
};

export default async function LoginPage({ params, searchParams }: LoginPageProps) {
  const { locale } = await params;
  const { next, registered, verify, verified, reset } = await searchParams;
  const session = await getAuthSession();
  const phoneVerificationRequired = isPhoneVerificationRequired();

  if (session?.user?.role) {
    if (
      phoneVerificationRequired &&
      session.user.role === "CLIENT" &&
      !session.user.phoneVerified
    ) {
      redirect(`/${locale}/client/verification-telephone`);
    }

    redirect(getRoleDashboardPath(locale, session.user.role));
  }

  const dict = t(locale);

  return (
    <section className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[0.95fr,1.05fr] lg:items-start">
      <div className="page-hero p-6 sm:p-8">
        <div className="relative space-y-5">
          <p className="section-kicker">{locale === "fr" ? "Espace connecté" : "المساحة المتصلة"}</p>
          <h1 className="font-display text-4xl font-semibold text-amber-950 sm:text-5xl">
            {dict.loginTitle}
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-amber-950/76">
            {locale === "fr"
              ? "Accédez à votre espace client, au suivi COD et aux outils d’administration dans une interface plus claire et plus sérieuse."
              : "ادخل إلى مساحة الزبون وتتبع طلبات الدفع عند الاستلام وأدوات الإدارة من واجهة أوضح وأكثر احترافية."}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Card className="p-4">
              <CardTitle className="text-base">{locale === "fr" ? "Commande COD" : "الدفع عند الاستلام"}</CardTitle>
              <CardDescription>
                {locale === "fr"
                  ? "Parcours de commande simple, sans friction de paiement en ligne."
                  : "مسار طلب بسيط بدون تعقيد الدفع الإلكتروني."}
              </CardDescription>
            </Card>
            <Card className="p-4">
              <CardTitle className="text-base">{locale === "fr" ? "Suivi des espaces" : "إدارة المساحات"}</CardTitle>
              <CardDescription>
                {locale === "fr"
                  ? "Client, admin et super-admin avec accès distincts."
                  : "فضاءات منفصلة للزبون والإدارة والمشرف العام."}
              </CardDescription>
            </Card>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-xl space-y-4">
        {registered === "1" ? (
          <p className="rounded-2xl border border-emerald-300 bg-emerald-50/95 px-4 py-3 text-sm text-emerald-800">
            {locale === "fr"
              ? "Compte créé avec succès. Connectez-vous pour continuer."
              : "تم إنشاء الحساب بنجاح. قم بتسجيل الدخول للمتابعة."}
          </p>
        ) : null}
        {verify === "1" ? (
          <p className="rounded-2xl border border-amber-300 bg-amber-50/95 px-4 py-3 text-sm text-amber-900">
            {locale === "fr"
              ? "La vérification du téléphone sera demandée avant toute commande."
              : "سيتم طلب التحقق من رقم الهاتف قبل أي طلب."}
          </p>
        ) : null}
        {verified === "1" ? (
          <p className="rounded-2xl border border-emerald-300 bg-emerald-50/95 px-4 py-3 text-sm text-emerald-800">
            {locale === "fr"
              ? "Numéro vérifié avec succès. Connectez-vous maintenant."
              : "تم التحقق من الرقم بنجاح. يمكنك تسجيل الدخول الآن."}
          </p>
        ) : null}
        {reset === "1" ? (
          <p className="rounded-2xl border border-emerald-300 bg-emerald-50/95 px-4 py-3 text-sm text-emerald-800">
            {locale === "fr"
              ? "Mot de passe mis à jour. Connectez-vous avec le nouveau mot de passe."
              : "تم تحديث كلمة المرور. سجل الدخول بكلمة المرور الجديدة."}
          </p>
        ) : null}

        <LoginForm
          locale={locale}
          nextPath={next}
          phoneVerificationRequired={phoneVerificationRequired}
        />

        <div className="space-y-3 rounded-[1.6rem] border border-[rgba(160,98,37,0.14)] bg-white/72 px-5 py-4 text-sm text-amber-900/78">
          <p>
            <Link href={`/${locale}/mot-de-passe-oublie`} className="font-semibold text-amber-950 underline">
              {locale === "fr" ? "Mot de passe oublié ?" : "نسيت كلمة المرور؟"}
            </Link>
          </p>
          <div className="soft-divider" />
          <p>
            {locale === "fr" ? "Pas de compte ?" : "ليس لديك حساب؟"}{" "}
            <Link href={`/${locale}/inscription`} className="font-semibold text-amber-950 underline">
              {dict.navRegister}
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
