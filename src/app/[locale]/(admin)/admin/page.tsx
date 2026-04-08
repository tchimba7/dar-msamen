import { getAuthSession } from "@/auth";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { orders } from "@/db/schema";
import { Locale, t } from "@/lib/i18n";
import { db } from "@/lib/db";
import { desc } from "drizzle-orm";

export default async function AdminUserDashboard({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const session = await getAuthSession();
  const dict = t(locale);

  if (!session?.user || session.user.role !== "ADMIN_USER") {
    return <p className="text-red-700">{dict.roleDenied}</p>;
  }

  const recentOrders = await db
    .select({
      id: orders.id,
      status: orders.status,
      total: orders.total,
      deliveryZoneLabel: orders.deliveryZoneLabel,
      whatsappStatus: orders.whatsappStatus,
    })
    .from(orders)
    .orderBy(desc(orders.createdAt))
    .limit(5);
  const pendingOrders = recentOrders.filter((order) => order.status === "PENDING").length;

  return (
    <section className="space-y-6">
      <div className="page-hero p-6 md:p-8">
        <div className="relative space-y-4">
          <p className="section-kicker">{locale === "fr" ? "Zone administrateur" : "منطقة الإدارة"}</p>
          <h1 className="font-display text-3xl font-semibold text-amber-950 md:text-5xl">{dict.navAdmin}</h1>
          <p className="max-w-3xl text-sm leading-relaxed text-amber-950/76 md:text-base">
            {locale === "fr"
              ? "Pilotez vos produits, vos commandes et votre profil depuis une interface resserrée sur les actions du quotidien."
              : "أدر منتجاتك وطلباتك وملفك الشخصي من واجهة مركزة على مهامك اليومية."}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-6">
          <CardTitle>{locale === "fr" ? "Operations COD" : "عمليات الدفع عند الاستلام"}</CardTitle>
          <CardDescription>
            {locale === "fr"
              ? `${pendingOrders} commandes en attente dans la vue recente`
              : `${pendingOrders} طلبات قيد الانتظار في العرض الأخير`}
          </CardDescription>
        </Card>
        <Card className="p-6">
          <CardTitle>{locale === "fr" ? "Confirmations client" : "تأكيدات الزبائن"}</CardTitle>
          <CardDescription>
            {locale === "fr"
              ? "Suivi WhatsApp et créneaux accessibles depuis les commandes."
              : "متابعة واتساب والنوافذ الزمنية متاحة من صفحة الطلبات."}
          </CardDescription>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-6">
          <CardTitle>{locale === "fr" ? "Mes produits" : "منتجاتي"}</CardTitle>
          <CardDescription>
            {locale === "fr"
              ? "Ajouter et modifier vos produits uniquement."
              : "إضافة وتعديل منتجاتك فقط."}
          </CardDescription>
          <Link href={`/${locale}/admin/products`} className="mt-3 inline-flex">
            <Button variant="secondary">
              {locale === "fr" ? "Gerer produits" : "ادارة المنتجات"}
            </Button>
          </Link>
        </Card>
        <Card className="p-6">
          <CardTitle>{locale === "fr" ? "Mes commandes" : "طلباتي"}</CardTitle>
          <CardDescription>
            {locale === "fr"
              ? "Gérer les commandes liées à vos produits."
              : "إدارة الطلبات المرتبطة بمنتجاتك."}
          </CardDescription>
          <Link href={`/${locale}/admin/orders`} className="mt-3 inline-flex">
            <Button variant="secondary">
              {locale === "fr" ? "Voir commandes" : "عرض الطلبات"}
            </Button>
          </Link>
        </Card>
        <Card className="p-6">
          <CardTitle>{locale === "fr" ? "Mon compte" : "حسابي"}</CardTitle>
          <CardDescription>
            {locale === "fr"
              ? "Mettre à jour vos informations de compte."
              : "تحديث معلومات حسابك."}
          </CardDescription>
          <Link href={`/${locale}/admin/profil`} className="mt-3 inline-flex">
            <Button variant="secondary">
              {locale === "fr" ? "Modifier mon profil" : "تعديل ملفي"}
            </Button>
          </Link>
        </Card>
      </div>

      <Card className="p-6">
        <CardTitle>{locale === "fr" ? "Dernières commandes COD" : "آخر طلبات الدفع عند الاستلام"}</CardTitle>
        <div className="mt-3 space-y-2 text-sm text-amber-900">
          {recentOrders.length === 0 ? (
            <p>{locale === "fr" ? "Aucune commande récente." : "لا توجد طلبات حديثة."}</p>
          ) : (
            recentOrders.map((order) => (
              <p key={order.id}>
                #{order.id.slice(0, 8)} - {order.status} - {Number(order.total).toFixed(2)} MAD -{" "}
                {order.deliveryZoneLabel ?? (locale === "fr" ? "zone a confirmer" : "منطقة غير محددة")} - WhatsApp:{" "}
                {order.whatsappStatus}
              </p>
            ))
          )}
        </div>
      </Card>
    </section>
  );
}
