"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import type { PlaceOrderState } from "@/app/[locale]/(public)/panier/actions";
import { Card, CardTitle } from "@/components/ui/card";
import {
  evaluateCodOrder,
  getDeliveryEtaLabel,
  getDeliverySlotById,
  getDeliverySlotLabel,
  getDeliveryZoneById,
  getDeliveryZoneLabel,
  type DeliverySlotOption,
  type DeliveryZoneOption,
} from "@/lib/delivery";
import type { SaleUnit } from "@/lib/product-pricing";

type CartItem = {
  productId: string;
  name: string;
  unit: SaleUnit;
  unitPrice: number;
  quantity: number;
};

type CartClientProps = {
  locale: "fr" | "ar";
  isClientAuthenticated: boolean;
  initialProfile?: {
    phone: string;
    addressLine: string;
    city: string;
  };
  deliveryZones: DeliveryZoneOption[];
  deliverySlots: DeliverySlotOption[];
  initialDeliveryZoneId?: string;
  initialDeliverySlotId?: string;
  initialState: PlaceOrderState;
  placeOrderAction: (prevState: PlaceOrderState, formData: FormData) => Promise<PlaceOrderState>;
};

const CART_KEY = "msamen_cart";

function normalizeQuantity(unit: SaleUnit, quantity: number) {
  if (unit === "PIECE") {
    return Math.max(1, Math.min(99, Math.floor(quantity || 1)));
  }

  const rounded = Math.round((quantity || 0.25) * 4) / 4;
  return Math.max(0.25, Math.min(99, rounded));
}

function mergeCartItems(items: CartItem[]) {
  const merged = new Map<string, CartItem>();

  for (const item of items) {
    const key = `${item.productId}-${item.unit}`;
    const existing = merged.get(key);
    const normalizedQuantity = normalizeQuantity(item.unit, item.quantity);

    if (existing) {
      merged.set(key, {
        ...existing,
        quantity: normalizeQuantity(existing.unit, existing.quantity + normalizedQuantity),
      });
      continue;
    }

    merged.set(key, {
      ...item,
      quantity: normalizedQuantity,
    });
  }

  return Array.from(merged.values());
}

export function CartClient({
  locale,
  isClientAuthenticated,
  initialProfile,
  deliveryZones,
  deliverySlots,
  initialDeliveryZoneId,
  initialDeliverySlotId,
  initialState,
  placeOrderAction,
}: CartClientProps) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [selectedZoneId, setSelectedZoneId] = useState(
    initialDeliveryZoneId || deliveryZones[0]?.id || "",
  );
  const [selectedSlotId, setSelectedSlotId] = useState(
    initialDeliverySlotId || deliverySlots[0]?.id || "",
  );
  const [state, action, pending] = useActionState(placeOrderAction, initialState);
  const router = useRouter();

  useEffect(() => {
    const raw = window.localStorage.getItem(CART_KEY);
    if (!raw) {
      queueMicrotask(() => setHydrated(true));
      return;
    }

    try {
      const parsed = JSON.parse(raw) as Array<
        CartItem & { price?: number; unit?: SaleUnit; unitPrice?: number }
      >;
      const normalized = parsed
        .filter((item) => item.productId && item.name)
        .map((item) => {
          const unit: SaleUnit = item.unit === "KG" ? "KG" : "PIECE";
          const fallbackPrice = Number(item.price ?? item.unitPrice ?? 0);
          const unitPrice = Number(item.unitPrice ?? fallbackPrice);
          const rawQuantity = Number(item.quantity ?? 1);
          const quantity =
            unit === "KG"
              ? Math.max(0.25, Math.min(99, Math.round(rawQuantity * 4) / 4))
              : Math.max(1, Math.min(99, Math.floor(rawQuantity)));

          return {
            productId: item.productId,
            name: item.name,
            unit,
            unitPrice,
            quantity,
          };
        });

      const deduped = mergeCartItems(normalized);
      window.localStorage.setItem(CART_KEY, JSON.stringify(deduped));
      queueMicrotask(() => setItems(deduped));
    } catch {
      window.localStorage.removeItem(CART_KEY);
    }

    queueMicrotask(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (!state.success) {
      return;
    }

    window.localStorage.removeItem(CART_KEY);
    router.push(`/${locale}/client?ordered=1`);
  }, [locale, router, state.success]);

  const total = useMemo(
    () => items.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0),
    [items],
  );
  const selectedZone = useMemo(
    () => getDeliveryZoneById(deliveryZones, selectedZoneId),
    [deliveryZones, selectedZoneId],
  );
  const selectedSlot = useMemo(
    () => getDeliverySlotById(deliverySlots, selectedSlotId),
    [deliverySlots, selectedSlotId],
  );
  const deliverySummary = useMemo(
    () => evaluateCodOrder(total, selectedZone),
    [selectedZone, total],
  );
  const deliveryReady = !!selectedZone && !!selectedSlot;

  function updateQuantity(productId: string, unit: SaleUnit, quantity: number) {
    const next = mergeCartItems(items.map((item) =>
      item.productId === productId && item.unit === unit
        ? { ...item, quantity: normalizeQuantity(item.unit, quantity) }
        : item,
    ));
    setItems(next);
    window.localStorage.setItem(CART_KEY, JSON.stringify(next));
  }

  function removeItem(productId: string, unit: SaleUnit) {
    const next = mergeCartItems(
      items.filter((item) => item.productId !== productId || item.unit !== unit),
    );
    setItems(next);
    window.localStorage.setItem(CART_KEY, JSON.stringify(next));
  }

  if (!hydrated) {
    return <p className="text-sm text-amber-800">{locale === "fr" ? "Chargement..." : "جاري التحميل..."}</p>;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
      <div className="space-y-4">
        <Card className="overflow-hidden p-0">
          <div className="border-b border-[rgba(160,98,37,0.14)] px-5 py-4">
            <h2 className="font-display text-2xl font-semibold text-amber-950">
              {locale === "fr" ? "Votre panier" : "السلة"}
            </h2>
            <p className="mt-1 text-sm text-amber-900/72">
              {locale === "fr"
                ? "Vérifiez vos produits avant de confirmer votre commande"
                : "راجع منتجاتك قبل تأكيد الطلب"}
            </p>
          </div>

          <div className="space-y-3 p-5">
            {items.length === 0 ? (
              <div className="rounded-2xl border border-[rgba(160,98,37,0.14)] bg-white/86 p-4 text-sm text-amber-900">
                <p>{locale === "fr" ? "Votre panier est vide" : "سلتك فارغة"}</p>
                <Link
                  href={`/${locale}/produits`}
                  className="mt-3 inline-flex rounded-xl border border-[rgba(160,98,37,0.16)] bg-white px-4 py-2 font-semibold text-amber-950 shadow-[0_10px_20px_rgba(94,45,16,0.05)]"
                >
                  {locale === "fr" ? "Voir les produits" : "شاهد المنتجات"}
                </Link>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={`${item.productId}-${item.unit}`}
                  className="rounded-[1.4rem] border border-[rgba(160,98,37,0.14)] bg-[rgba(255,250,243,0.92)] p-4 text-sm text-amber-900"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-amber-950">{item.name}</p>
                      <p className="mt-1 text-amber-900/72">
                        {item.unitPrice.toFixed(2)} MAD x {item.quantity}
                        {item.unit === "PIECE" ? ` ${locale === "fr" ? "piece(s)" : "قطعة"}` : ` ${locale === "fr" ? "kg" : "كلغ"}`}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-amber-950">
                      {(item.unitPrice * item.quantity).toFixed(2)} MAD
                    </p>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <input
                      type="number"
                      min={item.unit === "PIECE" ? 1 : 0.25}
                      max={99}
                      step={item.unit === "PIECE" ? 1 : 0.25}
                      value={item.quantity}
                      onChange={(event) => updateQuantity(item.productId, item.unit, Number(event.target.value))}
                      className="w-24 rounded-xl px-3 py-2"
                    />
                    <button
                      type="button"
                      onClick={() => removeItem(item.productId, item.unit)}
                      className="rounded-xl border border-red-300 bg-white px-3 py-2 font-semibold text-red-700"
                    >
                      {locale === "fr" ? "Retirer" : "حذف"}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <div className="space-y-4">
        <Card className="space-y-3 p-5">
          <CardTitle>{locale === "fr" ? "Résumé de la commande" : "ملخص الطلب"}</CardTitle>
          <div className="soft-divider" />
          <div className="flex items-center justify-between text-sm text-amber-900/78">
            <span>{locale === "fr" ? "Articles" : "العناصر"}</span>
            <span>{items.length}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-amber-900/78">
            <span>{locale === "fr" ? "Paiement" : "الدفع"}</span>
            <span>{locale === "fr" ? "COD" : "عند الاستلام"}</span>
          </div>
          <div className="rounded-2xl border border-[rgba(160,98,37,0.12)] bg-[rgba(255,248,238,0.88)] px-4 py-3">
            <div className="flex items-center justify-between text-sm text-amber-900/78">
              <span>{locale === "fr" ? "Sous-total produits" : "المجموع الفرعي للمنتجات"}</span>
              <span>{deliverySummary.subtotal.toFixed(2)} MAD</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm text-amber-900/78">
              <span>{locale === "fr" ? "Frais de livraison" : "رسوم التوصيل"}</span>
              <span>{deliverySummary.deliveryFee.toFixed(2)} MAD</span>
            </div>
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
              {locale === "fr" ? "Total à payer à la livraison" : "إجمالي الدفع عند الاستلام"}
            </p>
            <p className="mt-1 text-2xl font-semibold text-amber-950">
              {deliverySummary.total.toFixed(2)} MAD
            </p>
          </div>

          {selectedZone ? (
            <div className="rounded-2xl border border-[rgba(160,98,37,0.12)] bg-white/86 px-4 py-3 text-sm text-amber-900">
              <p className="font-semibold text-amber-950">
                {locale === "fr" ? "Zone de livraison" : "منطقة التوصيل"}:{" "}
                {getDeliveryZoneLabel(selectedZone, locale)}
              </p>
              <p className="mt-1 text-amber-900/72">
                {locale === "fr" ? "Minimum zone" : "الحد الأدنى للمنطقة"}:{" "}
                {selectedZone.minimumOrder.toFixed(2)} MAD
              </p>
              {getDeliveryEtaLabel(selectedZone, locale) ? (
                <p className="mt-1 text-amber-900/72">
                  {locale === "fr" ? "Delai indicatif" : "المهلة التقديرية"}:{" "}
                  {getDeliveryEtaLabel(selectedZone, locale)}
                </p>
              ) : null}
            </div>
          ) : null}

          {selectedSlot ? (
            <div className="rounded-2xl border border-[rgba(160,98,37,0.12)] bg-white/86 px-4 py-3 text-sm text-amber-900">
              <p className="font-semibold text-amber-950">
                {locale === "fr" ? "Créneau préféré" : "النافذة الزمنية المفضلة"}:{" "}
                {getDeliverySlotLabel(selectedSlot, locale)}
              </p>
              {selectedSlot.orderCutoffHour !== null ? (
                <p className="mt-1 text-amber-900/72">
                  {locale === "fr"
                    ? `Commande recommandée avant ${String(selectedSlot.orderCutoffHour).padStart(2, "0")}:00`
                    : `يفضل الطلب قبل ${String(selectedSlot.orderCutoffHour).padStart(2, "0")}:00`}
                </p>
              ) : null}
            </div>
          ) : null}
        </Card>

        <form action={action} className="form-shell space-y-3 p-5">
          <div className="space-y-2">
            <p className="section-kicker">{locale === "fr" ? "Livraison" : "التوصيل"}</p>
            <h2 className="font-display text-2xl font-semibold text-amber-950">
              {locale === "fr" ? "Coordonnées client" : "بيانات الزبون"}
            </h2>
          </div>

        <input type="hidden" name="locale" value={locale} />
        <input
          type="hidden"
          name="cart"
          value={JSON.stringify(
            items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unit: item.unit,
            })),
          )}
        />
        <select
          name="deliveryZoneId"
          value={selectedZoneId}
          onChange={(event) => setSelectedZoneId(event.target.value)}
          required
          className="w-full rounded-xl px-3 py-3"
        >
          <option value="">{locale === "fr" ? "Choisir une zone de livraison" : "اختر منطقة التوصيل"}</option>
          {deliveryZones.map((zone) => (
            <option key={zone.id} value={zone.id}>
              {getDeliveryZoneLabel(zone, locale)} - {zone.shippingFee.toFixed(2)} MAD
            </option>
          ))}
        </select>
        <select
          name="deliverySlotId"
          value={selectedSlotId}
          onChange={(event) => setSelectedSlotId(event.target.value)}
          required
          className="w-full rounded-xl px-3 py-3"
        >
          <option value="">{locale === "fr" ? "Choisir un créneau" : "اختر نافذة زمنية"}</option>
          {deliverySlots.map((slot) => (
            <option key={slot.id} value={slot.id}>
              {getDeliverySlotLabel(slot, locale)}
            </option>
          ))}
        </select>
        <input
          name="addressLine"
          placeholder={locale === "fr" ? "Adresse complète" : "العنوان الكامل"}
          defaultValue={initialProfile?.addressLine ?? ""}
          required
          className="w-full rounded-xl px-3 py-3"
        />
        <input
          name="phone"
          placeholder={locale === "fr" ? "Téléphone" : "الهاتف"}
          defaultValue={initialProfile?.phone ?? ""}
          pattern="^(?:0[5-7]\d{8}|\+212[5-7]\d{8})$"
          title={
            locale === "fr"
              ? "Format attendu: 0612345678 ou +212612345678"
              : "الصيغة المطلوبة: 0612345678 أو +212612345678"
          }
          required
          className="w-full rounded-xl px-3 py-3"
        />
        <textarea
          name="notes"
          placeholder={locale === "fr" ? "Notes (optionnel)" : "ملاحظات (اختياري)"}
          className="min-h-28 w-full rounded-xl px-3 py-3"
        />

        {!deliveryZones.length || !deliverySlots.length ? (
          <p className="rounded-2xl border border-red-200 bg-red-50/90 px-3 py-2 text-sm text-red-700">
            {locale === "fr"
              ? "La configuration COD n'est pas disponible. Activez au moins une zone et un créneau."
              : "إعدادات الدفع عند الاستلام غير متاحة. فعّل منطقة ونافذة زمنية على الأقل."}
          </p>
        ) : null}

        {selectedZone && !deliverySummary.meetsMinimum ? (
          <p className="rounded-2xl border border-amber-200 bg-amber-50/92 px-3 py-2 text-sm text-amber-900">
            {locale === "fr"
              ? `Minimum ${selectedZone.minimumOrder.toFixed(2)} MAD pour ${getDeliveryZoneLabel(selectedZone, locale)}. Ajoutez ${deliverySummary.missingAmount.toFixed(2)} MAD pour valider.`
              : `الحد الأدنى لـ ${getDeliveryZoneLabel(selectedZone, locale)} هو ${selectedZone.minimumOrder.toFixed(2)} درهم. أضف ${deliverySummary.missingAmount.toFixed(2)} درهم لتأكيد الطلب.`}
          </p>
        ) : null}

        {selectedZone ? (
          <p className="rounded-2xl border border-emerald-200 bg-emerald-50/86 px-3 py-2 text-sm text-emerald-800">
            {locale === "fr"
              ? "Paiement à la livraison • Confirmation WhatsApp"
              : "الدفع عند الاستلام • تأكيد عبر واتساب"}
          </p>
        ) : null}

        {!isClientAuthenticated ? (
          <p className="rounded-2xl border border-red-200 bg-red-50/90 px-3 py-2 text-sm text-red-700">
            {locale === "fr"
              ? "Connectez-vous avec un compte client pour valider la commande COD."
              : "سجل الدخول بحساب زبون لتأكيد طلب الدفع عند الاستلام."}
          </p>
        ) : null}

        {state.error ? (
          <p className="rounded-2xl border border-red-200 bg-red-50/90 px-3 py-2 text-sm text-red-700">
            {state.error}
          </p>
        ) : null}

        <div className="surface-animate surface-delay-1 rounded-2xl border border-amber-200/80 bg-[#fff7ed]/92 px-4 py-3 text-center shadow-[0_12px_28px_rgba(180,83,9,0.08)]">
          <p className="text-sm font-semibold text-amber-900">
            {locale === "fr"
              ? "🔥 Votre commande sera préparée aujourd’hui"
              : "🔥 الطلب ديالك غادي يتحضر اليوم"}
          </p>
          <p className="mt-1 text-xs text-amber-800/80">
            {locale === "fr"
              ? "Livraison aujourd’hui ou demain selon votre zone"
              : "التوصيل اليوم أو غداً حسب المنطقة"}
          </p>
        </div>

        <button
          type="submit"
          disabled={
            pending ||
            items.length === 0 ||
            !isClientAuthenticated ||
            !deliveryReady ||
            !deliverySummary.meetsMinimum
          }
          className="w-full rounded-xl bg-[linear-gradient(135deg,#b65a22_0%,#8f3e14_100%)] px-4 py-3 text-sm font-semibold text-white shadow-[0_16px_28px_rgba(143,62,20,0.22)] disabled:opacity-50"
        >
          {pending
            ? locale === "fr"
              ? "Validation..."
              : "جاري التأكيد..."
            : locale === "fr"
              ? "Confirmer la commande"
              : "تأكيد الطلب"}
        </button>
        <p className="text-center text-xs font-semibold text-amber-800/76">
          {locale === "fr"
            ? "✔ Traitement rapide • Livraison le jour même ou lendemain"
            : "✔ معالجة سريعة • توصيل اليوم أو غداً"}
        </p>
        </form>
      </div>
    </div>
  );
}
