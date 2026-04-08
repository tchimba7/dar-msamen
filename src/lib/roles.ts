export const APP_ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN_USER: "ADMIN_USER",
  CLIENT: "CLIENT",
} as const;

export type AppRole = (typeof APP_ROLES)[keyof typeof APP_ROLES];

export function getRoleDashboardPath(locale: "fr" | "ar", role?: string | null) {
  if (role === APP_ROLES.SUPER_ADMIN) {
    return `/${locale}/super-admin`;
  }

  if (role === APP_ROLES.ADMIN_USER) {
    return `/${locale}/admin`;
  }

  return `/${locale}/client`;
}
