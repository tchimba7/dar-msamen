import { Locale } from "@/lib/i18n";

type SiteFooterProps = {
  locale: Locale;
};

export function SiteFooter({ locale }: SiteFooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-[rgba(160,98,37,0.14)] bg-[linear-gradient(180deg,rgba(255,248,238,0.92)_0%,rgba(242,230,213,0.98)_100%)]">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 text-sm text-amber-900/78 sm:px-6 lg:grid-cols-[1.15fr,0.85fr,0.85fr,0.85fr] lg:px-8">
        <div className="space-y-3">
          <p className="font-display text-2xl font-semibold text-amber-950">
            {locale === "fr" ? "Dar Msamen" : "دار المسمن"}
          </p>
          <p>
            {locale === "fr"
              ? "Dar Msamen vous propose des produits marocains frais, préparés chaque jour avec une livraison rapide et un paiement simple à la réception."
              : "دار المسمن تقدم منتجات مغربية طازجة تُحضّر يومياً مع توصيل سريع والدفع عند الاستلام."}
          </p>
        </div>
        <div className="space-y-3">
          <p className="font-display text-base font-semibold text-amber-950">
            {locale === "fr" ? "Promesse client" : "وعد التجربة"}
          </p>
          <p>{locale === "fr" ? "Catalogue bilingue FR / AR à lecture rapide" : "كتالوج ثنائي اللغة بقراءة سريعة"}</p>
          <p>{locale === "fr" ? "Suivi commande, créneau et zone visibles" : "إظهار المنطقة والنافذة الزمنية وتتبع الطلب"}</p>
        </div>
        <div className="space-y-3">
          <p className="font-display text-base font-semibold text-amber-950">
            {locale === "fr" ? "Commerce COD" : "التجارة عند الاستلام"}
          </p>
          <p>{locale === "fr" ? "Minimum, frais et confirmation WhatsApp cadrés" : "حد أدنى ورسوم وتأكيد واتساب منظم"}</p>
          <p>{locale === "fr" ? "Livraison locale et paiement à la réception" : "توصيل محلي والدفع عند الاستلام"}</p>
        </div>
        <div className="space-y-3">
          <p className="font-display text-base font-semibold text-amber-950">
            {locale === "fr" ? "Infos utiles" : "معلومات مفيدة"}
          </p>
          <p>{locale === "fr" ? "Contact: WhatsApp / téléphone local" : "التواصل: واتساب / هاتف محلي"}</p>
          <p>{locale === "fr" ? "Disponibilité selon zone et créneau" : "التوفر حسب المنطقة والنافذة الزمنية"}</p>
          <p>{locale === "fr" ? `© ${year} Dar Msamen` : `© ${year} دار المسمن`}</p>
        </div>
      </div>
    </footer>
  );
}
