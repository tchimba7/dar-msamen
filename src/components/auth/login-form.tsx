"use client";

import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Locale, t } from "@/lib/i18n";
import { getRoleDashboardPath } from "@/lib/roles";

type LoginFormProps = {
  locale: Locale;
  nextPath?: string;
  phoneVerificationRequired: boolean;
};

export function LoginForm({
  locale,
  nextPath,
  phoneVerificationRequired,
}: LoginFormProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const dict = t(locale);

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      setError(null);

      const email = String(formData.get("email") ?? "").trim();
      const password = String(formData.get("password") ?? "").trim();
      const callbackUrl = nextPath || `/${locale}`;

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl,
      });

      if (!result || result.error) {
        setError("Email ou mot de passe invalide.");
        return;
      }

      const sessionResponse = await fetch("/api/auth/session", { cache: "no-store" });
      const session = (await sessionResponse.json()) as {
        user?: { role?: string; phoneVerified?: boolean };
      };

      if (
        phoneVerificationRequired &&
        session.user?.role === "CLIENT" &&
        !session.user.phoneVerified
      ) {
        window.location.assign(nextPath || `/${locale}/client/verification-telephone`);
        return;
      }

      if (nextPath) {
        const isVerificationTarget = nextPath.includes("/client/verification-telephone");
        if (
          !isVerificationTarget ||
          (phoneVerificationRequired &&
            session.user?.role === "CLIENT" &&
            !session.user.phoneVerified)
        ) {
          window.location.assign(nextPath);
          return;
        }
      }

      const destination = getRoleDashboardPath(locale, session.user?.role);

      window.location.assign(destination);
    });
  }

  return (
    <form action={onSubmit} className="form-shell space-y-5 p-6 sm:p-7">
      <div className="space-y-2">
        <p className="section-kicker">{locale === "fr" ? "Accès sécurisé" : "دخول آمن"}</p>
        <p className="panel-caption">
          {locale === "fr"
            ? "Connectez-vous pour gérer vos commandes, votre espace client ou vos opérations d’administration."
            : "سجل الدخول لإدارة طلباتك أو مساحة الزبون أو مهام الإدارة."}
        </p>
      </div>

      <div className="space-y-1">
        <label htmlFor="email" className="text-sm font-semibold text-amber-950">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="w-full rounded-xl px-3 py-3"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="password" className="text-sm font-semibold text-amber-950">
          {locale === "fr" ? "Mot de passe" : "كلمة المرور"}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          minLength={8}
          required
          className="w-full rounded-xl px-3 py-3"
        />
      </div>

      {error ? (
        <p className="rounded-2xl border border-red-200 bg-red-50/90 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={pending} className="w-full">
        {pending
          ? locale === "fr"
            ? "Connexion..."
            : "جاري تسجيل الدخول..."
          : dict.navLogin}
      </Button>
    </form>
  );
}
