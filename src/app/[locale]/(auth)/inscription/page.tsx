import Link from "next/link";
import { redirect } from "next/navigation";

import { getAuthSession } from "@/auth";
import { RegisterForm } from "@/components/auth/register-form";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Locale, t } from "@/lib/i18n";
import { getRoleDashboardPath } from "@/lib/roles";

type RegisterPageProps = {
  params: Promise<{ locale: Locale }>;
};

export default async function RegisterPage({ params }: RegisterPageProps) {
  const { locale } = await params;
  const session = await getAuthSession();

  if (session?.user?.role) {
    redirect(getRoleDashboardPath(locale, session.user.role));
  }

  const dict = t(locale);

  return (
    <section className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[0.95fr,1.05fr] lg:items-start">
      <div className="page-hero p-6 sm:p-8">
        <div className="relative space-y-5">
          <p className="section-kicker">{locale === "fr" ? "Nouveau client" : "زبون جديد"}</p>
          <h1 className="font-display text-4xl font-semibold text-amber-950 sm:text-5xl">
            {dict.registerTitle}
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-amber-950/76">
            {locale === "fr"
              ? "Créez votre compte pour commander plus vite, sauvegarder vos coordonnées de livraison et suivre chaque commande COD."
              : "أنشئ حسابك للطلب بسرعة أكبر وحفظ بيانات التوصيل وتتبع كل طلب بالدفع عند الاستلام."}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Card className="p-4">
              <CardTitle className="text-base">{locale === "fr" ? "Profil prêt à commander" : "ملف جاهز للطلب"}</CardTitle>
              <CardDescription>
                {locale === "fr"
                  ? "Téléphone, ville et adresse enregistrés pour les prochaines commandes."
                  : "الهاتف والمدينة والعنوان محفوظة للطلبات القادمة."}
              </CardDescription>
            </Card>
            <Card className="p-4">
              <CardTitle className="text-base">{locale === "fr" ? "Suivi client" : "متابعة الزبون"}</CardTitle>
              <CardDescription>
                {locale === "fr"
                  ? "Historique de commandes et statut de préparation dans l’espace client."
                  : "سجل الطلبات وحالة التحضير داخل مساحة الزبون."}
              </CardDescription>
            </Card>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-xl space-y-4">
        <RegisterForm locale={locale} />
        <div className="rounded-[1.6rem] border border-[rgba(160,98,37,0.14)] bg-white/72 px-5 py-4 text-sm text-amber-900/78">
          {locale === "fr" ? "Déjà un compte ?" : "لديك حساب بالفعل؟"}{" "}
          <Link href={`/${locale}/connexion`} className="font-semibold text-amber-950 underline">
            {dict.navLogin}
          </Link>
        </div>
      </div>
    </section>
  );
}
