"use server";

import { redirect } from "next/navigation";

export async function createProductReviewAction(formData: FormData) {
  const locale = String(formData.get("locale") ?? "fr");
  const slug = String(formData.get("slug") ?? "").trim();
  const productId = String(formData.get("productId") ?? "").trim();
  const reviewerName = String(formData.get("reviewerName") ?? "").trim();
  const comment = String(formData.get("comment") ?? "").trim();
  const ratingRaw = String(formData.get("rating") ?? "5").trim();

  const rating = Number(ratingRaw);
  if (!slug || !productId || !reviewerName || !comment || !Number.isFinite(rating)) {
    redirect(`/${locale}/produits/${slug}?review=invalid`);
  }

  const safeRating = Math.max(1, Math.min(5, Math.floor(rating)));

  const [{ db }, { productReviews }] = await Promise.all([
    import("@/lib/db"),
    import("@/db/schema"),
  ]);

  await db.insert(productReviews).values({
    productId,
    reviewerName,
    rating: safeRating,
    comment,
  });

  redirect(`/${locale}/produits/${slug}?review=ok`);
}
