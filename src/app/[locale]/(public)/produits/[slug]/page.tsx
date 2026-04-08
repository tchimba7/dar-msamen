import Link from "next/link";

import { desc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { getAuthSession } from "@/auth";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { ProductImageGallery } from "@/components/products/product-image-gallery";
import { QueryFlashMessage } from "@/components/ui/query-flash-message";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Locale } from "@/lib/i18n";
import { formatProductPriceLine } from "@/lib/product-pricing";
import { APP_ROLES } from "@/lib/roles";
import { createProductReviewAction } from "./actions";

function parseRawMaterials(rawValue: string | null | undefined) {
  if (!rawValue) {
    return [] as Array<{ label: string; value: string }>;
  }

  return rawValue
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [label, ...rest] = line.split("|");
      return {
        label: (label ?? "").trim(),
        value: rest.join("|").trim(),
      };
    })
    .filter((row) => row.label.length > 0);
}

function pickLocalizedValue(
  locale: Locale,
  frenchValue: string | null | undefined,
  arabicValue: string | null | undefined,
) {
  return locale === "ar" ? arabicValue ?? frenchValue : frenchValue;
}

function parseNutritionFacts(
  rawValue: string | null | undefined,
  locale: Locale,
): Array<{ label: string; value: string }> {
  if (!rawValue) {
    return locale === "fr"
      ? [
          { label: "Valeur energetique", value: "208 Kcal" },
          { label: "Proteines", value: "5 g" },
          { label: "Lipides", value: "8 g" },
          { label: "Glucides", value: "28 g" },
        ]
      : [
          { label: "الطاقة", value: "208 Kcal" },
          { label: "البروتين", value: "5 g" },
          { label: "الدهون", value: "8 g" },
          { label: "الكربوهيدرات", value: "28 g" },
        ];
  }

  const parsed = rawValue
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [label, ...rest] = line.split("|");
      return {
        label: (label ?? "").trim(),
        value: rest.join("|").trim(),
      };
    })
    .filter((row) => row.label.length > 0);

  return parsed.length > 0 ? parsed : parseNutritionFacts(null, locale);
}

function parseGallery(primaryImage: string | null | undefined, rawGallery: string | null | undefined) {
  const fromRaw = (rawGallery ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (primaryImage) {
    return [primaryImage, ...fromRaw.filter((item) => item !== primaryImage)];
  }

  return fromRaw;
}

function parseRecommendations(rawValue: string | null | undefined, locale: Locale): string[] {
  if (!rawValue) {
    return locale === "fr"
      ? [
          "A deguster chaud avec miel, fromage ou amlou.",
          "Ideal pour petit-dejeuner, brunch et pause de l'apres-midi.",
          "Conservation au frais, rechauffage 2-3 min avant service.",
        ]
      : [
          "يفضل تقديمه ساخنا مع العسل او الجبن او املو.",
          "مناسب للفطور والبرنش ووجبة خفيفة بعد الظهر.",
          "يحفظ في البراد ويعاد تسخينه 2-3 دقائق قبل التقديم.",
        ];
  }

  const parsed = rawValue
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return parsed.length > 0 ? parsed : parseRecommendations(null, locale);
}

export default async function ProductDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
  searchParams: Promise<{ review?: string }>;
}) {
  const { locale, slug } = await params;
  const { review } = await searchParams;
  const session = await getAuthSession();
  const role = session?.user?.role;
  const canAddToCart = !session?.user || role === APP_ROLES.CLIENT;
  const isClientAuthenticated = Boolean(session?.user && role === APP_ROLES.CLIENT);

  const [{ db }, { productReviews, products }] = await Promise.all([
    import("@/lib/db"),
    import("@/db/schema"),
  ]);

  const product = await db.query.products.findFirst({
    where: eq(products.slug, slug),
  });

  if (!product || !product.isActive) {
    notFound();
  }

  const reviews = await db
    .select({
      id: productReviews.id,
      reviewerName: productReviews.reviewerName,
      rating: productReviews.rating,
      comment: productReviews.comment,
      createdAt: productReviews.createdAt,
    })
    .from(productReviews)
    .where(eq(productReviews.productId, product.id))
    .orderBy(desc(productReviews.createdAt));

  const averageRating =
    reviews.length > 0
      ? reviews.reduce((acc, item) => acc + item.rating, 0) / reviews.length
      : 5;

  const localizedShortDescription = pickLocalizedValue(
    locale,
    product.shortDescription,
    product.shortDescriptionAr,
  );
  const localizedDescription = pickLocalizedValue(locale, product.description, product.descriptionAr);
  const localizedRawMaterials = pickLocalizedValue(locale, product.rawMaterials, product.rawMaterialsAr);
  const localizedNutritionFacts = pickLocalizedValue(
    locale,
    product.nutritionFacts,
    product.nutritionFactsAr,
  );
  const localizedRecommendations = pickLocalizedValue(
    locale,
    product.recommendations,
    product.recommendationsAr,
  );

  const rawMaterials = parseRawMaterials(localizedRawMaterials);
  const nutritionRows = parseNutritionFacts(localizedNutritionFacts, locale);
  const galleryImages = parseGallery(product.imageUrl, product.imageGallery);

  const recommendations = parseRecommendations(localizedRecommendations, locale);

  return (
    <section className="space-y-6">
      <Link href={`/${locale}/produits`} className="inline-flex text-sm font-semibold text-amber-800 underline">
        {locale === "fr" ? "Retour catalogue" : "العودة للكتالوج"}
      </Link>

      <Card className="editorial-panel premium-outline grid gap-6 rounded-3xl border-amber-200 bg-[linear-gradient(135deg,#ffffff_0%,#fffaf0_100%)] p-4 md:grid-cols-[1.08fr,0.92fr] md:p-6">
        <div>
          <ProductImageGallery images={galleryImages} productName={product.name} />
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-700">
              {locale === "fr" ? "🔥 Préparé aujourd’hui" : "🔥 محضر اليوم"}
            </p>
            <CardTitle className="text-3xl leading-tight md:text-4xl">{product.name}</CardTitle>
          </div>
          <CardDescription className="leading-relaxed text-amber-900/80">
            {locale === "fr"
              ? "Préparé chaque matin avec des ingrédients simples et authentiques, pour un goût marocain traditionnel et une texture parfaite."
              : "يُحضّر يومياً بمكونات بسيطة وأصيلة، ليقدم طعماً مغربياً تقليدياً وقواماً مثالياً."}
          </CardDescription>

          <p className="rounded-xl border border-amber-200 bg-white px-3 py-2 text-base font-semibold text-amber-900 shadow-[0_10px_20px_rgba(94,45,16,0.05)]">
            {formatProductPriceLine(product, locale)}
          </p>

          <div className="grid gap-2 text-sm text-amber-900 md:grid-cols-2">
            <p className="rounded-lg border border-amber-200 bg-white px-3 py-2 shadow-[0_10px_20px_rgba(94,45,16,0.04)]">
              {locale === "fr" ? "Préparation du jour" : "تحضير اليوم"}
            </p>
            <p className="rounded-lg border border-amber-200 bg-white px-3 py-2 shadow-[0_10px_20px_rgba(94,45,16,0.04)]">
              {locale === "fr" ? "Commande claire" : "طلب واضح"}
            </p>
            <p className="rounded-lg border border-amber-200 bg-white px-3 py-2 shadow-[0_10px_20px_rgba(94,45,16,0.04)]">
              {locale === "fr" ? "Lecture premium" : "قراءة احترافية"}
            </p>
            <p className="rounded-lg border border-amber-200 bg-white px-3 py-2 shadow-[0_10px_20px_rgba(94,45,16,0.04)]">
              {locale === "fr" ? "Livraison COD" : "الدفع عند الاستلام"}
            </p>
          </div>

          {canAddToCart ? (
            <AddToCartButton
              productId={product.id}
              name={product.name}
              saleMode={product.saleMode}
              pricePerPiece={product.pricePerPiece ? Number(product.pricePerPiece) : null}
              pricePerKg={product.pricePerKg ? Number(product.pricePerKg) : null}
              fallbackPrice={Number(product.price)}
              locale={locale}
              isClientAuthenticated={isClientAuthenticated}
              layout="full"
            />
          ) : (
            <p className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              {locale === "fr"
                ? "Connectez-vous en compte client pour commander."
                : "سجل الدخول بحساب زبون للطلب."}
            </p>
          )}

          {localizedDescription ? (
            <div className="rounded-xl border border-amber-200 bg-white px-3 py-3 shadow-[0_10px_20px_rgba(94,45,16,0.04)]">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                {locale === "fr" ? "Description" : "الوصف"}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-amber-900/85">{localizedDescription}</p>
            </div>
          ) : null}

          {rawMaterials.length > 0 ? (
            <div className="rounded-xl border border-amber-200 bg-white px-3 py-3 shadow-[0_10px_20px_rgba(94,45,16,0.04)]">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-700">
                {locale === "fr" ? "Matieres premieres" : "المواد الأولية"}
              </p>
              <div className="overflow-hidden rounded-lg border border-amber-200">
                <table className="w-full border-collapse text-sm">
                  <tbody>
                    {rawMaterials.map((row) => (
                      <tr key={`${row.label}-${row.value}`} className="odd:bg-amber-50/50">
                        <td className="border-b border-amber-200 px-3 py-2 font-semibold text-amber-900">
                          {row.label}
                        </td>
                        <td className="border-b border-amber-200 px-3 py-2 text-amber-800">
                          {row.value || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-[1.15fr,0.85fr]">
        <Card className="editorial-panel premium-outline rounded-2xl border-amber-200 bg-white">
          <CardTitle className="text-xl">
            {locale === "fr" ? "Avis clients" : "آراء العملاء"}
          </CardTitle>
          <div className="mt-3 flex items-end gap-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3">
            <p className="text-2xl font-bold text-amber-950">{averageRating.toFixed(1)}</p>
            <div>
              <p className="text-sm font-semibold tracking-wide text-amber-900">★★★★★</p>
              <p className="text-xs text-amber-700">
                {locale === "fr"
                  ? `Base sur ${reviews.length} avis`
                  : `بناء على ${reviews.length} تقييم`}
              </p>
            </div>
          </div>

          {reviews.length > 0 ? (
            <div className="mt-3 space-y-2">
              {reviews.slice(0, 3).map((item) => (
                <blockquote
                  key={item.id}
                  className="rounded-xl border border-amber-200 bg-white px-3 py-3 text-sm leading-relaxed text-amber-900 shadow-[0_10px_20px_rgba(94,45,16,0.04)]"
                >
                  <p className="mb-1 text-xs font-semibold text-amber-700">
                    {"★".repeat(item.rating)} <span className="ml-1">{item.reviewerName}</span>
                  </p>
                  <p>“{item.comment}”</p>
                </blockquote>
              ))}
            </div>
          ) : (
            <blockquote className="mt-3 rounded-xl border border-amber-200 bg-white px-3 py-3 text-sm leading-relaxed text-amber-900 shadow-[0_10px_20px_rgba(94,45,16,0.04)]">
              “
              {localizedShortDescription ??
                (locale === "fr"
                  ? "Produit excellent, texture parfaite et gout authentique."
                  : "منتج ممتاز، قوام رائع ومذاق أصيل.")}
              ”
            </blockquote>
          )}

          <form action={createProductReviewAction} className="mt-3 space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="slug" value={slug} />
            <input type="hidden" name="productId" value={product.id} />
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
              {locale === "fr" ? "Ecrire un avis" : "اكتب تقييما"}
            </p>
            <input
              name="reviewerName"
              required
              placeholder={locale === "fr" ? "Votre nom" : "الاسم"}
              className="w-full rounded-md border border-amber-300 bg-white px-3 py-2 text-sm"
            />
            <select name="rating" defaultValue="5" className="w-full rounded-md border border-amber-300 bg-white px-3 py-2 text-sm">
              <option value="5">5/5</option>
              <option value="4">4/5</option>
              <option value="3">3/5</option>
              <option value="2">2/5</option>
              <option value="1">1/5</option>
            </select>
            <textarea
              name="comment"
              required
              placeholder={locale === "fr" ? "Votre commentaire" : "تعليقك"}
              className="w-full rounded-md border border-amber-300 bg-white px-3 py-2 text-sm"
            />
            {review === "ok" ? (
              <QueryFlashMessage
                clearParams={["review"]}
                className="text-xs text-green-700"
                message={locale === "fr" ? "Avis envoye avec succes." : "تم ارسال التقييم بنجاح."}
              />
            ) : null}
            {review === "invalid" ? (
              <QueryFlashMessage
                clearParams={["review"]}
                className="text-xs text-red-700"
                message={locale === "fr" ? "Formulaire invalide." : "بيانات التقييم غير صالحة."}
              />
            ) : null}
            <button className="rounded-md bg-amber-800 px-4 py-2 text-sm font-semibold text-white" type="submit">
              {locale === "fr" ? "Publier" : "نشر"}
            </button>
          </form>
        </Card>

        <Card className="editorial-panel premium-outline rounded-2xl border-amber-200 bg-white">
          <CardTitle className="text-xl">
            {locale === "fr" ? "Recommandations" : "توصيات"}
          </CardTitle>
          <ul className="mt-3 space-y-2 text-sm text-amber-900">
            {recommendations.map((item) => (
              <li key={item} className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 shadow-[0_10px_20px_rgba(94,45,16,0.04)]">
                {item}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="editorial-panel premium-outline rounded-2xl border-amber-200 bg-white">
        <CardTitle className="text-xl">
          {locale === "fr" ? "Valeur nutritionnelle indicative" : "القيمة الغذائية التقريبية"}
        </CardTitle>
        <p className="mt-1 text-xs text-amber-700">
          {locale === "fr" ? "Pour une portion moyenne" : "لكل حصة متوسطة"}
        </p>
        <div className="mt-3 overflow-hidden rounded-xl border border-amber-200">
          <table className="w-full border-collapse text-sm">
            <tbody>
              {nutritionRows.map((row) => (
                <tr key={row.label} className="odd:bg-amber-50/50">
                  <td className="border-b border-amber-200 px-3 py-2 font-semibold text-amber-900">
                    {row.label}
                  </td>
                  <td className="border-b border-amber-200 px-3 py-2 text-amber-800">{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <section className="cta-banner premium-outline px-6 py-8 sm:px-8">
        <div className="relative z-10 grid gap-5 lg:grid-cols-[1fr,auto] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-100/76">
              {locale === "fr" ? "Commande rapide" : "طلب سريع"}
            </p>
            <h2 className="mt-3 font-display text-3xl font-semibold text-white">
              {locale === "fr"
                ? "Ajoutez ce produit à votre panier et finalisez votre commande en COD"
                : "أضف هذا المنتج إلى سلتك وأكمل الطلب بالدفع عند الاستلام"}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-amber-50/84">
              {locale === "fr"
                ? "Zone, frais, créneau et confirmation WhatsApp restent visibles jusqu’à la validation."
                : "المنطقة والرسوم والنافذة الزمنية وتأكيد واتساب تبقى واضحة حتى إتمام الطلب."}
            </p>
          </div>
          <Link
            href={`/${locale}/panier`}
            className="inline-flex rounded-xl bg-white px-5 py-3 text-sm font-semibold text-amber-950 shadow-[0_18px_30px_rgba(255,255,255,0.14)]"
          >
            {locale === "fr" ? "Voir le panier" : "عرض السلة"}
          </Link>
        </div>
      </section>
    </section>
  );
}
