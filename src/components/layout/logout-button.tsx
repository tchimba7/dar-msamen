"use client";

import { useTransition } from "react";
import { signOut } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Locale } from "@/lib/i18n";

type LogoutButtonProps = {
  locale: Locale;
  label: string;
};

export function LogoutButton({ locale, label }: LogoutButtonProps) {
  const [pending, startTransition] = useTransition();

  function handleLogout() {
    startTransition(async () => {
      await signOut({ callbackUrl: `/${locale}` });
    });
  }

  return (
    <Button type="button" variant="secondary" disabled={pending} onClick={handleLogout}>
      {pending
        ? locale === "fr"
          ? "Déconnexion..."
          : "جاري تسجيل الخروج..."
        : label}
    </Button>
  );
}
