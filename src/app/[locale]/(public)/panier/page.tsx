import { getAuthSession } from "@/auth";
import { CartClient } from "@/components/cart/cart-client";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { getActiveDeliveryOptions } from "@/lib/delivery-data";
import { findMatchingDeliveryZoneId } from "@/lib/delivery";
import { Locale } from "@/lib/i18n";
import { APP_ROLES, getRoleDashboardPath } from "@/lib/roles";
import { isPhoneVerificationRequired } from "@/lib/verification-policy";
import { redirect } from "next/navigation";

import { placeCodOrderAction } from "./actions";

export default async function CartPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const session = await getAuthSession();
  const phoneVerificationRequired = isPhoneVerificationRequired();
  const { slots, zones } = await getActiveDeliveryOptions();

  if (
    session?.user &&
    session.user.role !== APP_ROLES.CLIENT
  ) {
    redirect(getRoleDashboardPath(locale, session.user.role));
  }

  if (
    phoneVerificationRequired &&
    session?.user?.role === APP_ROLES.CLIENT &&
    !session.user.phoneVerified
  ) {
    redirect(`/${locale}/client/verification-telephone`);
  }

  const isClientAuthenticated = !!session?.user && session.user.role === "CLIENT";

  let initialProfile: { phone: string; addressLine: string; city: string } | undefined;
  if (isClientAuthenticated) {
    const [{ db }, { users }, { eq }] = await Promise.all([
      import("@/lib/db"),
      import("@/db/schema"),
      import("drizzle-orm"),
    ]);

    const client = await db.query.users.findFirst({
      where: eq(users.id, session!.user.id),
    });

    if (client) {
      initialProfile = {
        phone: client.phone ?? "",
        addressLine: client.addressLine ?? "",
        city: client.city ?? "",
      };
    }
  }

  const initialDeliveryZoneId = findMatchingDeliveryZoneId(zones, initialProfile?.city);
  const initialDeliverySlotId = slots[0]?.id ?? "";

  return (
    <section className="space-y-6">
      <div className="page-hero p-6 md:p-8">
        <div className="relative space-y-4">
          <p className="section-kicker">{locale === "fr" ? "Paiement COD" : "الدفع عند الاستلام"}</p>
          <h1 className="font-display text-3xl font-semibold text-amber-950 md:text-5xl">
            {locale === "fr" ? "Votre panier" : "السلة"}
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-amber-950/76 md:text-base">
            {locale === "fr"
              ? "Vérifiez vos produits avant de confirmer votre commande"
              : "راجع منتجاتك قبل تأكيد الطلب"}
          </p>
          <div className="grid gap-3 md:grid-cols-3">
            <Card className="p-4">
              <CardTitle className="text-base">{locale === "fr" ? "Zone de livraison" : "منطقة التوصيل"}</CardTitle>
              <CardDescription>
                {locale === "fr"
                  ? `${zones.length} zones disponibles`
                  : `${zones.length} مناطق متاحة`}
              </CardDescription>
            </Card>
            <Card className="p-4">
              <CardTitle className="text-base">{locale === "fr" ? "Frais de livraison" : "رسوم التوصيل"}</CardTitle>
              <CardDescription>
                {locale === "fr"
                  ? "Calculés selon votre zone"
                  : "يتم احتسابها حسب المنطقة"}
              </CardDescription>
            </Card>
            <Card className="p-4">
              <CardTitle className="text-base">{locale === "fr" ? "Confirmation" : "التأكيد"}</CardTitle>
              <CardDescription>
                {locale === "fr"
                  ? "Paiement à la livraison • Confirmation WhatsApp"
                  : "الدفع عند الاستلام • تأكيد عبر واتساب"}
              </CardDescription>
            </Card>
          </div>
        </div>
      </div>

      <CartClient
        locale={locale}
        isClientAuthenticated={isClientAuthenticated}
        initialProfile={initialProfile}
        deliveryZones={zones}
        deliverySlots={slots}
        initialDeliveryZoneId={initialDeliveryZoneId}
        initialDeliverySlotId={initialDeliverySlotId}
        initialState={{}}
        placeOrderAction={placeCodOrderAction}
      />
    </section>
  );
}
