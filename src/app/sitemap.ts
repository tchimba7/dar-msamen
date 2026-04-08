import type { MetadataRoute } from "next";
import { eq } from "drizzle-orm";

import { getSiteUrl } from "@/lib/site";

const PUBLIC_PATHS = ["", "/produits"] as const;
const LOCALES = ["fr", "ar"] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = LOCALES.flatMap((locale) =>
    PUBLIC_PATHS.map((path) => ({
      url: `${siteUrl}/${locale}${path}`,
      lastModified: now,
      changeFrequency: path === "" ? "daily" : "weekly",
      priority: path === "" ? 1 : 0.8,
    })),
  );

  try {
    const [{ db }, { products }] = await Promise.all([
      import("@/lib/db"),
      import("@/db/schema"),
    ]);

    const catalog = await db
      .select({
        slug: products.slug,
        updatedAt: products.updatedAt,
        imageUrl: products.imageUrl,
      })
      .from(products)
      .where(eq(products.isActive, true));

    const productEntries: MetadataRoute.Sitemap = catalog.flatMap((product) =>
      LOCALES.map((locale) => ({
        url: `${siteUrl}/${locale}/produits/${product.slug}`,
        lastModified: product.updatedAt ?? now,
        changeFrequency: "weekly",
        priority: 0.7,
        images: product.imageUrl ? [`${siteUrl}${product.imageUrl}`] : undefined,
      })),
    );

    return [...staticEntries, ...productEntries];
  } catch {
    return staticEntries;
  }
}

