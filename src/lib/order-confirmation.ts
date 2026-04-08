import { toMoroccanE164 } from "@/lib/phone";

export type OrderWhatsAppStatus = "PENDING" | "SENT" | "FAILED" | "SKIPPED";

type SendOrderConfirmationParams = {
  locale: "fr" | "ar";
  orderId: string;
  phone: string;
  customerName?: string | null;
  subtotal: number;
  deliveryFee: number;
  total: number;
  deliveryZoneLabel: string;
  deliverySlotLabel: string;
};

function formatWhatsAppAddress(value: string) {
  const trimmed = value.trim();
  if (trimmed.toLowerCase().startsWith("whatsapp:")) {
    return trimmed;
  }
  return `whatsapp:${trimmed}`;
}

function buildOrderConfirmationMessage(params: SendOrderConfirmationParams) {
  const shortId = params.orderId.slice(0, 8).toUpperCase();

  if (params.locale === "ar") {
    return [
      `تم استلام طلبكم لدى دار المسمن بنجاح.`,
      `رقم الطلب: #${shortId}`,
      `المجموع الفرعي: ${params.subtotal.toFixed(2)} MAD`,
      `رسوم التوصيل: ${params.deliveryFee.toFixed(2)} MAD`,
      `الإجمالي عند الاستلام: ${params.total.toFixed(2)} MAD`,
      `منطقة التوصيل: ${params.deliveryZoneLabel}`,
      `النافذة الزمنية: ${params.deliverySlotLabel}`,
      `سنؤكد معكم التفاصيل النهائية قبل الإرسال.`,
    ].join("\n");
  }

  return [
    `Dar Msamen a bien recu votre commande COD${params.customerName ? `, ${params.customerName}` : ""}.`,
    `Reference: #${shortId}`,
    `Sous-total: ${params.subtotal.toFixed(2)} MAD`,
    `Frais de livraison: ${params.deliveryFee.toFixed(2)} MAD`,
    `Total a payer a la reception: ${params.total.toFixed(2)} MAD`,
    `Zone: ${params.deliveryZoneLabel}`,
    `Creneau souhaite: ${params.deliverySlotLabel}`,
    `Nous vous recontacterons si un ajustement est necessaire.`,
  ].join("\n");
}

async function sendTwilioWhatsApp(params: SendOrderConfirmationParams) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM;

  if (!sid || !token || !from) {
    return {
      status: "SKIPPED" as const,
      error: "Twilio WhatsApp configuration is missing.",
    };
  }

  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      From: formatWhatsAppAddress(from),
      To: formatWhatsAppAddress(toMoroccanE164(params.phone)),
      Body: buildOrderConfirmationMessage(params),
    }),
  });

  if (!response.ok) {
    return {
      status: "FAILED" as const,
      error: await response.text(),
    };
  }

  return {
    status: "SENT" as const,
    sentAt: new Date(),
  };
}

export async function sendOrderConfirmationWhatsApp(params: SendOrderConfirmationParams) {
  const provider = (
    process.env.ORDER_CONFIRMATION_PROVIDER ??
    process.env.PHONE_VERIFICATION_PROVIDER ??
    "mock"
  )
    .trim()
    .toLowerCase();

  if (provider !== "twilio") {
    console.info("[order-confirmation:whatsapp]", buildOrderConfirmationMessage(params));
    return {
      status: "SKIPPED" as const,
      error: "WhatsApp provider not enabled; message logged locally.",
    };
  }

  return sendTwilioWhatsApp(params);
}
