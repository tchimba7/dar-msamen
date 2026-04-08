import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Dar Msamen",
    short_name: "Dar Msamen",
    description: "Cuisine traditionnelle marocaine avec parcours de commande COD.",
    start_url: "/fr",
    display: "standalone",
    background_color: "#f7efe4",
    theme_color: "#a54f1d",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
      {
        src: "/logo-dar-msamen.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/logo-dar-msamen.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}

