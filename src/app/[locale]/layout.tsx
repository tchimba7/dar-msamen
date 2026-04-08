import { notFound } from "next/navigation";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { getDirection, isLocale } from "@/lib/i18n";

type LocaleLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  return (
    <div
      dir={getDirection(locale)}
      className="min-h-full bg-[radial-gradient(circle_at_top_right,#fef3c7_0,#fff7ed_38%,#fffbeb_100%)]"
    >
      <SiteHeader locale={locale} />
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}
