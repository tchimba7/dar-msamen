import Link from "next/link";
import Image from "next/image";

import { getAuthSession } from "@/auth";
import { LogoutButton } from "@/components/layout/logout-button";
import { Button } from "@/components/ui/button";
import { Locale, t } from "@/lib/i18n";
import { APP_ROLES, getRoleDashboardPath } from "@/lib/roles";

type SiteHeaderProps = {
  locale: Locale;
};

export async function SiteHeader({ locale }: SiteHeaderProps) {
  const session = await getAuthSession();
  const dict = t(locale);
  const alternateLocale = locale === "fr" ? "ar" : "fr";
  const role = session?.user?.role;
  const showCart = Boolean(session?.user) && role === APP_ROLES.CLIENT;

  let spaceLabel = dict.navClient;
  if (role === APP_ROLES.ADMIN_USER) {
    spaceLabel = dict.navAdmin;
  }
  if (role === APP_ROLES.SUPER_ADMIN) {
    spaceLabel = dict.navSuperAdmin;
  }

  return (
    <header className="sticky top-0 z-40 border-b border-[rgba(160,98,37,0.14)] bg-[rgba(251,246,238,0.8)] backdrop-blur-xl">
      <div className="border-b border-[rgba(160,98,37,0.1)] bg-[rgba(122,53,17,0.92)]">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-100/90 sm:px-6">
          <span>{locale === "fr" ? "Préparation fraîche chaque matin" : "تحضير طازج كل صباح"}</span>
          <span>{locale === "fr" ? "Livraison COD selon votre zone" : "توصيل حسب المنطقة مع الدفع عند الاستلام"}</span>
          <span>{locale === "fr" ? "Confirmation rapide via WhatsApp" : "تأكيد سريع عبر واتساب"}</span>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <Link href={`/${locale}`} className="inline-flex items-center gap-3" aria-label={dict.brand}>
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[rgba(160,98,37,0.14)] bg-white/88 shadow-[0_14px_30px_rgba(94,45,16,0.08)] sm:h-18 sm:w-18">
            <Image
              src="/logo-dar-msamen.png"
              alt={dict.brand}
              width={160}
              height={160}
              className="h-14 w-14 object-contain sm:h-16 sm:w-16"
              priority
            />
          </div>
          <div className="space-y-1">
            <p className="font-display text-xl font-semibold text-amber-950">{dict.brand}</p>
            <p className="text-sm text-amber-900/72">{dict.subtitle}</p>
          </div>
        </Link>

        <nav className="brand-shell premium-outline flex flex-wrap items-center gap-2 px-3 py-3 lg:justify-end">
          <Link href={`/${locale}/produits`}>
            <Button variant="ghost">{dict.navProducts}</Button>
          </Link>
          {showCart ? (
            <Link href={`/${locale}/panier`}>
              <Button variant="ghost">{dict.navCart}</Button>
            </Link>
          ) : null}

          {session?.user ? (
            <>
              <Link href={getRoleDashboardPath(locale, role)}>
                <Button variant="ghost">{spaceLabel}</Button>
              </Link>
              {role === APP_ROLES.ADMIN_USER ? (
                <>
                  <Link href={`/${locale}/admin/products`}>
                    <Button variant="ghost">
                      {locale === "fr" ? "Gerer produits" : "ادارة المنتجات"}
                    </Button>
                  </Link>
                  <Link href={`/${locale}/admin/orders`}>
                    <Button variant="ghost">
                      {locale === "fr" ? "Voir commandes" : "عرض الطلبات"}
                    </Button>
                  </Link>
                  <Link href={`/${locale}/admin/profil`}>
                    <Button variant="ghost">
                      {locale === "fr" ? "Mon profil admin" : "ملفي الإداري"}
                    </Button>
                  </Link>
                </>
              ) : null}
              {role === APP_ROLES.CLIENT ? (
                <Link href={`/${locale}/client/profil`}>
                  <Button variant="ghost">
                    {locale === "fr" ? "Mon profil" : "ملفي الشخصي"}
                  </Button>
                </Link>
              ) : null}
              <LogoutButton locale={locale} label={dict.navLogout} />
            </>
          ) : (
            <>
              <Link href={`/${locale}/connexion`}>
                <Button variant="ghost">{dict.navLogin}</Button>
              </Link>
              <Link href={`/${locale}/inscription`}>
                <Button>{locale === "fr" ? "Commander en COD" : "اطلب بالدفع عند الاستلام"}</Button>
              </Link>
            </>
          )}

          <Link
            href={`/${alternateLocale}`}
            className="inline-flex h-11 items-center rounded-xl border border-[rgba(160,98,37,0.18)] bg-white/86 px-3.5 text-sm font-semibold text-amber-900 shadow-[0_10px_20px_rgba(94,45,16,0.05)]"
          >
            {alternateLocale.toUpperCase()}
          </Link>
        </nav>
      </div>
    </header>
  );
}
