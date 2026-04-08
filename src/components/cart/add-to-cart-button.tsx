"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { normalizeSaleMode, resolveUnitPrice, type SaleUnit } from "@/lib/product-pricing";

type AddToCartButtonProps = {
  productId: string;
  name: string;
  saleMode: "PIECE" | "KG" | "BOTH";
  pricePerPiece?: number | null;
  pricePerKg?: number | null;
  fallbackPrice?: number;
  locale: "fr" | "ar";
  isClientAuthenticated?: boolean;
  layout?: "compact" | "full";
};

type CartItem = {
  productId: string;
  name: string;
  unit: SaleUnit;
  unitPrice: number;
  quantity: number;
};

const CART_KEY = "msamen_cart";

function normalizeCartQuantity(unit: SaleUnit, quantity: number) {
  if (unit === "KG") {
    const rounded = Math.round(quantity * 4) / 4;
    return clamp(rounded, 0.25, 99);
  }
  return clamp(Math.floor(quantity), 1, 99);
}

function mergeCartItems(items: CartItem[]) {
  const merged = new Map<string, CartItem>();

  for (const item of items) {
    const key = `${item.productId}-${item.unit}`;
    const existing = merged.get(key);
    const quantity = normalizeCartQuantity(item.unit, item.quantity);

    if (existing) {
      merged.set(key, {
        ...existing,
        unitPrice: item.unitPrice,
        quantity: normalizeCartQuantity(existing.unit, existing.quantity + quantity),
      });
      continue;
    }

    merged.set(key, { ...item, quantity });
  }

  return Array.from(merged.values());
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function AddToCartButton({
  productId,
  name,
  saleMode,
  pricePerPiece,
  pricePerKg,
  fallbackPrice,
  locale,
  isClientAuthenticated = false,
  layout = "compact",
}: AddToCartButtonProps) {
  const [added, setAdded] = useState(false);
  const router = useRouter();
  const normalizedMode = normalizeSaleMode(saleMode);
  const [unit, setUnit] = useState<SaleUnit>(normalizedMode === "KG" ? "KG" : "PIECE");
  const [quantity, setQuantity] = useState<number>(normalizedMode === "KG" ? 0.25 : 1);

  const unitPrice = resolveUnitPrice(
    {
      saleMode: normalizedMode,
      pricePerPiece: pricePerPiece ?? null,
      pricePerKg: pricePerKg ?? null,
      price: fallbackPrice ?? null,
    },
    unit,
  );

  const isKg = unit === "KG";
  const step = isKg ? 0.25 : 1;
  const min = isKg ? 0.25 : 1;

  function normalizeQuantity(next: number) {
    if (!Number.isFinite(next) || next <= 0) {
      return min;
    }

    if (!isKg) {
      return clamp(Math.floor(next), 1, 99);
    }

    const rounded = Math.round(next * 4) / 4;
    return clamp(rounded, 0.25, 99);
  }

  function readCart() {
    const raw = typeof window !== "undefined" ? window.localStorage.getItem(CART_KEY) : "[]";
    if (!raw) {
      return [] as CartItem[];
    }

    try {
      return mergeCartItems(JSON.parse(raw) as CartItem[]);
    } catch {
      return [] as CartItem[];
    }
  }

  function writeCart(next: CartItem[]) {
    window.localStorage.setItem(CART_KEY, JSON.stringify(mergeCartItems(next)));
  }

  function saveItemToCart() {
    if (!unitPrice || unitPrice <= 0) {
      return false;
    }

    const parsed = readCart();

    const normalizedQuantity = normalizeQuantity(quantity);
    const existing = parsed.find((item) => item.productId === productId && item.unit === unit);

    let next: CartItem[];
    if (existing) {
      next = parsed.map((item) =>
        item.productId === productId && item.unit === unit
          ? {
              ...item,
              unitPrice,
              quantity: normalizeQuantity(item.quantity + normalizedQuantity),
            }
          : item,
      );
    } else {
      next = [...parsed, { productId, name, unit, unitPrice, quantity: normalizedQuantity }];
    }

    writeCart(next);
    return true;
  }

  function handleAdd() {
    if (!isClientAuthenticated) {
      router.push(`/${locale}/connexion?next=${encodeURIComponent(`/${locale}/panier`)}`);
      return;
    }

    const saved = saveItemToCart();
    if (!saved) {
      return;
    }

    setAdded(true);
    window.setTimeout(() => setAdded(false), 1200);
  }

  function handleBuyNow() {
    if (!isClientAuthenticated) {
      router.push(`/${locale}/connexion?next=${encodeURIComponent(`/${locale}/panier`)}`);
      return;
    }

    const saved = saveItemToCart();
    if (!saved) {
      return;
    }

    router.push(`/${locale}/panier`);
  }

  const subtotal = unitPrice && unitPrice > 0 ? unitPrice * normalizeQuantity(quantity) : 0;

  const unitLabel = unit === "PIECE" ? (locale === "fr" ? "piece" : "قطعة") : locale === "fr" ? "kg" : "كلغ";

  const pieceLabel = locale === "fr" ? "Prix par pièce" : "السعر للقطعة";
  const kgLabel = locale === "fr" ? "Par kg" : "بالكيلوغرام";

  const pieceOptionPrice = resolveUnitPrice(
    {
      saleMode: normalizedMode,
      pricePerPiece: pricePerPiece ?? null,
      pricePerKg: pricePerKg ?? null,
      price: fallbackPrice ?? null,
    },
    "PIECE",
  );
  const kgOptionPrice = resolveUnitPrice(
    {
      saleMode: normalizedMode,
      pricePerPiece: pricePerPiece ?? null,
      pricePerKg: pricePerKg ?? null,
      price: fallbackPrice ?? null,
    },
    "KG",
  );

  const isFullLayout = layout === "full";

  return (
    <div className="editorial-panel premium-outline mt-3 space-y-3 rounded-2xl border border-amber-200 bg-[linear-gradient(145deg,#fffdf7_0%,#fffbeb_100%)] p-4">
      {normalizedMode === "BOTH" ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">
            {locale === "fr" ? "Type de vente" : "نوع البيع"}
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setUnit("PIECE");
                setQuantity(1);
              }}
              className={`rounded-xl border px-3 py-2 text-left transition ${unit === "PIECE" ? "border-amber-800 bg-amber-900 text-white shadow-[0_14px_24px_rgba(122,53,17,0.18)]" : "border-amber-300 bg-white text-amber-900"}`}
            >
              <p>{pieceLabel}</p>
              <p className={`text-[11px] ${unit === "PIECE" ? "text-amber-100" : "text-amber-700"}`}>
                {pieceOptionPrice ? `${pieceOptionPrice.toFixed(2)} MAD` : "-"}
              </p>
            </button>
            <button
              type="button"
              onClick={() => {
                setUnit("KG");
                setQuantity(0.25);
              }}
              className={`rounded-xl border px-3 py-2 text-left transition ${unit === "KG" ? "border-amber-800 bg-amber-900 text-white shadow-[0_14px_24px_rgba(122,53,17,0.18)]" : "border-amber-300 bg-white text-amber-900"}`}
            >
              <p>{kgLabel}</p>
              <p className={`text-[11px] ${unit === "KG" ? "text-amber-100" : "text-amber-700"}`}>
                {kgOptionPrice ? `${kgOptionPrice.toFixed(2)} MAD` : "-"}
              </p>
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between rounded-xl border border-amber-300 bg-white px-3 py-2 text-sm font-semibold text-amber-900 shadow-[0_10px_20px_rgba(94,45,16,0.05)]">
          <span>{normalizedMode === "PIECE" ? pieceLabel : kgLabel}</span>
          <span>{unitPrice ? `${unitPrice.toFixed(2)} MAD` : "-"}</span>
        </div>
      )}

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">
          {locale === "fr" ? "Choisissez la quantité" : "اختر الكمية"}
        </p>
        <div className="flex items-center justify-between rounded-xl border border-amber-300 bg-white px-3 py-2 shadow-[0_10px_20px_rgba(94,45,16,0.05)]">
          <button
            type="button"
            onClick={() => setQuantity(normalizeQuantity(quantity - step))}
            className="h-8 w-8 rounded-md border border-amber-300 text-lg leading-none text-amber-900"
          >
            -
          </button>
          <div className="text-center">
            <p className="text-base font-semibold text-amber-950">{normalizeQuantity(quantity)}</p>
            <p className="text-[11px] text-amber-700">{unitLabel}</p>
          </div>
          <button
            type="button"
            onClick={() => setQuantity(normalizeQuantity(quantity + step))}
            className="h-8 w-8 rounded-md border border-amber-300 text-lg leading-none text-amber-900"
          >
            +
          </button>
        </div>
      </div>

      {isFullLayout ? (
        <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-white px-3 py-2 shadow-[0_10px_20px_rgba(94,45,16,0.05)]">
          <span className="text-xs font-semibold uppercase tracking-wide text-amber-800">
            {locale === "fr" ? "Sous-total" : "المجموع الفرعي"}
          </span>
          <span className="text-sm font-bold text-amber-950">{subtotal.toFixed(2)} MAD</span>
        </div>
      ) : null}

      <div className={isFullLayout ? "space-y-2" : "grid grid-cols-2 gap-2"}>
        <button
          type="button"
          onClick={handleAdd}
          disabled={!unitPrice}
          className="w-full rounded-xl border border-amber-900 bg-white px-4 py-2 text-sm font-semibold text-amber-950 transition hover:-translate-y-0.5 hover:bg-amber-100 hover:shadow-[0_14px_22px_rgba(94,45,16,0.08)] disabled:opacity-50"
        >
          {added
            ? locale === "fr"
              ? "Ajouté au panier"
              : "تمت الاضافة للسلة"
            : locale === "fr"
              ? "Ajouter au panier"
              : "أضف إلى السلة"}
        </button>
        <button
          type="button"
          onClick={handleBuyNow}
          disabled={!unitPrice}
          className="w-full rounded-xl bg-[linear-gradient(135deg,#b65a22_0%,#8f3e14_100%)] px-4 py-2 text-sm font-semibold text-white shadow-[0_14px_24px_rgba(122,53,17,0.2)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_28px_rgba(122,53,17,0.25)] disabled:opacity-50"
        >
          {locale === "fr" ? "Commander maintenant" : "اطلب الآن"}
        </button>
      </div>

      <p className="text-center text-xs font-semibold text-amber-800/80">
        {locale === "fr" ? "Plus de 50 commandes aujourd’hui" : "أكثر من 50 طلب اليوم"}
      </p>
    </div>
  );
}
