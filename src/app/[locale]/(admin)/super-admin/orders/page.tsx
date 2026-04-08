import Link from "next/link";

import { getAuthSession } from "@/auth";
import { OrderStatusUpdateForm } from "@/components/orders/order-status-update-form";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { QueryFlashMessage } from "@/components/ui/query-flash-message";
import { orders, users } from "@/db/schema";
import { Locale, t } from "@/lib/i18n";
import { getOrderStatusLabel, ORDER_STATUS_OPTIONS, type OrderStatus } from "@/lib/order-status";
import { db } from "@/lib/db";
import { and, asc, desc, eq, gte, lte } from "drizzle-orm";

import { updateSuperAdminOrderStatusAction } from "../actions";

export default async function SuperAdminOrdersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ status?: string; from?: string; to?: string; sort?: string; updated?: string }>;
}) {
  const { locale } = await params;
  const { status = "", from = "", to = "", sort = "date_desc", updated = "" } = await searchParams;
  const session = await getAuthSession();
  const dict = t(locale);

  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return <p className="text-red-700">{dict.roleDenied}</p>;
  }

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const fromDate = from ? new Date(`${from}T00:00:00.000Z`) : null;
  const toDate = to ? new Date(`${to}T23:59:59.999Z`) : null;
  const normalizedStatus = ORDER_STATUS_OPTIONS.includes(status as OrderStatus)
    ? (status as OrderStatus)
    : "";
  const filters = [
    normalizedStatus ? eq(orders.status, normalizedStatus) : undefined,
    fromDate && !Number.isNaN(fromDate.getTime()) ? gte(orders.createdAt, fromDate) : undefined,
    toDate && !Number.isNaN(toDate.getTime()) ? lte(orders.createdAt, toDate) : undefined,
  ].filter(Boolean);

  const whereClause =
    filters.length === 0 ? undefined : filters.length === 1 ? filters[0]! : and(...filters);

  const sortOrder =
    sort === "date_asc"
      ? asc(orders.createdAt)
      : sort === "total_desc"
        ? desc(orders.total)
        : sort === "total_asc"
          ? asc(orders.total)
          : desc(orders.createdAt);

  const recentOrdersQuery = db
    .select({
      id: orders.id,
      status: orders.status,
      total: orders.total,
      subtotal: orders.subtotal,
      deliveryFee: orders.deliveryFee,
      createdAt: orders.createdAt,
      deliveryPhone: orders.phone,
      deliveryAddress: orders.addressLine,
      deliveryCity: orders.city,
      deliveryZoneLabel: orders.deliveryZoneLabel,
      deliverySlotLabel: orders.deliverySlotLabel,
      whatsappStatus: orders.whatsappStatus,
      notes: orders.notes,
      customerName: users.name,
      customerEmail: users.email,
      customerPhone: users.phone,
      customerAddress: users.addressLine,
      customerCity: users.city,
    })
    .from(orders)
    .leftJoin(users, eq(orders.customerId, users.id));

  const [allOrders, allUsers, recentOrders] = await Promise.all([
    db
      .select({ id: orders.id, status: orders.status, total: orders.total, createdAt: orders.createdAt })
      .from(orders),
    db
      .select({ id: users.id, createdAt: users.createdAt, role: users.role })
      .from(users),
    (whereClause ? recentOrdersQuery.where(whereClause) : recentOrdersQuery)
      .orderBy(sortOrder)
      .limit(20),
  ]);

  const newOrders7d = allOrders.filter((order) => order.createdAt >= sevenDaysAgo).length;
  const newUsers7d = allUsers.filter((user) => user.createdAt >= sevenDaysAgo).length;
  const failedWhatsAppCount = recentOrders.filter((order) => order.whatsappStatus === "FAILED").length;

  const byStatus = allOrders.reduce<Record<string, number>>((acc, order) => {
    acc[order.status] = (acc[order.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-3xl font-bold text-amber-950">{locale === "fr" ? "Analyse commandes" : "تحليل الطلبات"}</h1>
        <Link href={`/${locale}/super-admin`}>
          <Button variant="secondary">{locale === "fr" ? "Retour dashboard" : "العودة للوحة"}</Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardTitle>{locale === "fr" ? "Nouvelles commandes" : "طلبات جديدة"}</CardTitle>
          <CardDescription>
            {locale === "fr" ? `${newOrders7d} sur 7 jours` : `${newOrders7d} خلال 7 أيام`}
          </CardDescription>
        </Card>
        <Card>
          <CardTitle>{locale === "fr" ? "Nouveaux utilisateurs" : "مستخدمون جدد"}</CardTitle>
          <CardDescription>
            {locale === "fr" ? `${newUsers7d} sur 7 jours` : `${newUsers7d} خلال 7 أيام`}
          </CardDescription>
        </Card>
        <Card>
          <CardTitle>{locale === "fr" ? "Total commandes" : "إجمالي الطلبات"}</CardTitle>
          <CardDescription>{allOrders.length}</CardDescription>
        </Card>
      </div>

      <Card>
        <CardTitle>{locale === "fr" ? "Operations COD" : "عمليات الدفع عند الاستلام"}</CardTitle>
        <CardDescription>
          {locale === "fr"
            ? `${failedWhatsAppCount} confirmations WhatsApp en echec sur la vue courante`
            : `${failedWhatsAppCount} تأكيدات واتساب فاشلة في العرض الحالي`}
        </CardDescription>
      </Card>

      <Card>
        <CardTitle>{locale === "fr" ? "Statuts commandes" : "حالات الطلبات"}</CardTitle>
        <div className="mt-3 grid gap-2 text-sm text-amber-900 md:grid-cols-3">
          {Object.entries(byStatus).map(([status, count]) => (
            <p key={status}>
              {getOrderStatusLabel(status, locale)}: {count}
            </p>
          ))}
        </div>
      </Card>

      <Card>
        {updated === "1" ? (
          <QueryFlashMessage
            clearParams={["updated"]}
            className="mb-3 rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-700"
            message={locale === "fr" ? "Statut commande mis a jour." : "تم تحديث حالة الطلب."}
          />
        ) : null}
        {updated === "invalid" ? (
          <QueryFlashMessage
            clearParams={["updated"]}
            className="mb-3 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700"
            message={locale === "fr" ? "Mise a jour invalide." : "تحديث غير صالح."}
          />
        ) : null}
        {updated === "blocked" ? (
          <QueryFlashMessage
            clearParams={["updated"]}
            className="mb-3 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700"
            message={
              locale === "fr"
                ? "Transition de statut non autorisee (retour arriere bloque)."
                : "انتقال الحالة غير مسموح (الرجوع للخلف محظور)."
            }
          />
        ) : null}

        <form className="mb-4 grid gap-2 rounded-md border border-amber-200 bg-white p-3 md:grid-cols-5" method="get">
          <select name="status" defaultValue={normalizedStatus} className="rounded-md border border-amber-300 px-3 py-2 text-sm">
            <option value="">{locale === "fr" ? "Tous statuts" : "كل الحالات"}</option>
            {ORDER_STATUS_OPTIONS.map((statusOption) => (
              <option key={statusOption} value={statusOption}>
                {getOrderStatusLabel(statusOption, locale)}
              </option>
            ))}
          </select>
          <input type="date" name="from" defaultValue={from} className="rounded-md border border-amber-300 px-3 py-2 text-sm" />
          <input type="date" name="to" defaultValue={to} className="rounded-md border border-amber-300 px-3 py-2 text-sm" />
          <select name="sort" defaultValue={sort} className="rounded-md border border-amber-300 px-3 py-2 text-sm">
            <option value="date_desc">{locale === "fr" ? "Date: recent -> ancien" : "التاريخ: الاحدث -> الاقدم"}</option>
            <option value="date_asc">{locale === "fr" ? "Date: ancien -> recent" : "التاريخ: الاقدم -> الاحدث"}</option>
            <option value="total_desc">{locale === "fr" ? "Montant: eleve -> bas" : "المبلغ: الاعلى -> الادنى"}</option>
            <option value="total_asc">{locale === "fr" ? "Montant: bas -> eleve" : "المبلغ: الادنى -> الاعلى"}</option>
          </select>
          <div className="flex gap-2">
            <button type="submit" className="rounded-md bg-amber-700 px-3 py-2 text-sm font-semibold text-white">
              {locale === "fr" ? "Filtrer" : "تصفية"}
            </button>
            <Link href={`/${locale}/super-admin/orders`} className="rounded-md border border-amber-300 px-3 py-2 text-sm font-semibold text-amber-900">
              {locale === "fr" ? "Reset" : "اعادة"}
            </Link>
          </div>
        </form>
        <CardTitle>{locale === "fr" ? "Dernières commandes" : "آخر الطلبات"}</CardTitle>
        <div className="mt-4 space-y-2 text-sm text-amber-900">
          {recentOrders.length === 0 ? (
            <p>{locale === "fr" ? "Aucune commande pour le moment." : "لا توجد طلبات حالياً."}</p>
          ) : (
            recentOrders.map((order) => (
              <div key={order.id} className="rounded-2xl border border-amber-200 bg-white p-4 shadow-[0_10px_24px_rgba(120,53,15,0.06)]">
                <p className="font-semibold text-amber-950">
                  #{order.id.slice(0, 8)} - {getOrderStatusLabel(order.status, locale)} - {Number(order.total).toFixed(2)} MAD
                </p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 font-semibold text-amber-900">
                    {order.deliveryZoneLabel ?? order.deliveryCity}
                  </span>
                  {order.deliverySlotLabel ? (
                    <span className="rounded-full border border-amber-200 bg-white px-2.5 py-1 font-semibold text-amber-900">
                      {order.deliverySlotLabel}
                    </span>
                  ) : null}
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-800">
                    WhatsApp: {order.whatsappStatus}
                  </span>
                </div>
                <div className="mt-3 grid gap-2 text-xs text-amber-800 sm:grid-cols-3">
                  <p>{locale === "fr" ? "Sous-total" : "المجموع الفرعي"}: {Number(order.subtotal ?? order.total).toFixed(2)} MAD</p>
                  <p>{locale === "fr" ? "Livraison" : "التوصيل"}: {Number(order.deliveryFee ?? 0).toFixed(2)} MAD</p>
                  <p>{locale === "fr" ? "Total COD" : "إجمالي الدفع"}: {Number(order.total).toFixed(2)} MAD</p>
                </div>
                <p>
                  {locale === "fr" ? "Client" : "الزبون"}: {order.customerName ?? "Client"} ({order.customerEmail ?? "-"})
                </p>
                <p>
                  {locale === "fr" ? "Téléphone livraison" : "هاتف التسليم"}: {order.deliveryPhone}
                </p>
                <p>
                  {locale === "fr" ? "Adresse livraison" : "عنوان التسليم"}: {order.deliveryAddress}, {order.deliveryCity}
                </p>
                {order.notes ? (
                  <p>
                    {locale === "fr" ? "Notes" : "ملاحظات"}: {order.notes}
                  </p>
                ) : null}
                <p>
                  {locale === "fr" ? "Profil client" : "بيانات ملف الزبون"}: {(order.customerPhone ?? "-")} / {(order.customerAddress ?? "-")}, {(order.customerCity ?? "-")}
                </p>

                <OrderStatusUpdateForm
                  locale={locale}
                  orderId={order.id}
                  currentStatus={order.status}
                  action={updateSuperAdminOrderStatusAction}
                />
              </div>
            ))
          )}
        </div>
      </Card>
    </section>
  );
}
