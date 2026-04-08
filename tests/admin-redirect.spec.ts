import { expect, test } from "@playwright/test";

test("ADMIN_USER login redirects to /fr/admin", async ({ page }) => {
  const adminEmail = process.env.ADMIN_USER_TEST_EMAIL ?? "admin.user@msamen.ma";
  const adminPassword = process.env.ADMIN_USER_TEST_PASSWORD ?? "ChangeMe123!";

  await page.goto("/fr/connexion");

  await page.locator("#email").fill(adminEmail);
  await page.locator("#password").fill(adminPassword);
  await page.locator("button[type='submit']").click();

  await page.waitForURL("**/fr/admin", { timeout: 20_000 });
  await expect(page).toHaveURL(/\/fr\/admin$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Espace utilisateur admin");
  await expect(page.getByText("Mes produits")).toBeVisible();
});
