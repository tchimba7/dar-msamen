import Link from "next/link";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { getAuthSession } from "@/auth";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Locale, t } from "@/lib/i18n";

import { updateAdminProfileAction } from "../actions";

export default async function AdminProfilePage({
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

  if (!session?.user || session.user.role !== "ADMIN_USER") {
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

  return (
    <section className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-3xl font-bold text-amber-950">
        {locale === "fr" ? "Modifier mon profil admin" : "تعديل الملف الإداري"}
      </h1>

      {updated === "1" ? (
        <p className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {locale === "fr"
            ? "Vos informations ont été mises à jour."
            : "تم تحديث معلوماتك بنجاح."}
        </p>
      ) : null}

      {error === "invalid" ? (
        <p className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {locale === "fr"
            ? "Veuillez vérifier les informations saisies."
            : "يرجى التحقق من المعلومات المدخلة."}
        </p>
      ) : null}

      {error === "email" ? (
        <p className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {locale === "fr"
            ? "Cet email est déjà utilisé."
            : "هذا البريد الإلكتروني مستخدم بالفعل."}
        </p>
      ) : null}

      {error === "phone" ? (
        <p className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {locale === "fr"
            ? "Format téléphone Maroc invalide. Exemples: 0612345678 ou +212612345678"
            : "صيغة هاتف المغرب غير صالحة. مثال: 0612345678 أو +212612345678"}
        </p>
      ) : null}

      <Card>
        <CardTitle>{locale === "fr" ? "Informations admin" : "معلومات الإدارة"}</CardTitle>
        <CardDescription>
          {locale === "fr"
            ? "Mettez à jour votre nom, email, téléphone et adresse."
            : "قم بتحديث الاسم والبريد الإلكتروني والهاتف والعنوان."}
        </CardDescription>

        <form action={updateAdminProfileAction} className="mt-4 space-y-3">
          <input type="hidden" name="locale" value={locale} />

          <div className="space-y-1">
            <label htmlFor="name" className="text-sm font-medium text-amber-900">
              {locale === "fr" ? "Nom complet" : "الاسم الكامل"}
            </label>
            <input
              id="name"
              name="name"
              required
              defaultValue={user.name}
              className="w-full rounded-md border border-amber-300 px-3 py-2"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="email" className="text-sm font-medium text-amber-900">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              defaultValue={user.email}
              className="w-full rounded-md border border-amber-300 px-3 py-2"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="phone" className="text-sm font-medium text-amber-900">
              {locale === "fr" ? "Téléphone" : "الهاتف"}
            </label>
            <input
              id="phone"
              name="phone"
              required
              defaultValue={user.phone ?? ""}
              className="w-full rounded-md border border-amber-300 px-3 py-2"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="addressLine" className="text-sm font-medium text-amber-900">
              {locale === "fr" ? "Adresse" : "العنوان"}
            </label>
            <input
              id="addressLine"
              name="addressLine"
              required
              defaultValue={user.addressLine ?? ""}
              className="w-full rounded-md border border-amber-300 px-3 py-2"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="city" className="text-sm font-medium text-amber-900">
              {locale === "fr" ? "Ville" : "المدينة"}
            </label>
            <input
              id="city"
              name="city"
              required
              defaultValue={user.city ?? ""}
              className="w-full rounded-md border border-amber-300 px-3 py-2"
            />
          </div>

          <Button type="submit" className="mt-2">
            {locale === "fr" ? "Enregistrer" : "حفظ"}
          </Button>
        </form>

        <Link href={`/${locale}/admin`} className="mt-4 inline-flex text-sm font-semibold text-amber-800 underline">
          {dict.navAdmin}
        </Link>
      </Card>
    </section>
  );
}
