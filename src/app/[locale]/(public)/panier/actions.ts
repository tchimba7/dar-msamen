"use server";

import { and, eq, inArray } from "drizzle-orm";

import { getAuthSession } from "@/auth";
import { sendOrderConfirmationWhatsApp } from "@/lib/order-confirmation";
import { isValidMoroccanPhone, normalizeMoroccanPhone } from "@/lib/phone";
import { isUnitAllowed, normalizeSaleMode, resolveUnitPrice, type SaleUnit } from "@/lib/product-pricing";
import { isPhoneVerificationRequired } from "@/lib/verification-policy";

export type PlaceOrderState = {
  error?: string;
  success?: boolean;
};

type RawCartItem = {
  productId: string;
  quantity: number;
  unit?: SaleUnit;
};

export async function placeCodOrderAction(
  _prevState: PlaceOrderState,
  formData: FormData,
): Promise<PlaceOrderState> {
  const locale = String(formData.get("locale") ?? "fr");
  const addressLine = String(formData.get("addressLine") ?? "").trim();
  const deliveryZoneId = String(formData.get("deliveryZoneId") ?? "").trim();
  const deliverySlotId = String(formData.get("deliverySlotId") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const cartRaw = String(formData.get("cart") ?? "[]");

  const session = await getAuthSession();
  const phoneVerificationRequired = isPhoneVerificationRequired();
  if (!session?.user || session.user.role !== "CLIENT") {
    return {
      error:
        locale === "fr"
          ? "Connectez-vous avec un compte client pour confirmer la commande."
          : "سجل الدخول بحساب زبون لتأكيد الطلب.",
    };
  }

  if (!addressLine || !deliveryZoneId || !deliverySlotId || !phone) {
    return {
      error:
        locale === "fr"
          ? "Adresse, zone de livraison, créneau et téléphone sont obligatoires."
          : "العنوان ومنطقة التوصيل والنافذة الزمنية والهاتف إلزامية.",
    };
  }

  if (!isValidMoroccanPhone(phone)) {
    return {
      error:
        locale === "fr"
          ? "Numéro téléphone invalide. Utilisez 0612345678 ou +212612345678."
          : "رقم الهاتف غير صالح. استخدم 0612345678 أو +212612345678.",
    };
  }

  let rawItems: RawCartItem[] = [];
  try {
    rawItems = JSON.parse(cartRaw) as RawCartItem[];
  } catch {
    return {
      error: locale === "fr" ? "Panier invalide." : "السلة غير صالحة.",
    };
  }

  const normalizedItems = rawItems
    .filter((item) => item.productId && Number.isFinite(item.quantity) && item.quantity > 0)
    .map((item) => ({
      productId: item.productId,
      unit: (item.unit === "KG" ? "KG" : "PIECE") as SaleUnit,
      quantity:
        item.unit === "KG"
          ? Math.max(0.25, Math.min(99, Math.round(item.quantity * 4) / 4))
          : Math.max(1, Math.min(99, Math.floor(item.quantity))),
    }));

  if (normalizedItems.length === 0) {
    return {
      error: locale === "fr" ? "Votre panier est vide." : "سلتك فارغة.",
    };
  }

  const [{ db }, { deliverySlots, deliveryZones, orderItems, orderStatusEvents, orders, products, users }] =
    await Promise.all([
    import("@/lib/db"),
    import("@/db/schema"),
    ]);

  const [customer] = await db
    .select({ name: users.name, phone: users.phone, phoneVerifiedAt: users.phoneVerifiedAt })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (phoneVerificationRequired && (!customer?.phone || !customer.phoneVerifiedAt)) {
    return {
      error:
        locale === "fr"
          ? "Vérifiez votre téléphone depuis votre espace client avant de commander."
          : "تحقق من رقم هاتفك من حسابك قبل تأكيد الطلب.",
    };
  }

  const normalizedCheckoutPhone = normalizeMoroccanPhone(phone);
  if (phoneVerificationRequired && normalizedCheckoutPhone !== customer.phone) {
    return {
      error:
        locale === "fr"
          ? "Le téléphone de commande doit correspondre au numéro vérifié de votre compte."
          : "رقم الطلب يجب أن يطابق الرقم الموثق في حسابك.",
    };
  }

  const [[selectedZone], [selectedSlot]] = await Promise.all([
    db
      .select({
        id: deliveryZones.id,
        city: deliveryZones.city,
        label: deliveryZones.label,
        labelAr: deliveryZones.labelAr,
        shippingFee: deliveryZones.shippingFee,
        minimumOrder: deliveryZones.minimumOrder,
      })
      .from(deliveryZones)
      .where(
        and(
          eq(deliveryZones.id, deliveryZoneId),
          eq(deliveryZones.isActive, true),
          eq(deliveryZones.codEnabled, true),
        ),
      )
      .limit(1),
    db
      .select({
        id: deliverySlots.id,
        labelFr: deliverySlots.labelFr,
        labelAr: deliverySlots.labelAr,
      })
      .from(deliverySlots)
      .where(and(eq(deliverySlots.id, deliverySlotId), eq(deliverySlots.isActive, true)))
      .limit(1),
  ]);

  if (!selectedZone) {
    return {
      error:
        locale === "fr"
          ? "Zone de livraison indisponible. Merci de rafraîchir la page."
          : "منطقة التوصيل غير متاحة. يرجى تحديث الصفحة.",
    };
  }

  if (!selectedSlot) {
    return {
      error:
        locale === "fr"
          ? "Créneau de livraison indisponible. Merci de rafraîchir la page."
          : "النافذة الزمنية غير متاحة. يرجى تحديث الصفحة.",
    };
  }

  const uniqueProductIds = Array.from(new Set(normalizedItems.map((item) => item.productId)));

  const availableProducts = await db
    .select({
      id: products.id,
      price: products.price,
      pricePerPiece: products.pricePerPiece,
      pricePerKg: products.pricePerKg,
      saleMode: products.saleMode,
      isActive: products.isActive,
    })
    .from(products)
    .where(inArray(products.id, uniqueProductIds));

  const productMap = new Map(
    availableProducts.filter((item) => item.isActive).map((item) => [item.id, item]),
  );

  const validItems = normalizedItems.filter((item) => productMap.has(item.productId));
  if (validItems.length === 0) {
    return {
      error:
        locale === "fr"
          ? "Aucun produit du panier n'est disponible."
          : "لا يوجد منتج متاح في السلة.",
    };
  }

  const pricedItems: Array<{
    productId: string;
    quantity: number;
    unit: SaleUnit;
    unitPrice: number;
    unitPriceText: string;
  }> = [];

  for (const item of validItems) {
    const product = productMap.get(item.productId)!;
    const saleMode = normalizeSaleMode(product.saleMode);

    if (!isUnitAllowed(saleMode, item.unit)) {
      return {
        error:
          locale === "fr"
            ? "Une unite de vente n'est plus valide. Veuillez actualiser votre panier."
            : "احدى وحدات البيع غير صالحة حاليا. يرجى تحديث السلة.",
      };
    }

    const unitPrice = resolveUnitPrice(
      {
        saleMode,
        price: product.price,
        pricePerPiece: product.pricePerPiece,
        pricePerKg: product.pricePerKg,
      },
      item.unit,
    );

    if (!unitPrice || unitPrice <= 0) {
      return {
        error:
          locale === "fr"
            ? "Un produit du panier n'a plus de prix valide."
            : "احد منتجات السلة لا يتوفر على سعر صالح حاليا.",
      };
    }

    pricedItems.push({
      productId: item.productId,
      quantity: item.quantity,
      unit: item.unit,
      unitPrice,
      unitPriceText: unitPrice.toFixed(2),
    });
  }

  const subtotal = pricedItems.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
  const minimumOrder = Number(selectedZone.minimumOrder);
  if (subtotal < minimumOrder) {
    const missingAmount = minimumOrder - subtotal;
    return {
      error:
        locale === "fr"
          ? `Minimum ${minimumOrder.toFixed(2)} MAD pour cette zone. Ajoutez ${missingAmount.toFixed(2)} MAD pour confirmer.`
          : `الحد الأدنى لهذه المنطقة هو ${minimumOrder.toFixed(2)} درهم. أضف ${missingAmount.toFixed(2)} درهم لتأكيد الطلب.`,
    };
  }

  const deliveryFee = Number(selectedZone.shippingFee);
  const total = subtotal + deliveryFee;
  const deliveryZoneLabel = locale === "ar" ? (selectedZone.labelAr ?? selectedZone.label) : selectedZone.label;
  const deliverySlotLabel = locale === "ar" ? selectedSlot.labelAr : selectedSlot.labelFr;

  const createdOrder = await db.transaction(async (tx) => {
    const [order] = await tx
      .insert(orders)
      .values({
        customerId: session.user.id,
        status: "PENDING",
        paymentMethod: "COD",
        total: total.toFixed(2),
        subtotal: subtotal.toFixed(2),
        deliveryFee: deliveryFee.toFixed(2),
        deliveryZoneId: selectedZone.id,
        deliveryZoneLabel,
        deliverySlotId: selectedSlot.id,
        deliverySlotLabel,
        addressLine,
        city: selectedZone.city,
        phone: normalizedCheckoutPhone,
        notes: notes || null,
      })
      .returning({ id: orders.id });

    await tx.insert(orderItems).values(
      pricedItems.map((item) => ({
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity.toFixed(3),
        unitPrice: item.unitPriceText,
      })),
    );

    await tx.insert(orderStatusEvents).values({
      orderId: order.id,
      status: "PENDING",
      changedBy: session.user.id,
    });

    return order;
  });

  const whatsappResult = await sendOrderConfirmationWhatsApp({
    locale: locale === "ar" ? "ar" : "fr",
    orderId: createdOrder.id,
    phone: normalizedCheckoutPhone,
    customerName: customer?.name,
    subtotal,
    deliveryFee,
    total,
    deliveryZoneLabel,
    deliverySlotLabel,
  });

  await db
    .update(orders)
    .set({
      whatsappStatus: whatsappResult.status,
      whatsappSentAt: whatsappResult.status === "SENT" ? whatsappResult.sentAt ?? new Date() : null,
      whatsappError: whatsappResult.error ?? null,
      updatedAt: new Date(),
    })
    .where(eq(orders.id, createdOrder.id));

  return { success: true };
}
