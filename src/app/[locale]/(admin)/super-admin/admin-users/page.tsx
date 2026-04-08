import Link from "next/link";

import { getAuthSession } from "@/auth";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { users } from "@/db/schema";
import { Locale, t } from "@/lib/i18n";
import { db } from "@/lib/db";
import { desc, eq } from "drizzle-orm";

import { createAdminUserAction } from "../actions";

export default async function SuperAdminUsersPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const session = await getAuthSession();
  const dict = t(locale);

  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return <p className="text-red-700">{dict.roleDenied}</p>;
  }

  const allAdminUsers = await db
    .select({ id: users.id, name: users.name, email: users.email, createdAt: users.createdAt })
    .from(users)
    .where(eq(users.role, "ADMIN_USER"))
    .orderBy(desc(users.createdAt));

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-3xl font-bold text-amber-950">{locale === "fr" ? "Espace admin users" : "إدارة المستخدمين الإداريين"}</h1>
        <Link href={`/${locale}/super-admin`}>
          <Button variant="secondary">{locale === "fr" ? "Retour dashboard" : "العودة للوحة"}</Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardTitle>{locale === "fr" ? "Créer ADMIN_USER" : "إنشاء مستخدم إداري"}</CardTitle>
          <CardDescription>
            {locale === "fr"
              ? "Créer un utilisateur admin qui sera redirigé vers /admin après connexion."
              : "إنشاء مستخدم إداري سيتم توجيهه إلى /admin بعد تسجيل الدخول."}
          </CardDescription>
          <form action={createAdminUserAction} className="mt-4 space-y-2">
            <input type="hidden" name="locale" value={locale} />
            <input
              name="name"
              placeholder={locale === "fr" ? "Nom" : "الاسم"}
              required
              className="w-full rounded-md border border-amber-300 px-3 py-2"
            />
            <input
              type="email"
              name="email"
              placeholder="admin.user@msamen.ma"
              required
              className="w-full rounded-md border border-amber-300 px-3 py-2"
            />
            <input
              type="password"
              name="password"
              minLength={8}
              placeholder={locale === "fr" ? "Mot de passe" : "كلمة المرور"}
              required
              className="w-full rounded-md border border-amber-300 px-3 py-2"
            />
            <button className="rounded-md bg-amber-700 px-4 py-2 text-sm font-semibold text-white" type="submit">
              {locale === "fr" ? "Créer ADMIN_USER" : "إنشاء مستخدم إداري"}
            </button>
          </form>
        </Card>

        <Card>
          <CardTitle>{locale === "fr" ? "Admins existants" : "المستخدمون الإداريون"}</CardTitle>
          <CardDescription>
            {locale === "fr"
              ? `${allAdminUsers.length} comptes ADMIN_USER`
              : `${allAdminUsers.length} حساب إداري`}
          </CardDescription>
          <div className="mt-4 space-y-2 text-sm text-amber-900">
            {allAdminUsers.length === 0 ? (
              <p>{locale === "fr" ? "Aucun admin user pour le moment." : "لا يوجد مستخدم إداري حالياً."}</p>
            ) : (
              allAdminUsers.map((adminUser) => (
                <p key={adminUser.id}>
                  {adminUser.name} - {adminUser.email}
                </p>
              ))
            )}
          </div>
        </Card>
      </div>
    </section>
  );
}
