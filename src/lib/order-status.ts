import type { Locale } from "@/lib/i18n";

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PREPARING"
  | "OUT_FOR_DELIVERY"
  | "DELIVERY_DELAYED"
  | "DELIVERED"
  | "CANCELLED";

export const ORDER_STATUS_OPTIONS: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "OUT_FOR_DELIVERY",
  "DELIVERY_DELAYED",
  "DELIVERED",
  "CANCELLED",
];

const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PREPARING", "CANCELLED"],
  PREPARING: ["OUT_FOR_DELIVERY", "CANCELLED"],
  OUT_FOR_DELIVERY: ["DELIVERED", "DELIVERY_DELAYED", "CANCELLED"],
  DELIVERY_DELAYED: ["OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"],
  DELIVERED: [],
  CANCELLED: [],
};

const STATUS_INDEX: Record<OrderStatus, number> = {
  PENDING: 1,
  CONFIRMED: 2,
  PREPARING: 3,
  OUT_FOR_DELIVERY: 4,
  DELIVERY_DELAYED: 4,
  DELIVERED: 5,
  CANCELLED: 0,
};

export function getOrderStatusLabel(status: string, locale: Locale) {
  if (locale === "fr") {
    const map: Record<string, string> = {
      PENDING: "En attente",
      CONFIRMED: "Confirmée",
      PREPARING: "En préparation",
      OUT_FOR_DELIVERY: "En livraison",
      DELIVERY_DELAYED: "Livraison reportée",
      DELIVERED: "Livrée",
      CANCELLED: "Annulée",
    };
    return map[status] ?? status;
  }

  const map: Record<string, string> = {
    PENDING: "قيد الانتظار",
    CONFIRMED: "تم التأكيد",
    PREPARING: "قيد التحضير",
    OUT_FOR_DELIVERY: "خرج للتوصيل",
    DELIVERY_DELAYED: "تم تأجيل التوصيل",
    DELIVERED: "تم التسليم",
    CANCELLED: "ملغي",
  };
  return map[status] ?? status;
}

export function getOrderProgressPercent(status: string) {
  const index = STATUS_INDEX[status as OrderStatus] ?? 1;
  if (index <= 0) {
    return 0;
  }
  return (index / 5) * 100;
}

export function getAllowedNextOrderStatuses(status: string): OrderStatus[] {
  const normalized = (ORDER_STATUS_OPTIONS.includes(status as OrderStatus)
    ? (status as OrderStatus)
    : "PENDING") as OrderStatus;

  return ORDER_STATUS_TRANSITIONS[normalized] ?? [];
}

export function canTransitionOrderStatus(current: string, next: string) {
  if (current === next) {
    return true;
  }

  const allowed = getAllowedNextOrderStatuses(current);
  return allowed.includes(next as OrderStatus);
}
