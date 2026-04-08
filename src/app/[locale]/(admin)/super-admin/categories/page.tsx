import Link from "next/link";

import { getAuthSession } from "@/auth";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { categories } from "@/db/schema";
import { Locale, t } from "@/lib/i18n";
import { db } from "@/lib/db";
import { desc } from "drizzle-orm";

import {
  createCategoryAction,
  deleteCategoryAction,
  updateCategoryAction,
} from "../actions";

export default async function SuperAdminCategoriesPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const session = await getAuthSession();
  const dict = t(locale);

  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return <p className="text-red-700">{dict.roleDenied}</p>;
  }

  const allCategories = await db
    .select({ id: categories.id, name: categories.name, description: categories.description })
    .from(categories)
    .orderBy(desc(categories.createdAt));

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-3xl font-bold text-amber-950">{locale === "fr" ? "Espace catégories" : "إدارة الفئات"}</h1>
        <Link href={`/${locale}/super-admin`}>
          <Button variant="secondary">{locale === "fr" ? "Retour dashboard" : "العودة للوحة"}</Button>
        </Link>
      </div>

      <Card>
        <CardTitle>{locale === "fr" ? "Créer une catégorie" : "إنشاء فئة"}</CardTitle>
        <form action={createCategoryAction} className="mt-4 space-y-2">
          <input type="hidden" name="locale" value={locale} />
          <input
            name="name"
            placeholder={locale === "fr" ? "Nom catégorie" : "اسم الفئة"}
            required
            className="w-full rounded-md border border-amber-300 px-3 py-2"
          />
          <textarea
            name="description"
            placeholder={locale === "fr" ? "Description" : "الوصف"}
            className="w-full rounded-md border border-amber-300 px-3 py-2"
          />
          <button className="rounded-md bg-amber-700 px-4 py-2 text-sm font-semibold text-white" type="submit">
            {locale === "fr" ? "Ajouter" : "إضافة"}
          </button>
        </form>
      </Card>

      <Card>
        <CardTitle>{locale === "fr" ? "Gérer catégories" : "إدارة الفئات"}</CardTitle>
        <div className="mt-4 space-y-3">
          {allCategories.map((category) => (
            <form key={category.id} action={updateCategoryAction} className="space-y-2 rounded-md border border-amber-200 p-3">
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="id" value={category.id} />
              <input
                name="name"
                defaultValue={category.name}
                className="w-full rounded-md border border-amber-300 px-3 py-2"
              />
              <textarea
                name="description"
                defaultValue={category.description ?? ""}
                className="w-full rounded-md border border-amber-300 px-3 py-2"
              />
              <div className="flex gap-2">
                <button className="rounded-md bg-amber-700 px-3 py-2 text-sm text-white" type="submit">
                  {locale === "fr" ? "Mettre à jour" : "تحديث"}
                </button>
                <button
                  formAction={deleteCategoryAction}
                  className="rounded-md border border-red-300 px-3 py-2 text-sm text-red-700"
                  type="submit"
                >
                  {locale === "fr" ? "Supprimer" : "حذف"}
                </button>
              </div>
            </form>
          ))}
        </div>
      </Card>
    </section>
  );
}
