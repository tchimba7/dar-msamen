/* eslint-disable @next/next/no-img-element */

"use client";

import { useMemo, useState } from "react";

type ProductImageGalleryProps = {
  images: string[];
  productName: string;
};

export function ProductImageGallery({ images, productName }: ProductImageGalleryProps) {
  const cleaned = useMemo(() => images.filter((image) => image.trim().length > 0), [images]);
  const [activeIndex, setActiveIndex] = useState(0);

  if (cleaned.length === 0) {
    return (
      <div className="flex h-80 items-center justify-center rounded-2xl border border-dashed border-amber-300 bg-amber-50 text-amber-800 md:h-[520px]">
        Aucune photo
      </div>
    );
  }

  const activeImage = cleaned[Math.min(activeIndex, cleaned.length - 1)] ?? cleaned[0];

  return (
    <div className="space-y-3">
      <img
        src={activeImage}
        alt={productName}
        className="h-80 w-full rounded-2xl border border-amber-200 object-cover md:h-[520px]"
      />
      {cleaned.length > 1 ? (
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
          {cleaned.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`overflow-hidden rounded-xl border ${index === activeIndex ? "border-amber-800" : "border-amber-200"}`}
            >
              <img src={image} alt={`${productName} ${index + 1}`} className="h-16 w-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
