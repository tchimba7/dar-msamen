/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { desc, eq } from "drizzle-orm";

import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { getActiveDeliveryOptions } from "@/lib/delivery-data";
import { Locale, t } from "@/lib/i18n";
import { formatProductPriceLine } from "@/lib/product-pricing";

type PublicHomeProps = {
  params: Promise<{ locale: Locale }>;
};

const featuredProducts = [
  { id: "msamen", fr: "Msamen au beurre", ar: "مسمن بالزبدة" },
  { id: "harcha", fr: "Harcha semoule fine", ar: "حرشة سميد رقيق" },
  { id: "malwi", fr: "Malwi feuilleté", ar: "ملوي مورق" },
  { id: "batbot", fr: "Batbot maison", ar: "بطبوط منزلي" },
];

const promisePoints = {
  fr: [
    "Une sélection courte et maîtrisée pour garantir qualité, fraîcheur et simplicité de commande.",
  ],
  ar: [
    "مجموعة مختارة بعناية لضمان الجودة والطراوة وسهولة الطلب.",
  ],
} as const;

const stats = {
  fr: ["Préparé chaque matin", "Livraison locale rapide", "Paiement à la réception"],
  ar: ["تحضير يومي طازج", "توصيل محلي سريع", "الدفع عند الاستلام"],
} as const;

const journeySteps = {
  fr: [
    "Choisissez vos produits",
    "Confirmez votre commande",
    "Recevez et payez à la livraison",
  ],
  ar: [
    "اختر المنتجات",
    "أكد الطلب",
    "توصل وخلص عند الاستلام",
  ],
} as const;

const testimonials = {
  fr: [
    {
      name: "Salma, Casablanca",
      text: "Le site inspire confiance, la commande est claire et les produits arrivent avec un vrai soin maison.",
    },
    {
      name: "Yassine, Rabat",
      text: "Enfin un parcours simple pour commander du msemen artisanal sans confusion sur les frais ou la livraison.",
    },
    {
      name: "Nadia, Temara",
      text: "Le rendu fait sérieux, le WhatsApp rassure et la qualité produit donne envie de recommander.",
    },
  ],
  ar: [
    {
      name: "سلمى، الدار البيضاء",
      text: "الموقع يمنح الثقة والطلب واضح والمنتجات تصل بعناية منزلية حقيقية.",
    },
    {
      name: "ياسين، الرباط",
      text: "أخيراً مسار بسيط لطلب المسمن التقليدي بدون غموض في الرسوم أو التوصيل.",
    },
    {
      name: "نادية، تمارة",
      text: "الواجهة احترافية وتأكيد واتساب مطمئن وجودة المنتج تشجع على الطلب من جديد.",
    },
  ],
} as const;

export default async function PublicHome({ params }: PublicHomeProps) {
  const { locale } = await params;
  const dict = t(locale);

  const [{ db }, { products }, { slots, zones }] = await Promise.all([
    import("@/lib/db"),
    import("@/db/schema"),
    getActiveDeliveryOptions(),
  ]);

  const latestProducts = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      shortDescription: products.shortDescription,
      shortDescriptionAr: products.shortDescriptionAr,
      description: products.description,
      descriptionAr: products.descriptionAr,
      imageUrl: products.imageUrl,
      price: products.price,
      saleMode: products.saleMode,
      pricePerPiece: products.pricePerPiece,
      pricePerKg: products.pricePerKg,
    })
    .from(products)
    .where(eq(products.isActive, true))
    .orderBy(desc(products.createdAt))
    .limit(3);

  return (
    <section className="space-y-12">
      <div className="page-hero ambient-dot-grid p-8 md:p-10">
        <div className="relative grid gap-8 lg:grid-cols-[1.05fr,0.95fr] lg:items-stretch">
          <div>
            <p className="section-kicker">
              {locale === "fr" ? "Maison culinaire marocaine" : "بيت مغربي بطابع احترافي"}
            </p>
            <h1 className="mt-4 font-display text-4xl font-semibold leading-tight text-amber-950 md:text-6xl">
              {dict.heroTitle}
            </h1>
            <p className="mt-4 max-w-2xl text-base text-amber-950/76 md:text-lg">{dict.heroText}</p>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-amber-900/72 md:text-base">
              {locale === "fr"
                ? "Pensé comme une marque qui inspire confiance: offre resserrée, message net, preuve d’exécution et commande sans friction."
                : "تم تصميمه كعلامة تمنح الثقة: عرض واضح ورسالة مباشرة وإثبات جودة ومسار طلب بدون تعقيد."}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={`/${locale}/produits`}
                className="inline-flex rounded-xl bg-[linear-gradient(135deg,#b65a22_0%,#8f3e14_100%)] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_28px_rgba(143,62,20,0.22)]"
              >
                {dict.heroCta}
              </Link>
              <Link
                href={`/${locale}/panier`}
                className="inline-flex rounded-xl border border-[rgba(160,98,37,0.16)] bg-white/88 px-5 py-3 text-sm font-semibold text-amber-950 shadow-[0_12px_24px_rgba(94,45,16,0.06)]"
              >
                {locale === "fr" ? "Commander maintenant" : "اطلب الآن"}
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              {(locale === "fr" ? stats.fr : stats.ar).map((item) => (
                <div
                  key={item}
                  className="value-pill px-4 py-3 text-sm font-semibold text-amber-950"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            <div className="hero-visual premium-outline px-6 py-6 sm:px-7 sm:py-7">
              <div className="relative z-10 grid gap-5">
                <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-800">
                  <span className="value-pill px-3 py-1.5">{locale === "fr" ? "Msemen" : "مسمن"}</span>
                  <span className="value-pill px-3 py-1.5">{locale === "fr" ? "Harcha" : "حرشة"}</span>
                  <span className="value-pill px-3 py-1.5">{locale === "fr" ? "Meloui" : "ملوي"}</span>
                </div>
                <div className="grid gap-4 sm:grid-cols-[1fr,11rem] sm:items-end">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-800/76">
                      {locale === "fr" ? "Signature Dar Msamen" : "بصمة دار المسمن"}
                    </p>
                    <p className="mt-3 max-w-xl text-lg font-semibold leading-relaxed text-amber-950 sm:text-2xl">
                      {locale === "fr"
                        ? "Une sélection courte et maîtrisée pour garantir qualité, fraîcheur et simplicité de commande."
                        : "مجموعة مختارة بعناية لضمان الجودة والطراوة وسهولة الطلب."}
                    </p>
                  </div>
                  <div className="rounded-[1.7rem] border border-white/35 bg-white/40 p-4 shadow-[0_14px_30px_rgba(122,53,17,0.12)] backdrop-blur-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-800">
                      {locale === "fr" ? "À partir de" : "ابتداء من"}
                    </p>
                    <p className="mt-2 font-display text-4xl font-semibold text-amber-950">18 MAD</p>
                    <p className="mt-2 text-sm text-amber-900/72">
                      {locale === "fr" ? "Préparé frais et livré localement" : "محضر طازجاً وموجه للتوصيل المحلي"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="editorial-panel premium-outline p-6">
              <p className="section-kicker">{locale === "fr" ? "Positionnement" : "التموضع"}</p>
              <CardTitle className="mt-3 text-2xl">
                {locale === "fr" ? "Une offre courte, un message fort, une commande crédible" : "عرض مختصر ورسالة قوية وطلب موثوق"}
              </CardTitle>
              <div className="mt-4 space-y-3 text-sm text-amber-900/78">
                {(locale === "fr" ? promisePoints.fr : promisePoints.ar).map((item) => (
                  <p key={item}>{item}</p>
                ))}
              </div>
            </div>
            <div className="editorial-panel-dark premium-outline space-y-4 p-6 text-white">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-100/72">
                    {locale === "fr" ? "Parcours COD" : "مسار الدفع عند الاستلام"}
                  </p>
                  <CardTitle className="mt-2 text-2xl text-white">
                    {locale === "fr" ? "Commandez facilement en 3 étapes" : "اطلب بسهولة في 3 خطوات"}
                  </CardTitle>
                </div>
                <div className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-amber-50/88">
                  {zones.length} {locale === "fr" ? "zones" : "مناطق"}
                </div>
              </div>
              <div className="space-y-2 text-sm text-amber-50/90">
                {(locale === "fr" ? journeySteps.fr : journeySteps.ar).map((item, index) => (
                  <p key={item}>
                    {index + 1}. {item}
                  </p>
                ))}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-100/76">
                    {locale === "fr" ? "Couverture" : "التغطية"}
                  </p>
                  <p className="mt-2 text-xl font-semibold">{zones.length} {locale === "fr" ? "zones actives" : "مناطق نشطة"}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-100/76">
                    {locale === "fr" ? "Promesse" : "الوعد"}
                  </p>
                  <p className="mt-2 text-xl font-semibold">{locale === "fr" ? `${slots.length} créneaux + WhatsApp` : `${slots.length} نوافذ + واتساب`}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="grid gap-4 lg:grid-cols-[0.95fr,1.05fr]">
        <div className="editorial-panel premium-outline p-6">
          <p className="section-kicker">{locale === "fr" ? "Pourquoi choisir Dar Msamen ?" : "لماذا تختار دار المسمن؟"}</p>
          <h2 className="mt-3 font-display text-3xl font-semibold text-amber-950">
            {locale === "fr" ? "Pourquoi choisir Dar Msamen ?" : "لماذا تختار دار المسمن؟"}
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-amber-900/78 md:text-base">
            {locale === "fr"
              ? "Une expérience simple, des produits frais et un service fiable pensé pour vous."
              : "تجربة بسيطة، منتجات طازجة وخدمة موثوقة مصممة لراحتك."}
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {(locale === "fr" ? promisePoints.fr : promisePoints.ar).map((item) => (
            <div key={item} className="warm-stat-card premium-outline p-5">
              <p className="text-sm font-semibold leading-relaxed text-amber-950">{item}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        {featuredProducts.map((item, index) => (
          <Card key={item.id} className="editorial-panel premium-outline bg-[linear-gradient(170deg,#fffdf8_0%,#fff4df_100%)]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">Signature 0{index + 1}</p>
            <CardTitle className="mt-1">{locale === "fr" ? item.fr : item.ar}</CardTitle>
            <CardDescription>
              {locale === "fr"
                ? "Produit artisanal préparé frais chaque jour"
                : "منتج تقليدي يُحضّر طازجاً كل يوم"}
            </CardDescription>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr,0.9fr]">
        <Card className="editorial-panel premium-outline bg-white/90 p-6">
          <CardTitle>{locale === "fr" ? "Une livraison cadrée comme un vrai commerce" : "توصيل منظم كمتجر احترافي"}</CardTitle>
          <CardDescription className="mt-2">
            {locale === "fr"
              ? "Le client voit sa zone, son minimum, ses frais et son créneau avant de payer. Le message de marque devient plus rassurant et plus sérieux."
              : "يرى الزبون منطقته وحده الأدنى ورسومه ونافذته الزمنية قبل الدفع، مما يجعل العلامة أكثر طمأنة واحترافية."}
          </CardDescription>
        </Card>
        <Card className="editorial-panel-dark premium-outline p-6 text-white">
          <CardTitle className="text-white">{locale === "fr" ? "Couverture actuelle" : "التغطية الحالية"}</CardTitle>
          <div className="mt-3 flex flex-wrap gap-2 text-sm text-amber-50/90">
            {zones.map((zone) => (
              <span key={zone.id} className="rounded-full border border-white/20 bg-white/10 px-3 py-1">
                {zone.city}
              </span>
            ))}
          </div>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.95fr,1.05fr]">
        <div className="editorial-panel premium-outline p-6">
          <p className="section-kicker">{locale === "fr" ? "Avis clients" : "آراء الزبائن"}</p>
          <h2 className="mt-3 font-display text-3xl font-semibold text-amber-950">
            {locale === "fr" ? "Ils nous font confiance" : "آراء زبنائنا"}
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-amber-900/78 md:text-base">
            {locale === "fr"
              ? "Le discours, la structure et les signaux visuels doivent donner l’impression d’un commerce réel, maîtrisé et digne de recommandation."
              : "الخطاب والبنية والإشارات البصرية يجب أن تعطي إحساساً بمتجر حقيقي ومنظم وجدير بالتوصية."}
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {(locale === "fr" ? testimonials.fr : testimonials.ar).map((item) => (
            <Card key={item.name} className="editorial-panel premium-outline p-5">
              <p className="text-sm leading-relaxed text-amber-900/82">“{item.text}”</p>
              <p className="mt-4 text-sm font-semibold text-amber-950">{item.name}</p>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="font-display text-3xl font-semibold text-amber-950">{dict.sectionNew}</h2>
          <Link href={`/${locale}/produits`} className="text-sm font-semibold text-amber-900 underline">
            {locale === "fr" ? "Voir toute la gamme" : "عرض التشكيلة الكاملة"}
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {latestProducts.map((product) => (
            <Card key={product.id} className="editorial-panel premium-outline flex h-full flex-col overflow-hidden p-0">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="h-48 w-full object-cover"
                />
              ) : null}
              <div className="flex flex-1 flex-col p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">
                  {locale === "fr" ? "Préparé aujourd'hui" : "محضر اليوم"}
                </p>
                <CardTitle>{product.name}</CardTitle>
                <CardDescription className="mt-1 line-clamp-2">
                  {(locale === "ar" ? product.shortDescriptionAr : product.shortDescription) ??
                    (locale === "ar" ? product.descriptionAr : product.description) ??
                    product.shortDescription ??
                    product.description ??
                    (locale === "fr" ? "Recette traditionnelle marocaine." : "وصفة مغربية تقليدية.")}
                </CardDescription>
                <p className="mt-4 text-sm font-semibold text-amber-950">
                  {formatProductPriceLine(product, locale)}
                </p>
                <Link
                  href={`/${locale}/produits/${product.slug}`}
                  className="mt-4 inline-flex text-sm font-semibold text-amber-900 underline"
                >
                  {locale === "fr" ? "Découvrir le produit" : "اكتشف المنتج"}
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="cta-banner premium-outline px-6 py-8 sm:px-8">
        <div className="relative z-10 grid gap-6 lg:grid-cols-[1fr,auto] lg:items-center">
          <div>
            <p className="section-kicker text-amber-100/80 before:bg-[linear-gradient(90deg,rgba(253,230,138,0.95),rgba(253,230,138,0.2))]">
              {locale === "fr" ? "Prêt à commander" : "جاهز للطلب"}
            </p>
            <h2 className="mt-4 max-w-2xl font-display text-3xl font-semibold leading-tight text-white md:text-4xl">
              {locale === "fr"
                ? "Passez votre commande en quelques minutes"
                : "اطلب الآن في دقائق"}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-amber-50/84 md:text-base">
              {locale === "fr"
                ? "Un catalogue clair, une commande rapide et une confirmation WhatsApp immédiate."
                : "منتجات واضحة، طلب سريع وتأكيد فوري عبر واتساب."}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/${locale}/produits`}
              className="inline-flex rounded-xl bg-white px-5 py-3 text-sm font-semibold text-amber-950 shadow-[0_18px_30px_rgba(255,255,255,0.14)]"
            >
              {locale === "fr" ? "Voir les produits" : "شاهد المنتجات"}
            </Link>
            <Link
              href={`/${locale}/panier`}
              className="inline-flex rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white"
            >
              {locale === "fr" ? "Commander maintenant" : "اطلب الآن"}
            </Link>
          </div>
        </div>
      </section>
    </section>
  );
}
