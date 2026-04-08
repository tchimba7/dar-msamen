import Link from "next/link";

import { getAuthSession } from "@/auth";
import { ImageUploadField } from "@/components/products/image-upload-field";
import { SaleModePriceFields } from "@/components/products/sale-mode-price-fields";
import { QueryFlashMessage } from "@/components/ui/query-flash-message";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { categories, products } from "@/db/schema";
import { Locale, t } from "@/lib/i18n";
import { db } from "@/lib/db";
import { desc } from "drizzle-orm";

import {
  createProductAction,
  deleteProductAction,
  updateProductAction,
} from "../actions";

export default async function SuperAdminProductsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { locale } = await params;
  const { error } = await searchParams;
  const session = await getAuthSession();
  const dict = t(locale);

  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return <p className="text-red-700">{dict.roleDenied}</p>;
  }

  const [allCategories, allProducts] = await Promise.all([
    db
      .select({ id: categories.id, name: categories.name })
      .from(categories)
      .orderBy(desc(categories.createdAt)),
    db
      .select({
        id: products.id,
        name: products.name,
        shortDescription: products.shortDescription,
        saleMode: products.saleMode,
        pricePerPiece: products.pricePerPiece,
        pricePerKg: products.pricePerKg,
        description: products.description,
        rawMaterials: products.rawMaterials,
        imageGallery: products.imageGallery,
        nutritionFacts: products.nutritionFacts,
        recommendations: products.recommendations,
        imageUrl: products.imageUrl,
        isActive: products.isActive,
        categoryId: products.categoryId,
      })
      .from(products)
      .orderBy(desc(products.createdAt)),
  ]);

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-3xl font-bold text-amber-950">{locale === "fr" ? "Espace produits" : "إدارة المنتجات"}</h1>
        <Link href={`/${locale}/super-admin`}>
          <Button variant="secondary">{locale === "fr" ? "Retour dashboard" : "العودة للوحة"}</Button>
        </Link>
      </div>

      {error === "image_format" ? (
        <QueryFlashMessage
          clearParams={["error"]}
          className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700"
          message={
            locale === "fr"
              ? "Format image non supporte. Utilisez JPG, PNG, WEBP ou GIF."
              : "صيغة الصورة غير مدعومة. استعمل JPG او PNG او WEBP او GIF."
          }
        />
      ) : null}

      {error === "pricing" ? (
        <QueryFlashMessage
          clearParams={["error"]}
          className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700"
          message={
            locale === "fr"
              ? "Prix invalide. Renseignez le prix selon le mode de vente choisi."
              : "السعر غير صالح. ادخل السعر حسب نوع البيع المختار."
          }
        />
      ) : null}

      <Card>
        <CardTitle>{locale === "fr" ? "Créer un produit" : "إنشاء منتج"}</CardTitle>
        <form action={createProductAction} className="mt-4 space-y-2">
          <input type="hidden" name="locale" value={locale} />
          <input
            name="name"
            placeholder={locale === "fr" ? "Nom produit" : "اسم المنتج"}
            required
            className="w-full rounded-md border border-amber-300 px-3 py-2"
          />
          <SaleModePriceFields locale={locale} defaultSaleMode="PIECE" />
          <textarea
            name="shortDescription"
            placeholder={locale === "fr" ? "Description courte (optionnel)" : "وصف قصير (اختياري)"}
            className="w-full rounded-md border border-amber-300 px-3 py-2"
          />
          <textarea
            name="description"
            placeholder={locale === "fr" ? "Description" : "الوصف"}
            className="w-full rounded-md border border-amber-300 px-3 py-2"
          />
          <textarea
            name="rawMaterials"
            placeholder={
              locale === "fr"
                ? "Matieres premieres (optionnel): une ligne par element. Exemple: Farine|500g"
                : "المواد الأولية (اختياري): سطر لكل عنصر. مثال: دقيق|500غ"
            }
            className="w-full rounded-md border border-amber-300 px-3 py-2"
          />
          <textarea
            name="nutritionFacts"
            placeholder={
              locale === "fr"
                ? "Nutrition (optionnel): une ligne par element. Exemple: Energie|208 Kcal"
                : "القيم الغذائية (اختياري): سطر لكل عنصر. مثال: طاقة|208 Kcal"
            }
            className="w-full rounded-md border border-amber-300 px-3 py-2"
          />
          <textarea
            name="recommendations"
            placeholder={
              locale === "fr"
                ? "Recommandations (optionnel): une ligne par conseil"
                : "التوصيات (اختياري): سطر لكل نصيحة"
            }
            className="w-full rounded-md border border-amber-300 px-3 py-2"
          />
          <ImageUploadField locale={locale} />
          <select name="categoryId" className="w-full rounded-md border border-amber-300 px-3 py-2">
            <option value="">{locale === "fr" ? "Sans catégorie" : "بدون فئة"}</option>
            {allCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm text-amber-900">
            <input type="checkbox" name="isNew" defaultChecked />
            {locale === "fr" ? "Marquer comme nouveau" : "تمييز كمنتج جديد"}
          </label>
          <button className="rounded-md bg-amber-700 px-4 py-2 text-sm font-semibold text-white" type="submit">
            {locale === "fr" ? "Ajouter" : "إضافة"}
          </button>
        </form>
      </Card>

      <Card>
        <CardTitle>{locale === "fr" ? "Gérer produits" : "إدارة المنتجات"}</CardTitle>
        <div className="mt-4 space-y-3">
          {allProducts.map((product) => (
            <form key={product.id} action={updateProductAction} className="space-y-2 rounded-md border border-amber-200 p-3">
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="id" value={product.id} />
              <input
                name="name"
                defaultValue={product.name}
                className="w-full rounded-md border border-amber-300 px-3 py-2"
              />
              <SaleModePriceFields
                locale={locale}
                defaultSaleMode={product.saleMode}
                defaultPricePerPiece={product.pricePerPiece ? Number(product.pricePerPiece) : ""}
                defaultPricePerKg={product.pricePerKg ? Number(product.pricePerKg) : ""}
              />
              <textarea
                name="shortDescription"
                defaultValue={product.shortDescription ?? ""}
                placeholder={locale === "fr" ? "Description courte (optionnel)" : "وصف قصير (اختياري)"}
                className="w-full rounded-md border border-amber-300 px-3 py-2"
              />
              <textarea
                name="description"
                defaultValue={product.description ?? ""}
                className="w-full rounded-md border border-amber-300 px-3 py-2"
              />
              <textarea
                name="rawMaterials"
                defaultValue={product.rawMaterials ?? ""}
                placeholder={
                  locale === "fr"
                    ? "Matieres premieres (optionnel): une ligne par element. Exemple: Farine|500g"
                    : "المواد الأولية (اختياري): سطر لكل عنصر. مثال: دقيق|500غ"
                }
                className="w-full rounded-md border border-amber-300 px-3 py-2"
              />
              <textarea
                name="nutritionFacts"
                defaultValue={product.nutritionFacts ?? ""}
                placeholder={
                  locale === "fr"
                    ? "Nutrition (optionnel): une ligne par element. Exemple: Energie|208 Kcal"
                    : "القيم الغذائية (اختياري): سطر لكل عنصر. مثال: طاقة|208 Kcal"
                }
                className="w-full rounded-md border border-amber-300 px-3 py-2"
              />
              <textarea
                name="recommendations"
                defaultValue={product.recommendations ?? ""}
                placeholder={
                  locale === "fr"
                    ? "Recommandations (optionnel): une ligne par conseil"
                    : "التوصيات (اختياري): سطر لكل نصيحة"
                }
                className="w-full rounded-md border border-amber-300 px-3 py-2"
              />
              <ImageUploadField
                locale={locale}
                existingImageUrl={product.imageUrl ?? undefined}
                existingImageGallery={product.imageGallery ?? undefined}
              />
              <select
                name="categoryId"
                defaultValue={product.categoryId ?? ""}
                className="w-full rounded-md border border-amber-300 px-3 py-2"
              >
                <option value="">{locale === "fr" ? "Sans catégorie" : "بدون فئة"}</option>
                {allCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <label className="flex items-center gap-2 text-sm text-amber-900">
                <input type="checkbox" name="isActive" defaultChecked={product.isActive} />
                {locale === "fr" ? "Produit actif" : "منتج نشط"}
              </label>
              <div className="flex gap-2">
                <button className="rounded-md bg-amber-700 px-3 py-2 text-sm text-white" type="submit">
                  {locale === "fr" ? "Mettre à jour" : "تحديث"}
                </button>
                <button
                  formAction={deleteProductAction}
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
