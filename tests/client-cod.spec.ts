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

test("Client can sign up, add to cart, and place COD order", async ({ page }) => {
  const unique = Date.now();
  const clientEmail = `client.${unique}@msamen.ma`;
  const clientPassword = `Client@${unique}x`;
  const clientPhone = `06${String(unique).slice(-8).padStart(8, "0")}`;

  await page.goto("/fr/inscription");
  await page.locator("#name").fill("Client Test");
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

  await page.goto("/fr/produits");
  await page.getByRole("button", { name: "Ajouter au panier" }).first().click();
  await page.getByRole("link", { name: "Voir panier" }).click();

  await page.waitForURL("**/fr/panier", { timeout: 20_000 });

  await page.locator("input[type='number']").first().fill("4");
  await page
    .locator("select[name='deliveryZoneId']")
    .selectOption({ label: "Casablanca centre - 15.00 MAD" });
  await page
    .locator("select[name='deliverySlotId']")
    .selectOption({ label: "Matin 09:00 - 12:00" });
  await page.locator("input[name='addressLine']").fill("12 Rue Atlas, Casablanca");
  await page.locator("input[name='phone']").fill(clientPhone);
  await page.locator("textarea[name='notes']").fill("Commande test E2E");

  await page.getByRole("button", { name: /Confirmer( la)? commande/ }).click();

  await page.waitForURL("**/fr/client?ordered=1", { timeout: 20_000 });
  await expect(
    page.getByText("Commande COD confirmée. Vérifiez votre espace pour le suivi et la confirmation WhatsApp."),
  ).toBeVisible();
});
