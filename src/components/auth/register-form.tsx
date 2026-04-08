"use client";

import { useActionState } from "react";

import type { AuthFormState } from "@/app/[locale]/(auth)/actions";
import { registerAction } from "@/app/[locale]/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Locale, t } from "@/lib/i18n";

type RegisterFormProps = {
  locale: Locale;
};

const initialState: AuthFormState = {};

export function RegisterForm({ locale }: RegisterFormProps) {
  const [state, action, pending] = useActionState(registerAction, initialState);
  const dict = t(locale);

  return (
    <form action={action} className="form-shell space-y-5 p-6 sm:p-7">
      <input type="hidden" name="locale" value={locale} />

      <div className="space-y-2">
        <p className="section-kicker">{locale === "fr" ? "Compte client" : "حساب الزبون"}</p>
        <p className="panel-caption">
          {locale === "fr"
            ? "Inscription rapide pour commander en COD, enregistrer vos coordonnées et suivre vos commandes."
            : "تسجيل سريع للطلب بالدفع عند الاستلام وحفظ بياناتك وتتبع طلباتك."}
        </p>
      </div>

      <div className="space-y-1">
        <label htmlFor="name" className="text-sm font-semibold text-amber-950">
          {locale === "fr" ? "Nom complet" : "الاسم الكامل"}
        </label>
        <input
          id="name"
          name="name"
          required
          className="w-full rounded-xl px-3 py-3"
        />
        {state.fieldErrors?.name ? <p className="text-xs text-red-700">{state.fieldErrors.name}</p> : null}
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
        {state.fieldErrors?.email ? <p className="text-xs text-red-700">{state.fieldErrors.email}</p> : null}
      </div>

      <div className="space-y-1">
        <label htmlFor="phone" className="text-sm font-semibold text-amber-950">
          {locale === "fr" ? "Téléphone" : "رقم الهاتف"}
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          required
          placeholder={locale === "fr" ? "+212612345678" : "+212612345678"}
          className="w-full rounded-xl px-3 py-3"
        />
        {state.fieldErrors?.phone ? <p className="text-xs text-red-700">{state.fieldErrors.phone}</p> : null}
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
        <p className="text-xs text-amber-900/70">
          {locale === "fr"
            ? "Minimum 8 caractères avec lettre, chiffre et caractère spécial."
            : "8 أحرف على الأقل مع حرف ورقم ورمز."}
        </p>
        {state.fieldErrors?.password ? <p className="text-xs text-red-700">{state.fieldErrors.password}</p> : null}
      </div>

      {state.error && !state.fieldErrors?.name && !state.fieldErrors?.email && !state.fieldErrors?.phone && !state.fieldErrors?.password ? (
        <p className="rounded-2xl border border-red-200 bg-red-50/90 px-3 py-2 text-sm text-red-700">{state.error}</p>
      ) : null}

      <Button type="submit" disabled={pending} className="w-full">
        {pending
          ? locale === "fr"
            ? "Création..."
            : "جاري الإنشاء..."
          : dict.navRegister}
      </Button>
    </form>
  );
}
