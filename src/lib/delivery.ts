import type { Locale } from "@/lib/i18n";

export type DeliveryZoneOption = {
  id: string;
  code: string;
  city: string;
  label: string;
  labelAr: string | null;
  shippingFee: number;
  minimumOrder: number;
  deliveryEta: string | null;
  deliveryEtaAr: string | null;
};

export type DeliverySlotOption = {
  id: string;
  code: string;
  labelFr: string;
  labelAr: string;
  orderCutoffHour: number | null;
};

function normalizeLookupValue(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function findMatchingDeliveryZoneId(zones: DeliveryZoneOption[], city: string | null | undefined) {
  if (!city) {
    return "";
  }

  const normalizedCity = normalizeLookupValue(city);
  const match = zones.find((zone) => {
    const cityMatches = normalizeLookupValue(zone.city) === normalizedCity;
    const labelMatches = normalizeLookupValue(zone.label) === normalizedCity;
    return cityMatches || labelMatches;
  });

  return match?.id ?? "";
}

export function getDeliveryZoneById(zones: DeliveryZoneOption[], zoneId: string) {
  return zones.find((zone) => zone.id === zoneId) ?? null;
}

export function getDeliverySlotById(slots: DeliverySlotOption[], slotId: string) {
  return slots.find((slot) => slot.id === slotId) ?? null;
}

export function evaluateCodOrder(subtotal: number, zone: DeliveryZoneOption | null) {
  if (!zone) {
    return {
      subtotal,
      deliveryFee: 0,
      total: subtotal,
      meetsMinimum: false,
      missingAmount: 0,
    };
  }

  const deliveryFee = zone.shippingFee;
  const total = subtotal + deliveryFee;
  const meetsMinimum = subtotal >= zone.minimumOrder;

  return {
    subtotal,
    deliveryFee,
    total,
    meetsMinimum,
    missingAmount: meetsMinimum ? 0 : zone.minimumOrder - subtotal,
  };
}

export function getDeliveryZoneLabel(zone: DeliveryZoneOption, locale: Locale) {
  return locale === "ar" ? (zone.labelAr ?? zone.label) : zone.label;
}

export function getDeliveryEtaLabel(zone: DeliveryZoneOption, locale: Locale) {
  return locale === "ar" ? (zone.deliveryEtaAr ?? zone.deliveryEta ?? "") : (zone.deliveryEta ?? "");
}

export function getDeliverySlotLabel(slot: DeliverySlotOption, locale: Locale) {
  return locale === "ar" ? slot.labelAr : slot.labelFr;
}
