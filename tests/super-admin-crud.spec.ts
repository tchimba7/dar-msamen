import { expect, test } from "@playwright/test";

test("SUPER_ADMIN can create, update, and delete a product", async ({ page }) => {
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL ?? "admin@msamen.ma";
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD ?? "ChangeMe123!";
  const unique = Date.now();
  const initialName = `Produit E2E ${unique}`;
  const updatedName = `Produit E2E ${unique} MAJ`;

  await page.goto("/fr/connexion");
  await page.locator("#email").fill(superAdminEmail);
  await page.locator("#password").fill(superAdminPassword);
  await page.locator("button[type='submit']").click();

  await page.waitForURL("**/fr/super-admin", { timeout: 20_000 });

  await page.locator("a[href='/fr/super-admin/products']").first().click();
  await page.waitForURL("**/fr/super-admin/products", { timeout: 20_000 });

  const createProductForm = page
    .locator("form")
    .filter({ has: page.locator("input[name='pricePerPiece']") })
    .filter({ has: page.getByRole("button", { name: "Ajouter" }) })
    .first();

  await expect(createProductForm).toBeVisible({ timeout: 20_000 });
  await createProductForm.locator("input[name='name']").fill(initialName);
  await createProductForm.locator("input[name='pricePerPiece']").fill("27.50");
  await createProductForm.locator("textarea[name='description']").fill("Produit créé par Playwright");
  await createProductForm.locator("button[type='submit']", { hasText: "Ajouter" }).click();

  const managedFormByInitialName = page
    .locator("form")
    .filter({ has: page.locator(`input[name='name'][value='${initialName}']`) })
    .first();

  await expect(managedFormByInitialName).toBeVisible({ timeout: 20_000 });

  await managedFormByInitialName.locator("input[name='name']").fill(updatedName);
  await managedFormByInitialName.locator("button[type='submit']", { hasText: "Mettre à jour" }).click();

  const managedFormByUpdatedName = page
    .locator("form")
    .filter({ has: page.locator(`input[name='name'][value='${updatedName}']`) })
    .first();

  await expect(managedFormByUpdatedName).toBeVisible({ timeout: 20_000 });

  await managedFormByUpdatedName.locator("button[type='submit']", { hasText: "Supprimer" }).click();

  await expect(
    page.locator("form").filter({ has: page.locator(`input[name='name'][value='${updatedName}']`) }),
  ).toHaveCount(0, { timeout: 20_000 });
});
