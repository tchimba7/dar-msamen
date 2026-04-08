export const DEFAULT_SITE_URL = "http://localhost:3001";

function normalizeUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return DEFAULT_SITE_URL;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed.replace(/\/$/, "");
  }

  return `https://${trimmed.replace(/\/$/, "")}`;
}

export function getSiteUrl() {
  const rawValue =
    process.env.NEXTAUTH_URL ??
    process.env.VERCEL_PROJECT_PRODUCTION_URL ??
    process.env.VERCEL_URL ??
    DEFAULT_SITE_URL;

  return normalizeUrl(rawValue);
}

export function getSiteUrlObject() {
  return new URL(getSiteUrl());
}

