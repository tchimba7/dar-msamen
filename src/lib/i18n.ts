export const locales = ["fr", "ar"] as const;

export type Locale = (typeof locales)[number];

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export function getDirection(locale: Locale) {
  return locale === "ar" ? "rtl" : "ltr";
}

type Dictionary = {
  brand: string;
  subtitle: string;
  navProducts: string;
  navCart: string;
  navLogin: string;
  navRegister: string;
  navLogout: string;
  navClient: string;
  navAdmin: string;
  navSuperAdmin: string;
  heroTitle: string;
  heroText: string;
  heroCta: string;
  sectionNew: string;
  roleDenied: string;
  loginTitle: string;
  registerTitle: string;
};

const dictionary: Record<Locale, Dictionary> = {
  fr: {
    brand: "Dar Msamen",
    subtitle: "Atelier culinaire marocain premium",
    navProducts: "Produits",
    navCart: "Panier",
    navLogin: "Connexion",
    navRegister: "Inscription",
    navLogout: "Déconnexion",
    navClient: "Espace client",
    navAdmin: "Espace utilisateur admin",
    navSuperAdmin: "Espace super admin",
    heroTitle: "Le goût marocain authentique, préparé frais et livré chez vous",
    heroText:
      "Des recettes artisanales préparées chaque matin, avec une livraison rapide et un paiement à la réception pour une expérience simple et fiable.",
    heroCta: "Découvrir les produits",
    sectionNew: "Sélection du moment",
    roleDenied: "Accès non autorisé pour ce rôle.",
    loginTitle: "Connexion",
    registerTitle: "Inscription client",
  },
  ar: {
    brand: "دار المسمن",
    subtitle: "ورشة مغربية بطابع احترافي",
    navProducts: "المنتجات",
    navCart: "السلة",
    navLogin: "تسجيل الدخول",
    navRegister: "إنشاء حساب",
    navLogout: "تسجيل الخروج",
    navClient: "فضاء الزبون",
    navAdmin: "فضاء المستخدم الإداري",
    navSuperAdmin: "فضاء المشرف العام",
    heroTitle: "الطعم المغربي الأصيل، يُحضّر طازجاً ويصلك إلى باب منزلك",
    heroText:
      "وصفات تقليدية تُحضّر يومياً بعناية، مع توصيل سريع ودفع عند الاستلام لتجربة سهلة وموثوقة.",
    heroCta: "اكتشف المنتجات",
    sectionNew: "اختيارات هذا اليوم",
    roleDenied: "ليس لديك صلاحية الوصول إلى هذه الصفحة.",
    loginTitle: "تسجيل الدخول",
    registerTitle: "تسجيل الزبون",
  },
};

export function t(locale: Locale) {
  return dictionary[locale];
}
