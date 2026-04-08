export function isMissingSchemaError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const maybeError = error as { message?: unknown; cause?: unknown; code?: unknown };
  const message = typeof maybeError.message === "string" ? maybeError.message.toLowerCase() : "";
  const code = typeof maybeError.code === "string" ? maybeError.code : "";

  if (code === "42703") {
    return true;
  }

  return (
    message.includes("phone_verified_at") ||
    (message.includes("column") && message.includes("does not exist"))
  );
}

export const MISSING_SCHEMA_MESSAGE =
  "Le schema de base n'est pas a jour. Exécutez: npm run db:migrate";
