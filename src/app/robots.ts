import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/fr", "/ar", "/fr/produits", "/ar/produits"],
        disallow: [
          "/fr/admin",
          "/ar/admin",
          "/fr/client",
          "/ar/client",
          "/fr/super-admin",
          "/ar/super-admin",
          "/fr/connexion",
          "/ar/connexion",
          "/fr/inscription",
          "/ar/inscription",
          "/fr/panier",
          "/ar/panier",
          "/api/",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}

