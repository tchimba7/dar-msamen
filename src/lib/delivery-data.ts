import { asc, eq } from "drizzle-orm";

import { deliverySlots, deliveryZones } from "@/db/schema";
import { db } from "@/lib/db";
import type { DeliverySlotOption, DeliveryZoneOption } from "@/lib/delivery";

function toNumber(value: string | number | null | undefined) {
  return Number(value ?? 0);
}

export async function getActiveDeliveryOptions(): Promise<{
  zones: DeliveryZoneOption[];
  slots: DeliverySlotOption[];
}> {
  const [zones, slots] = await Promise.all([
    db
      .select({
        id: deliveryZones.id,
        code: deliveryZones.code,
        city: deliveryZones.city,
        label: deliveryZones.label,
        labelAr: deliveryZones.labelAr,
        shippingFee: deliveryZones.shippingFee,
        minimumOrder: deliveryZones.minimumOrder,
        deliveryEta: deliveryZones.deliveryEta,
        deliveryEtaAr: deliveryZones.deliveryEtaAr,
      })
      .from(deliveryZones)
      .where(eq(deliveryZones.isActive, true))
      .orderBy(asc(deliveryZones.sortOrder), asc(deliveryZones.city)),
    db
      .select({
        id: deliverySlots.id,
        code: deliverySlots.code,
        labelFr: deliverySlots.labelFr,
        labelAr: deliverySlots.labelAr,
        orderCutoffHour: deliverySlots.orderCutoffHour,
      })
      .from(deliverySlots)
      .where(eq(deliverySlots.isActive, true))
      .orderBy(asc(deliverySlots.sortOrder)),
  ]);

  return {
    zones: zones.map((zone) => ({
      ...zone,
      shippingFee: toNumber(zone.shippingFee),
      minimumOrder: toNumber(zone.minimumOrder),
    })),
    slots,
  };
}
