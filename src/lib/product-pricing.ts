export type SaleMode = "PIECE" | "KG" | "BOTH";
export type SaleUnit = "PIECE" | "KG";

type PriceInput = {
  saleMode?: string | null;
  price?: number | string | null;
  pricePerPiece?: number | string | null;
  pricePerKg?: number | string | null;
};

function toNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const next = typeof value === "number" ? value : Number(value);
  return Number.isFinite(next) ? next : null;
}

export function normalizeSaleMode(value: string | null | undefined): SaleMode {
  if (value === "KG" || value === "BOTH") {
    return value;
  }

  return "PIECE";
}

export function isUnitAllowed(saleMode: SaleMode, unit: SaleUnit) {
  if (saleMode === "BOTH") {
    return true;
  }
  if (saleMode === "PIECE") {
    return unit === "PIECE";
  }
  return unit === "KG";
}

export function resolveUnitPrice(input: PriceInput, unit: SaleUnit) {
  const saleMode = normalizeSaleMode(input.saleMode);
  const piecePrice = toNumber(input.pricePerPiece);
  const kgPrice = toNumber(input.pricePerKg);
  const fallback = toNumber(input.price);

  if (!isUnitAllowed(saleMode, unit)) {
    return null;
  }

  if (unit === "PIECE") {
    return piecePrice ?? fallback;
  }

  return kgPrice ?? fallback;
}

export function formatProductPriceLine(input: PriceInput, locale: "fr" | "ar") {
  const saleMode = normalizeSaleMode(input.saleMode);
  const piecePrice = resolveUnitPrice(input, "PIECE");
  const kgPrice = resolveUnitPrice(input, "KG");

  if (saleMode === "PIECE") {
    const label = locale === "fr" ? "pièce" : "قطعة";
    return `${(piecePrice ?? 0).toFixed(2)} MAD / ${label}`;
  }

  if (saleMode === "KG") {
    const label = locale === "fr" ? "kg" : "كلغ";
    return `${(kgPrice ?? 0).toFixed(2)} MAD / ${label}`;
  }

  const pieceLabel = locale === "fr" ? "pièce" : "قطعة";
  const kgLabel = locale === "fr" ? "kg" : "كلغ";
  return `${(piecePrice ?? 0).toFixed(2)} MAD / ${pieceLabel} • ${(kgPrice ?? 0).toFixed(2)} MAD / ${kgLabel}`;
}
