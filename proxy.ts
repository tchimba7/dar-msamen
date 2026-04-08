import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

import { APP_ROLES } from "@/lib/roles";

const PUBLIC_LOCALE_ROUTES = new Set([
  "",
  "/produits",
  "/panier",
  "/connexion",
  "/inscription",
]);

function resolveLocale(pathname: string) {
  const parts = pathname.split("/").filter(Boolean);
  const locale = parts[0];
  if (locale === "fr" || locale === "ar") {
    return locale;
  }
  return null;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/") {
    return NextResponse.redirect(new URL("/fr", request.url));
  }

  const locale = resolveLocale(pathname);
  if (!locale) {
    return NextResponse.redirect(new URL(`/fr${pathname}`, request.url));
  }

  const normalizedPath = pathname.replace(`/${locale}`, "");
  if (PUBLIC_LOCALE_ROUTES.has(normalizedPath)) {
    return NextResponse.next();
  }

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    const loginUrl = new URL(`/${locale}/connexion`, request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role = token.role;

  if (normalizedPath.startsWith("/client") && role !== APP_ROLES.CLIENT) {
    return NextResponse.redirect(new URL(`/${locale}`, request.url));
  }

  if (normalizedPath.startsWith("/admin") && role !== APP_ROLES.ADMIN_USER) {
    return NextResponse.redirect(new URL(`/${locale}`, request.url));
  }

  if (normalizedPath.startsWith("/super-admin") && role !== APP_ROLES.SUPER_ADMIN) {
    return NextResponse.redirect(new URL(`/${locale}`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
