import type { Metadata } from "next";
import { Fraunces, Noto_Sans_Arabic } from "next/font/google";
import "./globals.css";

import { getSiteUrlObject } from "@/lib/site";

const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
});

const notoArabic = Noto_Sans_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic", "latin"],
});

export const metadata: Metadata = {
  metadataBase: getSiteUrlObject(),
  title: {
    default: "Dar Msamen",
    template: "%s | Dar Msamen",
  },
  description: "Plateforme multi-roles pour cuisine traditionnelle marocaine en paiement à la livraison.",
  applicationName: "Dar Msamen",
  keywords: [
    "msamen",
    "harcha",
    "malwi",
    "batbot",
    "cuisine marocaine",
    "paiement COD",
  ],
  alternates: {
    canonical: "/fr",
    languages: {
      fr: "/fr",
      ar: "/ar",
    },
  },
  openGraph: {
    title: "Dar Msamen",
    description: "Cuisine traditionnelle marocaine avec parcours de commande COD.",
    url: "/fr",
    siteName: "Dar Msamen",
    locale: "fr_MA",
    alternateLocale: ["ar_MA"],
    type: "website",
    images: [
      {
        url: "/logo-dar-msamen.png",
        width: 512,
        height: 512,
        alt: "Dar Msamen",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Dar Msamen",
    description: "Cuisine traditionnelle marocaine avec parcours de commande COD.",
    images: ["/logo-dar-msamen.png"],
  },
  manifest: "/manifest.webmanifest",
  category: "food",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      data-scroll-behavior="smooth"
      className={`${fraunces.variable} ${notoArabic.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
