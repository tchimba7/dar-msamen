import Link from "next/link";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { getAuthSession } from "@/auth";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Locale, t } from "@/lib/i18n";
import { isPhoneVerificationRequired } from "@/lib/verification-policy";

import { updateClientProfileAction } from "../actions";

export default async function ClientProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ updated?: string; error?: string }>;
}) {
  const { locale } = await params;
  const { updated, error } = await searchParams;
  const session = await getAuthSession();
  const dict = t(locale);
  const phoneVerificationRequired = isPhoneVerificationRequired();

  if (!session?.user || session.user.role !== "CLIENT") {
    redirect(`/${locale}/connexion`);
  }

  if (phoneVerificationRequired && !session.user.phoneVerified) {
    redirect(`/${locale}/client/verification-telephone`);
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

  const isFr = locale === "fr";
  const fieldLabelClass = "text-sm font-semibold text-amber-950";
  const inputClass =
    "w-full rounded-xl border border-amber-200 bg-white/95 px-3.5 py-2.5 text-sm text-amber-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] transition-all placeholder:text-amber-500/70 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200/80";

  const successMessage =
    updated === "1"
      ? isFr
        ? "Informations mises à jour avec succès"
        : "تم تحديث المعلومات بنجاح"
      : null;

  const errorMessages = {
    invalid: {
      fr: "Veuillez vérifier les informations saisies.",
      ar: "يرجى التحقق من المعلومات المدخلة.",
    },
    email: {
      fr: "Cet email est déjà utilisé.",
      ar: "هذا البريد الإلكتروني مستخدم بالفعل.",
    },
    phone: {
      fr: "Format téléphone Maroc invalide. Exemples: 0612345678 ou +212612345678",
      ar: "صيغة هاتف المغرب غير صالحة. مثال: 0612345678 أو +212612345678",
    },
    phone_used: {
      fr: "Ce numéro de téléphone est déjà utilisé sur un autre compte.",
      ar: "رقم الهاتف هذا مستخدم في حساب آخر.",
    },
  } as const;

  const errorMessage =
    error && error in errorMessages
      ? errorMessages[error as keyof typeof errorMessages][isFr ? "fr" : "ar"]
      : null;

  return (
    <section className="scene-3d relative mx-auto w-full max-w-5xl space-y-5">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-4 -top-12 -z-10 h-56 rounded-[2rem] bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.35),rgba(255,247,237,0.2)_45%,transparent_72%)] blur-2xl"
      />
      <div
        aria-hidden
        className="float-orb-3d pointer-events-none absolute -right-6 top-20 -z-10 h-20 w-20 rounded-full bg-[radial-gradient(circle_at_35%_35%,#fde68a_0,#f59e0b_55%,#b45309_100%)] opacity-70 blur-[1px]"
      />

      <header className="surface-animate panel-3d rounded-3xl border border-amber-200/70 bg-white/80 px-6 py-5 shadow-[0_18px_45px_rgba(120,53,15,0.1)] backdrop-blur-sm sm:px-8">
        <div className="panel-layer">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700/85">
            {isFr ? "Espace client" : "فضاء الزبون"}
          </p>
          <h1 className="mt-2 text-3xl font-bold text-amber-950 sm:text-4xl">
            {isFr ? "Modifier mon profil" : "تعديل الملف الشخصي"}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-amber-900/80 sm:text-base">
            {isFr
              ? "Mettez à jour vos informations pour faciliter vos prochaines commandes"
              : "قم بتحديث معلوماتك لتسهيل طلباتك القادمة"}
          </p>
        </div>
      </header>

      {successMessage ? (
        <p className="surface-animate surface-delay-1 rounded-xl border border-emerald-300 bg-emerald-50/95 px-4 py-2.5 text-sm font-medium text-emerald-800">
          {successMessage}
        </p>
      ) : null}

      {errorMessage ? (
        <p className="surface-animate surface-delay-1 rounded-xl border border-red-300 bg-red-50/95 px-4 py-2.5 text-sm font-medium text-red-700">
          {errorMessage}
        </p>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <Card className="surface-animate surface-delay-2 panel-3d rounded-3xl border-amber-200/80 bg-white/92 p-6 sm:p-7">
          <div className="panel-layer">
            <CardTitle className="text-xl">
              {isFr ? "Informations personnelles" : "المعلومات الشخصية"}
            </CardTitle>
            <CardDescription className="mt-1">
              {isFr
                ? "Nom, email, téléphone et adresse de livraison."
                : "الاسم والبريد الإلكتروني والهاتف وعنوان التوصيل."}
            </CardDescription>

            <form
              action={updateClientProfileAction}
              className="mt-6 grid gap-4 sm:grid-cols-2"
            >
              <input type="hidden" name="locale" value={locale} />

              <div className="space-y-1.5">
                <label htmlFor="name" className={fieldLabelClass}>
                  {isFr ? "Nom complet" : "الاسم الكامل"}
                </label>
                <input
                  id="name"
                  name="name"
                  required
                  defaultValue={user.name}
                  className={inputClass}
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="email" className={fieldLabelClass}>
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  defaultValue={user.email}
                  className={inputClass}
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="phone" className={fieldLabelClass}>
                  {isFr ? "Numéro WhatsApp" : "رقم واتساب"}
                </label>
                <input
                  id="phone"
                  name="phone"
                  required
                  defaultValue={user.phone ?? ""}
                  className={inputClass}
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="city" className={fieldLabelClass}>
                  {isFr ? "Ville" : "المدينة"}
                </label>
                <input
                  id="city"
                  name="city"
                  required
                  defaultValue={user.city ?? ""}
                  className={inputClass}
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label htmlFor="addressLine" className={fieldLabelClass}>
                  {isFr ? "Adresse de livraison" : "عنوان التوصيل"}
                </label>
                <input
                  id="addressLine"
                  name="addressLine"
                  required
                  defaultValue={user.addressLine ?? ""}
                  className={inputClass}
                />
              </div>

              <div className="pt-1 sm:col-span-2">
                <Button
                  type="submit"
                  className="panel-layer-soft w-full rounded-xl py-2.5 sm:w-auto sm:px-6"
                >
                  {isFr ? "Enregistrer les modifications" : "حفظ التغييرات"}
                </Button>
              </div>
            </form>
          </div>
        </Card>

        <Card className="surface-animate surface-delay-2 panel-3d h-fit rounded-3xl border-amber-200/80 bg-white/92 p-5">
          <div className="panel-layer">
            <CardTitle className="text-base">
              {isFr ? "Aperçu du compte" : "نظرة على الحساب"}
            </CardTitle>
            <CardDescription className="mt-1">
              {isFr
                ? "Vos informations actuelles."
                : "معلوماتك الحالية."}
            </CardDescription>

            <dl className="mt-4 space-y-3 text-sm text-amber-900">
              <div>
                <dt className="text-xs uppercase tracking-wide text-amber-700/80">Email</dt>
                <dd className="mt-0.5 break-all font-medium text-amber-950">{user.email}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-amber-700/80">
                  {isFr ? "Téléphone" : "الهاتف"}
                </dt>
                <dd className="mt-0.5 font-medium text-amber-950">{user.phone ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-amber-700/80">
                  {isFr ? "Vérification" : "التحقق"}
                </dt>
                <dd className="mt-0.5 font-medium text-amber-950">
                  {user.phoneVerifiedAt
                    ? isFr
                      ? "Téléphone vérifié"
                      : "الهاتف مُتحقق"
                    : isFr
                      ? "Téléphone non vérifié"
                      : "الهاتف غير مُتحقق"}
                </dd>
              </div>
            </dl>

            <Link
              href={`/${locale}/client`}
              className="panel-layer-soft mt-5 inline-flex text-sm font-semibold text-amber-800 underline decoration-amber-400 underline-offset-4 hover:text-amber-900"
            >
              {dict.navClient}
            </Link>
          </div>
        </Card>
      </div>
    </section>
  );
}
