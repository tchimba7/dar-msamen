import { getAuthSession } from "@/auth";
import { desc, eq, inArray } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Locale, t } from "@/lib/i18n";
import { getOrderProgressPercent, getOrderStatusLabel } from "@/lib/order-status";
import { isPhoneVerificationRequired } from "@/lib/verification-policy";

function getWhatsAppStatusLabel(
  status: "PENDING" | "SENT" | "FAILED" | "SKIPPED",
  locale: Locale,
) {
  if (locale === "ar") {
    if (status === "SENT") return "واتساب مرسل";
    if (status === "FAILED") return "فشل الإرسال";
    if (status === "SKIPPED") return "إرسال غير مفعل";
    return "قيد المعالجة";
  }

  if (status === "SENT") return "WhatsApp envoye";
  if (status === "FAILED") return "WhatsApp en echec";
  if (status === "SKIPPED") return "WhatsApp non configure";
  return "WhatsApp en attente";
}

export default async function ClientDashboard({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ ordered?: string }>;
}) {
  const { locale } = await params;
  const { ordered } = await searchParams;
  const session = await getAuthSession();
  const dict = t(locale);
  const phoneVerificationRequired = isPhoneVerificationRequired();

  if (!session?.user || session.user.role !== "CLIENT") {
    return <p className="text-red-700">{dict.roleDenied}</p>;
  }

  if (phoneVerificationRequired && !session.user.phoneVerified) {
    return redirect(`/${locale}/client/verification-telephone`);
  }

  const [{ db }, { orders, orderStatusEvents }] = await Promise.all([
    import("@/lib/db"),
    import("@/db/schema"),
  ]);

  const recentOrders = await db
    .select({
      id: orders.id,
      status: orders.status,
      total: orders.total,
      subtotal: orders.subtotal,
      deliveryFee: orders.deliveryFee,
      city: orders.city,
      deliveryZoneLabel: orders.deliveryZoneLabel,
      deliverySlotLabel: orders.deliverySlotLabel,
      whatsappStatus: orders.whatsappStatus,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .where(eq(orders.customerId, session.user.id))
    .orderBy(desc(orders.createdAt))
    .limit(8);

  const orderIds = recentOrders.map((order) => order.id);
  const allStatusEvents =
    orderIds.length > 0
      ? await db
          .select({
            orderId: orderStatusEvents.orderId,
            status: orderStatusEvents.status,
            createdAt: orderStatusEvents.createdAt,
          })
          .from(orderStatusEvents)
          .where(inArray(orderStatusEvents.orderId, orderIds))
          .orderBy(desc(orderStatusEvents.createdAt))
      : [];

  const eventsByOrder = new Map<string, Array<{ status: string; createdAt: Date }>>();
  for (const event of allStatusEvents) {
    const bucket = eventsByOrder.get(event.orderId) ?? [];
    bucket.push({ status: event.status, createdAt: event.createdAt });
    eventsByOrder.set(event.orderId, bucket);
  }

  const isFr = locale === "fr";
  const orderedMessage =
    ordered === "1"
      ? isFr
        ? "Commande COD confirmée. Vérifiez votre espace pour le suivi et la confirmation WhatsApp."
        : "تم تأكيد طلب الدفع عند الاستلام. راقب حسابك لتتبع الطلب وتأكيد واتساب."
      : null;

  return (
    <section className="scene-3d relative space-y-5">
      <div
        aria-hidden
        className="float-orb-3d pointer-events-none absolute -left-6 top-8 -z-10 h-16 w-16 rounded-full bg-[radial-gradient(circle_at_35%_35%,#fde68a_0,#f59e0b_55%,#b45309_100%)] opacity-60 blur-[1px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-10 -z-10 h-40 rounded-[2rem] bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.28),rgba(255,247,237,0.2)_45%,transparent_72%)] blur-2xl"
      />

      <header className="surface-animate panel-3d rounded-3xl border border-amber-200/70 bg-white/85 px-6 py-5 shadow-[0_18px_45px_rgba(120,53,15,0.1)] backdrop-blur-sm sm:px-8">
        <div className="panel-layer">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700/85">
            {isFr ? "Espace client" : "فضاء الزبون"}
          </p>
          <h1 className="mt-2 text-3xl font-bold text-amber-950 sm:text-4xl">{dict.navClient}</h1>
          <p className="mt-2 max-w-2xl text-sm text-amber-900/80 sm:text-base">
            {isFr
              ? "Suivez vos commandes et gérez vos informations facilement"
              : "تتبع طلباتك وقم بإدارة معلوماتك بسهولة"}
          </p>
        </div>
      </header>

      {orderedMessage ? (
        <p className="surface-animate surface-delay-1 rounded-xl border border-emerald-300 bg-emerald-50/95 px-4 py-2.5 text-sm font-medium text-emerald-800">
          {orderedMessage}
        </p>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Card className="surface-animate surface-delay-2 panel-3d rounded-3xl border-amber-200/80 bg-white/92 p-5 sm:p-6">
          <div className="panel-layer">
            <CardTitle className="text-xl">
              {isFr ? "Mes commandes" : "طلباتي"}
            </CardTitle>
            <CardDescription className="mt-1">
              {isFr ? "Vos commandes les plus récentes." : "أحدث طلباتك."}
            </CardDescription>

            <div className="mt-4 space-y-3 text-sm text-amber-900">
              {recentOrders.length === 0 ? (
                <CardDescription>
                  {isFr ? "Aucune commande pour le moment." : "لا توجد طلبات حالياً."}
                </CardDescription>
              ) : (
                recentOrders.map((order) => (
                  <article
                    key={order.id}
                    className="panel-layer-soft rounded-2xl border border-amber-200/80 bg-white/95 px-4 py-3 shadow-[0_10px_26px_rgba(120,53,15,0.08)]"
                  >
                    <p className="text-sm font-semibold text-amber-950">
                      #{order.id.slice(0, 8)} - {getOrderStatusLabel(order.status, locale)} -{" "}
                      {Number(order.total).toFixed(2)} MAD
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 font-semibold text-amber-900">
                        {order.deliveryZoneLabel ?? order.city}
                      </span>
                      {order.deliverySlotLabel ? (
                        <span className="rounded-full border border-amber-200 bg-white px-2.5 py-1 font-semibold text-amber-900">
                          {order.deliverySlotLabel}
                        </span>
                      ) : null}
                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-800">
                        {getWhatsAppStatusLabel(order.whatsappStatus, locale)}
                      </span>
                    </div>
                    <div className="mt-3 grid gap-2 text-xs text-amber-800 sm:grid-cols-3">
                      <p>
                        {isFr ? "Sous-total" : "المجموع الفرعي"}:{" "}
                        {Number(order.subtotal ?? order.total).toFixed(2)} MAD
                      </p>
                      <p>
                        {isFr ? "Livraison" : "التوصيل"}: {Number(order.deliveryFee ?? 0).toFixed(2)} MAD
                      </p>
                      <p>
                        {isFr ? "Total COD" : "إجمالي الدفع"}: {Number(order.total).toFixed(2)} MAD
                      </p>
                    </div>
                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-amber-100">
                      <div
                        className="h-full rounded-full bg-amber-700 transition-all duration-500"
                        style={{ width: `${getOrderProgressPercent(order.status)}%` }}
                      />
                    </div>
                    <div className="mt-2 space-y-1 text-xs text-amber-800">
                      {(eventsByOrder.get(order.id) ?? [{ status: order.status, createdAt: order.createdAt }])
                        .slice(0, 4)
                        .map((event, index) => (
                          <p key={`${event.status}-${event.createdAt.toISOString()}-${index}`}>
                            {getOrderStatusLabel(event.status, locale)} -{" "}
                            {event.createdAt.toLocaleString(isFr ? "fr-FR" : "ar-MA")}
                          </p>
                        ))}
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>
        </Card>

        <Card className="surface-animate surface-delay-2 panel-3d h-fit rounded-3xl border-amber-200/80 bg-white/92 p-5">
          <div className="panel-layer">
            <CardTitle className="text-base">{isFr ? "Mes informations" : "معلوماتي"}</CardTitle>
            <CardDescription className="mt-1">
              {isFr
                ? "Mettez à jour vos coordonnées et adresses."
                : "قم بتحديث بياناتك وعناوينك."}
            </CardDescription>
            <Link
              href={`/${locale}/client/profil`}
              className="mt-4 inline-flex"
            >
              <Button variant="secondary" className="panel-layer-soft h-auto rounded-xl py-2.5">
                {isFr ? "Modifier mes informations" : "تعديل المعلومات"}
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </section>
  );
}
