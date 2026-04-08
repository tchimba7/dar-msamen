"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getAuthSession } from "@/auth";
import { canTransitionOrderStatus, ORDER_STATUS_OPTIONS } from "@/lib/order-status";
import { hashPassword } from "@/lib/password";
import { normalizeSaleMode } from "@/lib/product-pricing";
import { translateProductTextsToArabic } from "@/lib/product-translation";
import { isSupportedProductImageFile, saveUploadedProductImages } from "@/lib/upload";

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

async function assertSuperAdmin() {
  const session = await getAuthSession();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    throw new Error("Unauthorized");
  }
  return session.user.id;
}

function redirectSuperAdminProductsError(locale: string, code: string) {
  redirect(`/${locale}/super-admin/products?error=${encodeURIComponent(code)}`);
}

function parsePositivePrice(value: string) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

function extractUploadedProductFiles(formData: FormData) {
  const files = formData
    .getAll("imageFiles")
    .filter((item): item is File => item instanceof File && item.size > 0);

  const legacyFile = formData.get("imageFile");
  if (legacyFile instanceof File && legacyFile.size > 0) {
    files.unshift(legacyFile);
  }

  return files;
}

function parseGalleryLines(rawGallery: string) {
  return rawGallery
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function buildProductImages(rawPrimary: string, rawGallery: string, uploadedUrls: string[]) {
  let primary = uploadedUrls[0] ?? (rawPrimary || null);
  let gallery = [...parseGalleryLines(rawGallery), ...uploadedUrls.slice(1)];

  const deduped = new Set<string>();
  gallery = gallery.filter((url) => {
    if (deduped.has(url)) {
      return false;
    }
    deduped.add(url);
    return true;
  });

  if (primary) {
    gallery = gallery.filter((url) => url !== primary);
  }

  if (!primary && gallery.length > 0) {
    primary = gallery[0] ?? null;
    gallery = gallery.slice(1);
  }

  return {
    imageUrl: primary,
    imageGallery: gallery.length > 0 ? gallery.join("\n") : null,
  };
}

export async function createAdminUserAction(formData: FormData) {
  await assertSuperAdmin();

  const locale = String(formData.get("locale") ?? "fr");
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "").trim();

  if (!name || !email || password.length < 8) {
    throw new Error("Invalid admin user payload");
  }

  const [{ db }, { users }, { eq }] = await Promise.all([
    import("@/lib/db"),
    import("@/db/schema"),
    import("drizzle-orm"),
  ]);

  const existing = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (existing) {
    revalidatePath(`/${locale}/super-admin`);
    revalidatePath(`/${locale}/super-admin/admin-users`);
    return;
  }

  await db.insert(users).values({
    name,
    email,
    passwordHash: await hashPassword(password),
    role: "ADMIN_USER",
  });

  revalidatePath(`/${locale}/super-admin`);
  revalidatePath(`/${locale}/super-admin/admin-users`);
}

export async function createCategoryAction(formData: FormData) {
  const createdBy = await assertSuperAdmin();

  const locale = String(formData.get("locale") ?? "fr");
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!name) {
    throw new Error("Category name is required");
  }

  const [{ db }, { categories }, { eq }] = await Promise.all([
    import("@/lib/db"),
    import("@/db/schema"),
    import("drizzle-orm"),
  ]);

  const baseSlug = slugify(name) || "categorie";
  let slug = baseSlug;
  let index = 1;

  while (
    await db.query.categories.findFirst({
      where: eq(categories.slug, slug),
    })
  ) {
    slug = `${baseSlug}-${index++}`;
  }

  await db.insert(categories).values({
    name,
    slug,
    description: description || null,
    createdBy,
  });

  revalidatePath(`/${locale}/super-admin`);
  revalidatePath(`/${locale}/super-admin/categories`);
  revalidatePath(`/${locale}/produits`);
}

export async function updateCategoryAction(formData: FormData) {
  await assertSuperAdmin();

  const locale = String(formData.get("locale") ?? "fr");
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!id || !name) {
    throw new Error("Invalid category payload");
  }

  const [{ db }, { categories }, { eq }] = await Promise.all([
    import("@/lib/db"),
    import("@/db/schema"),
    import("drizzle-orm"),
  ]);

  await db
    .update(categories)
    .set({
      name,
      description: description || null,
    })
    .where(eq(categories.id, id));

  revalidatePath(`/${locale}/super-admin`);
  revalidatePath(`/${locale}/super-admin/categories`);
  revalidatePath(`/${locale}/produits`);
}

export async function deleteCategoryAction(formData: FormData) {
  await assertSuperAdmin();

  const locale = String(formData.get("locale") ?? "fr");
  const id = String(formData.get("id") ?? "");

  if (!id) {
    throw new Error("Category id is required");
  }

  const [{ db }, { categories }, { eq }] = await Promise.all([
    import("@/lib/db"),
    import("@/db/schema"),
    import("drizzle-orm"),
  ]);

  await db.delete(categories).where(eq(categories.id, id));

  revalidatePath(`/${locale}/super-admin`);
  revalidatePath(`/${locale}/super-admin/categories`);
  revalidatePath(`/${locale}/produits`);
}

export async function createProductAction(formData: FormData) {
  const createdBy = await assertSuperAdmin();

  const locale = String(formData.get("locale") ?? "fr");
  const name = String(formData.get("name") ?? "").trim();
  const shortDescription = String(formData.get("shortDescription") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const rawMaterials = String(formData.get("rawMaterials") ?? "").trim();
  const imageGallery = String(formData.get("imageGallery") ?? "").trim();
  const nutritionFacts = String(formData.get("nutritionFacts") ?? "").trim();
  const recommendations = String(formData.get("recommendations") ?? "").trim();
  const imageUrl = String(formData.get("imageUrl") ?? "").trim();
  const imageFiles = extractUploadedProductFiles(formData);
  const saleMode = normalizeSaleMode(String(formData.get("saleMode") ?? "PIECE"));
  const rawPricePerPiece = String(formData.get("pricePerPiece") ?? "").trim();
  const rawPricePerKg = String(formData.get("pricePerKg") ?? "").trim();
  const categoryId = String(formData.get("categoryId") ?? "").trim();
  const isNew = String(formData.get("isNew") ?? "") === "on";

  const pricePerPiece = parsePositivePrice(rawPricePerPiece);
  const pricePerKg = parsePositivePrice(rawPricePerKg);

  if (!name) {
    throw new Error("Invalid product payload");
  }

  if (saleMode === "PIECE" && !pricePerPiece) {
    redirectSuperAdminProductsError(locale, "pricing");
  }

  if (saleMode === "KG" && !pricePerKg) {
    redirectSuperAdminProductsError(locale, "pricing");
  }

  if (saleMode === "BOTH" && (!pricePerPiece || !pricePerKg)) {
    redirectSuperAdminProductsError(locale, "pricing");
  }

  if (imageFiles.some((file) => !isSupportedProductImageFile(file))) {
    redirectSuperAdminProductsError(locale, "image_format");
  }

  const [{ db }, { products }, { eq }] = await Promise.all([
    import("@/lib/db"),
    import("@/db/schema"),
    import("drizzle-orm"),
  ]);

  const baseSlug = slugify(name) || "produit";
  let slug = baseSlug;
  let index = 1;

  while (
    await db.query.products.findFirst({
      where: eq(products.slug, slug),
    })
  ) {
    slug = `${baseSlug}-${index++}`;
  }

  const uploadedImageUrls = await saveUploadedProductImages(imageFiles);
  const translatedAr = await translateProductTextsToArabic({
    shortDescription,
    description,
    rawMaterials,
    nutritionFacts,
    recommendations,
  });
  const { imageUrl: normalizedImageUrl, imageGallery: normalizedImageGallery } = buildProductImages(
    imageUrl,
    imageGallery,
    uploadedImageUrls,
  );

  await db.insert(products).values({
    name,
    slug,
    shortDescription: shortDescription || null,
    shortDescriptionAr: translatedAr.shortDescription || null,
    description: description || null,
    descriptionAr: translatedAr.description || null,
    rawMaterials: rawMaterials || null,
    rawMaterialsAr: translatedAr.rawMaterials || null,
    imageGallery: normalizedImageGallery,
    nutritionFacts: nutritionFacts || null,
    nutritionFactsAr: translatedAr.nutritionFacts || null,
    recommendations: recommendations || null,
    recommendationsAr: translatedAr.recommendations || null,
    imageUrl: normalizedImageUrl,
    price: String(pricePerPiece ?? pricePerKg),
    saleMode,
    pricePerPiece: pricePerPiece ? pricePerPiece.toFixed(2) : null,
    pricePerKg: pricePerKg ? pricePerKg.toFixed(2) : null,
    categoryId: categoryId || null,
    isNew,
    isActive: true,
    createdBy,
  });

  revalidatePath(`/${locale}/super-admin`);
  revalidatePath(`/${locale}/super-admin/products`);
  revalidatePath(`/${locale}/produits`);
}

export async function updateProductAction(formData: FormData) {
  await assertSuperAdmin();

  const locale = String(formData.get("locale") ?? "fr");
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const shortDescription = String(formData.get("shortDescription") ?? "").trim();
  const saleMode = normalizeSaleMode(String(formData.get("saleMode") ?? "PIECE"));
  const rawPricePerPiece = String(formData.get("pricePerPiece") ?? "").trim();
  const rawPricePerKg = String(formData.get("pricePerKg") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const rawMaterials = String(formData.get("rawMaterials") ?? "").trim();
  const imageGallery = String(formData.get("imageGallery") ?? "").trim();
  const nutritionFacts = String(formData.get("nutritionFacts") ?? "").trim();
  const recommendations = String(formData.get("recommendations") ?? "").trim();
  const imageUrl = String(formData.get("imageUrl") ?? "").trim();
  const imageFiles = extractUploadedProductFiles(formData);
  const categoryId = String(formData.get("categoryId") ?? "").trim();
  const isActive = String(formData.get("isActive") ?? "") === "on";

  const pricePerPiece = parsePositivePrice(rawPricePerPiece);
  const pricePerKg = parsePositivePrice(rawPricePerKg);

  if (!id || !name) {
    throw new Error("Invalid product payload");
  }

  if (saleMode === "PIECE" && !pricePerPiece) {
    redirectSuperAdminProductsError(locale, "pricing");
  }

  if (saleMode === "KG" && !pricePerKg) {
    redirectSuperAdminProductsError(locale, "pricing");
  }

  if (saleMode === "BOTH" && (!pricePerPiece || !pricePerKg)) {
    redirectSuperAdminProductsError(locale, "pricing");
  }

  if (imageFiles.some((file) => !isSupportedProductImageFile(file))) {
    redirectSuperAdminProductsError(locale, "image_format");
  }

  const [{ db }, { products }, { eq }] = await Promise.all([
    import("@/lib/db"),
    import("@/db/schema"),
    import("drizzle-orm"),
  ]);

  const translatedAr = await translateProductTextsToArabic({
    shortDescription,
    description,
    rawMaterials,
    nutritionFacts,
    recommendations,
  });

  const uploadedImageUrls = await saveUploadedProductImages(imageFiles);
  const { imageUrl: normalizedImageUrl, imageGallery: normalizedImageGallery } = buildProductImages(
    imageUrl,
    imageGallery,
    uploadedImageUrls,
  );

  await db
    .update(products)
    .set({
      name,
      shortDescription: shortDescription || null,
      shortDescriptionAr: translatedAr.shortDescription || null,
      description: description || null,
      descriptionAr: translatedAr.description || null,
      rawMaterials: rawMaterials || null,
      rawMaterialsAr: translatedAr.rawMaterials || null,
      imageGallery: normalizedImageGallery,
      nutritionFacts: nutritionFacts || null,
      nutritionFactsAr: translatedAr.nutritionFacts || null,
      recommendations: recommendations || null,
      recommendationsAr: translatedAr.recommendations || null,
      imageUrl: normalizedImageUrl,
      price: String(pricePerPiece ?? pricePerKg),
      saleMode,
      pricePerPiece: pricePerPiece ? pricePerPiece.toFixed(2) : null,
      pricePerKg: pricePerKg ? pricePerKg.toFixed(2) : null,
      categoryId: categoryId || null,
      isActive,
      updatedAt: new Date(),
    })
    .where(eq(products.id, id));

  revalidatePath(`/${locale}/super-admin`);
  revalidatePath(`/${locale}/super-admin/products`);
  revalidatePath(`/${locale}/produits`);
}

export async function deleteProductAction(formData: FormData) {
  await assertSuperAdmin();

  const locale = String(formData.get("locale") ?? "fr");
  const id = String(formData.get("id") ?? "");

  if (!id) {
    throw new Error("Product id is required");
  }

  const [{ db }, { products }, { eq }] = await Promise.all([
    import("@/lib/db"),
    import("@/db/schema"),
    import("drizzle-orm"),
  ]);

  await db.delete(products).where(eq(products.id, id));

  revalidatePath(`/${locale}/super-admin`);
  revalidatePath(`/${locale}/super-admin/products`);
  revalidatePath(`/${locale}/produits`);
}

export async function updateSuperAdminOrderStatusAction(formData: FormData) {
  const superAdminUserId = await assertSuperAdmin();

  const locale = String(formData.get("locale") ?? "fr");
  const orderId = String(formData.get("orderId") ?? "").trim();
  const nextStatus = String(formData.get("status") ?? "").trim();

  if (!orderId || !ORDER_STATUS_OPTIONS.includes(nextStatus as (typeof ORDER_STATUS_OPTIONS)[number])) {
    redirect(`/${locale}/super-admin/orders?updated=invalid`);
  }

  const [{ db }, { orders, orderStatusEvents }, { eq }] = await Promise.all([
    import("@/lib/db"),
    import("@/db/schema"),
    import("drizzle-orm"),
  ]);

  const existingOrder = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
  });

  if (!existingOrder) {
    redirect(`/${locale}/super-admin/orders?updated=invalid`);
  }

  if (existingOrder.status === nextStatus) {
    redirect(`/${locale}/super-admin/orders?updated=1`);
  }

  if (!canTransitionOrderStatus(existingOrder.status, nextStatus)) {
    redirect(`/${locale}/super-admin/orders?updated=blocked`);
  }

  await db
    .update(orders)
    .set({
      status: nextStatus as (typeof ORDER_STATUS_OPTIONS)[number],
      updatedAt: new Date(),
    })
    .where(eq(orders.id, orderId));

  await db.insert(orderStatusEvents).values({
    orderId,
    status: nextStatus as (typeof ORDER_STATUS_OPTIONS)[number],
    changedBy: superAdminUserId,
  });

  revalidatePath(`/${locale}/super-admin`);
  revalidatePath(`/${locale}/super-admin/orders`);
  revalidatePath(`/${locale}/client`);

  redirect(`/${locale}/super-admin/orders?updated=1`);
}
