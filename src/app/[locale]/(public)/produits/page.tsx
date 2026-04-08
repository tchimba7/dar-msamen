/* eslint-disable @next/next/no-img-element */

import { desc, eq } from "drizzle-orm";
import Link from "next/link";

import { getAuthSession } from "@/auth";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { getActiveDeliveryOptions } from "@/lib/delivery-data";
import { formatProductPriceLine } from "@/lib/product-pricing";
import { APP_ROLES } from "@/lib/roles";
import { Locale } from "@/lib/i18n";

type ProductsPageProps = {
  params: Promise<{ locale: Locale }>;
};

export default async function ProductsPage({ params }: ProductsPageProps) {
  const { locale } = await params;
  const [session, { db }, { products }, { slots, zones }] = await Promise.all([
    getAuthSession(),
    import("@/lib/db"),
    import("@/db/schema"),
    getActiveDeliveryOptions(),
  ]);
  const role = session?.user?.role;
  const canAddToCart = !session?.user || role === APP_ROLES.CLIENT;
  const isClientAuthenticated = Boolean(session?.user && role === APP_ROLES.CLIENT);

  const catalog = await db
    .select({
      id: products.id,
      slug: products.slug,
      name: products.name,
      shortDescription: products.shortDescription,
      shortDescriptionAr: products.shortDescriptionAr,
      description: products.description,
      descriptionAr: products.descriptionAr,
      imageUrl: products.imageUrl,
      price: products.price,
      saleMode: products.saleMode,
      pricePerPiece: products.pricePerPiece,
      pricePerKg: products.pricePerKg,
      isNew: products.isNew,
    })
    .from(products)
    .where(eq(products.isActive, true))
    .orderBy(desc(products.createdAt));

  return (
    <section className="space-y-8">
      <div className="page-hero ambient-dot-grid p-6 md:p-8">
        <div className="relative grid gap-6 lg:grid-cols-[1.05fr,0.95fr] lg:items-end">
          <div>
            <p className="section-kicker">{locale === "fr" ? "Collection marchande" : "تشكيلة قابلة للبيع"}</p>
            <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight text-amber-950 md:text-5xl">
              {locale === "fr" ? "Nos produits frais du jour, prêts à être commandés" : "منتجاتنا الطازجة لليوم، جاهزة للطلب"}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-amber-950/76 md:text-base">
              {locale === "fr"
                ? "Préparés chaque matin avec soin, disponibles en livraison rapide avec paiement à la réception."
                : "تُحضّر يومياً بعناية، متوفرة للتوصيل السريع مع الدفع عند الاستلام."}
            </p>
          </div>
          <div className="hero-visual premium-outline px-6 py-6">
            <div className="relative z-10 grid gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-800/76">
                {locale === "fr" ? "Lecture rapide" : "قراءة سريعة"}
              </p>
              <p className="text-xl font-semibold leading-relaxed text-amber-950">
                {locale === "fr"
                  ? "Des cartes plus claires, une information mieux hiérarchisée et un bouton d’action plus évident."
                  : "بطاقات أوضح ومعلومة أكثر ترتيباً وزر شراء أكثر بروزاً."}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <Card className="editorial-panel premium-outline p-4">
            <CardTitle className="text-base">{locale === "fr" ? "Paiement à la livraison" : "الدفع عند الاستلام"}</CardTitle>
            <CardDescription>{catalog.length}</CardDescription>
          </Card>
          <Card className="editorial-panel premium-outline p-4">
            <CardTitle className="text-base">{locale === "fr" ? "Confirmation via WhatsApp" : "تأكيد عبر واتساب"}</CardTitle>
            <CardDescription>{locale === "fr" ? "Suivi simple après validation" : "متابعة سهلة بعد التأكيد"}</CardDescription>
          </Card>
          <Card className="editorial-panel premium-outline p-4">
            <CardTitle className="text-base">{locale === "fr" ? "Livraison selon votre zone" : "توصيل حسب المنطقة"}</CardTitle>
            <CardDescription>{locale === "fr" ? "Zone et disponibilité visibles" : "المنطقة والتوفر واضحان"}</CardDescription>
          </Card>
        </div>

        <div className="editorial-panel premium-outline mt-6 p-5 text-sm text-amber-900">
          <p className="font-semibold text-amber-950">
            {locale === "fr" ? "Angle commercial" : "الزاوية التجارية"}
          </p>
          <p className="mt-2 text-amber-900/78">
            {locale === "fr"
              ? `${zones.length} zones actives, ${slots.length} créneaux configurés et confirmation WhatsApp après validation du panier. Le ton est plus rassurant, le cadrage plus pro et la lecture plus vendeuse.`
              : `${zones.length} مناطق نشطة و${slots.length} نوافذ زمنية مهيأة مع تأكيد واتساب بعد التحقق من السلة. النبرة الآن أكثر طمأنة والقراءة أكثر احترافية وبيعية.`}
          </p>
        </div>

        {isClientAuthenticated ? (
          <Link
            href={`/${locale}/panier`}
            className="mt-5 inline-flex rounded-xl border border-[rgba(160,98,37,0.16)] bg-white/88 px-4 py-2.5 text-sm font-semibold text-amber-950 shadow-[0_10px_22px_rgba(94,45,16,0.05)]"
          >
            {locale === "fr" ? "Voir panier" : "عرض السلة"}
          </Link>
        ) : null}
      </div>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="editorial-panel premium-outline p-5">
          <CardTitle className="text-base">{locale === "fr" ? "Visibilité produit" : "وضوح المنتج"}</CardTitle>
          <CardDescription className="mt-2">
            {locale === "fr"
              ? "Nom, prix, promesse et action sont visibles sans effort."
              : "الاسم والسعر والوعد وزر الإجراء تظهر بدون تعقيد."}
          </CardDescription>
        </Card>
        <Card className="editorial-panel premium-outline p-5">
          <CardTitle className="text-base">{locale === "fr" ? "Confiance COD" : "ثقة الدفع عند الاستلام"}</CardTitle>
          <CardDescription className="mt-2">
            {locale === "fr"
              ? "Le tunnel rappelle la zone, les frais, le créneau et la confirmation."
              : "المسار يذكر المنطقة والرسوم والنافذة الزمنية والتأكيد."}
          </CardDescription>
        </Card>
        <Card className="editorial-panel premium-outline p-5">
          <CardTitle className="text-base">{locale === "fr" ? "Conversion mobile" : "التحويل على الهاتف"}</CardTitle>
          <CardDescription className="mt-2">
            {locale === "fr"
              ? "Les cartes restent lisibles sur mobile, tablette et desktop."
              : "البطاقات تبقى واضحة على الهاتف واللوحي وسطح المكتب."}
          </CardDescription>
        </Card>
      </section>

      <div className="grid items-start gap-5 md:grid-cols-2">
        {catalog.map((product, index) => (
          <Card
            key={product.id}
            className="editorial-panel premium-outline product-card-animate overflow-hidden rounded-[1.8rem] border-[rgba(160,98,37,0.14)] bg-white/94 p-0"
            style={{ animationDelay: `${Math.min(index * 70, 420)}ms` }}
          >
            <div className="grid gap-0 md:grid-cols-[220px,1fr]">
              <div className="product-shot h-full overflow-hidden bg-[linear-gradient(160deg,#f8ecd8_0%,#fffaf4_100%)]">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="h-56 w-full object-cover transition duration-300 ease-out hover:scale-[1.03] md:h-full"
                  />
                ) : (
                  <div className="flex h-56 items-center justify-center text-xs text-amber-700 md:h-full">
                    {locale === "fr" ? "Image produit" : "صورة المنتج"}
                  </div>
                )}
              </div>

              <div className="space-y-4 p-5 md:p-6">
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">
                  <span>{locale === "fr" ? "🔥 Préparé aujourd’hui" : "🔥 محضر اليوم"}</span>
                  <span>{locale === "fr" ? "Commande COD" : "طلب عند الاستلام"}</span>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="text-xl">{product.name}</CardTitle>
                  {product.isNew ? (
                    <span className="rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-900">
                      {locale === "fr" ? "Nouveau" : "جديد"}
                    </span>
                  ) : null}
                </div>
                <CardDescription className="line-clamp-3 leading-relaxed">
                  {(locale === "ar" ? product.shortDescriptionAr : product.shortDescription) ??
                    (locale === "ar" ? product.descriptionAr : product.description) ??
                    product.shortDescription ??
                    product.description ??
                    (locale === "fr" ? "Recette artisanale, fraiche et savoureuse." : "وصفة تقليدية طازجة ولذيذة.")}
                </CardDescription>
                <div className="rounded-2xl border border-[rgba(160,98,37,0.12)] bg-[rgba(255,248,238,0.9)] px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
                    {locale === "fr" ? "Tarification" : "التسعير"}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-amber-950">
                    {formatProductPriceLine(product, locale)}
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
                    layout="compact"
                  />
                ) : null}

                <Link
                  href={`/${locale}/produits/${product.slug}`}
                  className="inline-flex text-sm font-semibold text-amber-900 underline"
                >
                  {locale === "fr" ? "Voir tous les détails" : "عرض التفاصيل الكاملة"}
                </Link>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
