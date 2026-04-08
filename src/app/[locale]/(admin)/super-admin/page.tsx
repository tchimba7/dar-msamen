import Link from "next/link";

import { getAuthSession } from "@/auth";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Locale, t } from "@/lib/i18n";
import { db } from "@/lib/db";
import { deliverySlots, deliveryZones, orders, users } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export default async function SuperAdminDashboard({
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

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [allUsers, allOrders, recentOrders] = await Promise.all([
    db
      .select({ id: users.id, role: users.role, createdAt: users.createdAt })
      .from(users),
    db
      .select({
        id: orders.id,
        status: orders.status,
        createdAt: orders.createdAt,
      })
      .from(orders),
    db
      .select({
        id: orders.id,
        status: orders.status,
        total: orders.total,
        deliveryZoneLabel: orders.deliveryZoneLabel,
        whatsappStatus: orders.whatsappStatus,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .orderBy(desc(orders.createdAt))
      .limit(8),
  ]);
  const [activeZones, activeSlots] = await Promise.all([
    db.select({ id: deliveryZones.id }).from(deliveryZones).where(eq(deliveryZones.isActive, true)),
    db.select({ id: deliverySlots.id }).from(deliverySlots).where(eq(deliverySlots.isActive, true)),
  ]);

  const totalUsers = allUsers.length;
  const totalOrders = allOrders.length;
  const newUsers7d = allUsers.filter((user) => user.createdAt >= sevenDaysAgo).length;
  const newOrders7d = allOrders.filter((order) => order.createdAt >= sevenDaysAgo).length;
  const pendingOrders = allOrders.filter((order) => order.status === "PENDING").length;
  const failedWhatsApp = recentOrders.filter((order) => order.whatsappStatus === "FAILED").length;

  return (
    <section className="space-y-6">
      <div className="page-hero p-6 md:p-8">
        <div className="relative space-y-4">
          <p className="section-kicker">{locale === "fr" ? "Pilotage global" : "الإدارة العامة"}</p>
          <h1 className="font-display text-3xl font-semibold text-amber-950 md:text-5xl">{dict.navSuperAdmin}</h1>
          <p className="max-w-3xl text-sm leading-relaxed text-amber-950/76 md:text-base">
            {locale === "fr"
              ? "Vue consolidée sur les utilisateurs, les commandes et les espaces d’administration pour opérer le projet avant mise en production."
              : "رؤية موحدة للمستخدمين والطلبات ومساحات الإدارة لإدارة المشروع قبل الإطلاق."}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-6">
          <CardTitle>{locale === "fr" ? "Utilisateurs" : "المستخدمون"}</CardTitle>
          <CardDescription>
            {locale === "fr" ? `${totalUsers} au total` : `${totalUsers} إجمالي`}
          </CardDescription>
          <p className="mt-2 text-sm text-amber-900">
            {locale === "fr" ? `${newUsers7d} nouveaux sur 7 jours` : `${newUsers7d} جدد خلال 7 أيام`}
          </p>
        </Card>

        <Card className="p-6">
          <CardTitle>{locale === "fr" ? "Commandes" : "الطلبات"}</CardTitle>
          <CardDescription>{locale === "fr" ? `${totalOrders} au total` : `${totalOrders} إجمالي`}</CardDescription>
          <p className="mt-2 text-sm text-amber-900">
            {locale === "fr" ? `${newOrders7d} nouvelles sur 7 jours` : `${newOrders7d} جديدة خلال 7 أيام`}
          </p>
          <p className="mt-1 text-sm text-amber-900">
            {locale === "fr" ? `${pendingOrders} en attente` : `${pendingOrders} قيد الانتظار`}
          </p>
        </Card>

        <Card className="p-6">
          <CardTitle>{locale === "fr" ? "Analyse rapide" : "تحليل سريع"}</CardTitle>
          <CardDescription>
            {locale === "fr"
              ? "Résumé des dernières commandes et accès aux actions admin."
              : "ملخص آخر الطلبات وروابط جميع إجراءات الإدارة."}
          </CardDescription>
          <p className="mt-2 text-sm text-amber-900">
            {locale === "fr"
              ? `${activeZones.length} zones COD, ${activeSlots.length} créneaux actifs`
              : `${activeZones.length} مناطق دفع عند الاستلام و${activeSlots.length} نوافذ زمنية نشطة`}
          </p>
          <p className="mt-1 text-sm text-amber-900">
            {locale === "fr"
              ? `${failedWhatsApp} WhatsApp à surveiller`
              : `${failedWhatsApp} إشعارات واتساب تحتاج مراجعة`}
          </p>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <CardTitle>{locale === "fr" ? "Espace admin users" : "إدارة المستخدمين الإداريين"}</CardTitle>
          <Link href={`/${locale}/super-admin/admin-users`}>
            <Button className="mt-3 w-full">{locale === "fr" ? "Ouvrir" : "فتح"}</Button>
          </Link>
        </Card>

        <Card className="p-6">
          <CardTitle>{locale === "fr" ? "Espace catégories" : "إدارة الفئات"}</CardTitle>
          <Link href={`/${locale}/super-admin/categories`}>
            <Button className="mt-3 w-full">{locale === "fr" ? "Ouvrir" : "فتح"}</Button>
          </Link>
        </Card>

        <Card className="p-6">
          <CardTitle>{locale === "fr" ? "Espace produits" : "إدارة المنتجات"}</CardTitle>
          <Link href={`/${locale}/super-admin/products`}>
            <Button className="mt-3 w-full">{locale === "fr" ? "Ouvrir" : "فتح"}</Button>
          </Link>
        </Card>

        <Card className="p-6">
          <CardTitle>{locale === "fr" ? "Analyse commandes" : "تحليل الطلبات"}</CardTitle>
          <Link href={`/${locale}/super-admin/orders`}>
            <Button className="mt-3 w-full">{locale === "fr" ? "Ouvrir" : "فتح"}</Button>
          </Link>
        </Card>
      </div>

      <Card className="p-6">
        <CardTitle>{locale === "fr" ? "Dernières commandes" : "آخر الطلبات"}</CardTitle>
        <div className="mt-3 space-y-2 text-sm text-amber-900">
          {recentOrders.length === 0 ? (
            <p>{locale === "fr" ? "Aucune commande pour le moment." : "لا توجد طلبات حالياً."}</p>
          ) : (
            recentOrders.map((order) => (
              <p key={order.id}>
                #{order.id.slice(0, 8)} - {order.status} - {Number(order.total).toFixed(2)} MAD -{" "}
                {order.deliveryZoneLabel ?? (locale === "fr" ? "Zone a confirmer" : "منطقة غير محددة")} - WhatsApp:{" "}
                {order.whatsappStatus}
              </p>
            ))
          )}
        </div>
      </Card>
    </section>
  );
}
