"use client";

import { useMemo, useState } from "react";

type SaleMode = "PIECE" | "KG" | "BOTH";

type SaleModePriceFieldsProps = {
  locale: "fr" | "ar";
  defaultSaleMode?: SaleMode;
  defaultPricePerPiece?: string | number | null;
  defaultPricePerKg?: string | number | null;
};

function normalizeSaleMode(value: string | null | undefined): SaleMode {
  if (value === "KG" || value === "BOTH") {
    return value;
  }
  return "PIECE";
}

function toInputValue(value: string | number | null | undefined) {
  if (value === null || value === undefined) {
    return "";
  }
  return String(value);
}

export function SaleModePriceFields({
  locale,
  defaultSaleMode = "PIECE",
  defaultPricePerPiece,
  defaultPricePerKg,
}: SaleModePriceFieldsProps) {
  const [saleMode, setSaleMode] = useState<SaleMode>(normalizeSaleMode(defaultSaleMode));

  const labels = useMemo(
    () => ({
      salePiece: locale === "fr" ? "Vente par piece" : "بيع بالقطعة",
      saleKg: locale === "fr" ? "Vente par kilogramme" : "بيع بالكيلوغرام",
      saleBoth: locale === "fr" ? "Piece et kilogramme" : "بالقطعة وبالكيلوغرام",
      pricePiece: locale === "fr" ? "Prix par piece (MAD)" : "سعر القطعة (درهم)",
      priceKg: locale === "fr" ? "Prix par kg (MAD)" : "سعر الكيلوغرام (درهم)",
    }),
    [locale],
  );

  const showPiece = saleMode === "PIECE" || saleMode === "BOTH";
  const showKg = saleMode === "KG" || saleMode === "BOTH";

  return (
    <>
      <select
        name="saleMode"
        value={saleMode}
        onChange={(event) => setSaleMode(normalizeSaleMode(event.target.value))}
        className="w-full rounded-md border border-amber-300 px-3 py-2"
      >
        <option value="PIECE">{labels.salePiece}</option>
        <option value="KG">{labels.saleKg}</option>
        <option value="BOTH">{labels.saleBoth}</option>
      </select>

      {showPiece ? (
        <input
          name="pricePerPiece"
          type="number"
          min="0.01"
          step="0.01"
          defaultValue={toInputValue(defaultPricePerPiece)}
          placeholder={labels.pricePiece}
          className="w-full rounded-md border border-amber-300 px-3 py-2"
        />
      ) : null}

      {showKg ? (
        <input
          name="pricePerKg"
          type="number"
          min="0.01"
          step="0.01"
          defaultValue={toInputValue(defaultPricePerKg)}
          placeholder={labels.priceKg}
          className="w-full rounded-md border border-amber-300 px-3 py-2"
        />
      ) : null}
    </>
  );
}
