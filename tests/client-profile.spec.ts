import { expect, test } from "@playwright/test";
import { Client } from "pg";

async function markPhoneVerifiedByEmail(email: string) {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required for e2e tests");
  }

  const client = new Client({ connectionString });
  await client.connect();
  await client.query("UPDATE users SET phone_verified_at = NOW() WHERE email = $1", [email]);
  await client.end();
}

test("Client can update profile phone and address", async ({ page }) => {
  const unique = Date.now();
  const clientEmail = `profile.${unique}@msamen.ma`;
  const clientPassword = `Client@${unique}x`;
  const clientPhone = `06${String(unique).slice(-8).padStart(8, "0")}`;
  const updatedLocalPhone = `07${String(unique + 1).slice(-8).padStart(8, "0")}`;
  const updatedE164Phone = `+212${updatedLocalPhone.slice(1)}`;

  await page.goto("/fr/inscription");
  await page.locator("#name").fill("Client Profil Test");
  await page.locator("#email").fill(clientEmail);
  await page.locator("#phone").fill(clientPhone);
  await page.locator("#password").fill(clientPassword);
  await page.locator("button[type='submit']").click();

  await page.waitForURL(
    (url) =>
      url.pathname.endsWith("/verification-inscription") || url.pathname.endsWith("/client"),
    { timeout: 20_000 },
  );

  if (page.url().includes("/verification-inscription")) {
    await markPhoneVerifiedByEmail(clientEmail);

    await page.goto("/fr/connexion");

    await page.locator("#email").fill(clientEmail);
    await page.locator("#password").fill(clientPassword);
    await page.locator("button[type='submit']").click();
  }

  await page.waitForURL("**/fr/client", { timeout: 20_000 });

  await page.goto("/fr/client/profil");
  await page.waitForURL("**/fr/client/profil", { timeout: 20_000 });

  await page.locator("input[name='phone']").fill(updatedE164Phone);
  await page.locator("input[name='addressLine']").fill("25 Rue Anfa");
  await page.locator("input[name='city']").fill("Casablanca");

  await page.getByRole("button", { name: "Enregistrer" }).click();

  await page.waitForURL("**/fr/client/profil?updated=1", { timeout: 20_000 });
  await expect(page.getByText("Vos informations ont été mises à jour.")).toBeVisible();

  await page.reload();

  await expect(page.locator("input[name='phone']")).toHaveValue(updatedLocalPhone);
  await expect(page.locator("input[name='addressLine']")).toHaveValue("25 Rue Anfa");
  await expect(page.locator("input[name='city']")).toHaveValue("Casablanca");
});
