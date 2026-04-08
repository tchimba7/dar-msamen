import { config as loadEnv } from "dotenv";

import { eq } from "drizzle-orm";
import { hashPassword } from "@/lib/password";

loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });
loadEnv({ path: ".env.example" });

const deliveryZoneSeeds = [
  {
    code: "casablanca-centre",
    city: "Casablanca",
    label: "Casablanca centre",
    labelAr: "وسط الدار البيضاء",
    shippingFee: "15.00",
    minimumOrder: "70.00",
    deliveryEta: "Livraison le jour meme",
    deliveryEtaAr: "توصيل في نفس اليوم",
    sortOrder: 1,
  },
  {
    code: "rabat-sale",
    city: "Rabat",
    label: "Rabat et Sale",
    labelAr: "الرباط وسلا",
    shippingFee: "20.00",
    minimumOrder: "90.00",
    deliveryEta: "Sous 24h",
    deliveryEtaAr: "خلال 24 ساعة",
    sortOrder: 2,
  },
  {
    code: "temara-skhirat",
    city: "Temara",
    label: "Temara et Skhirat",
    labelAr: "تمارة والصخيرات",
    shippingFee: "22.00",
    minimumOrder: "90.00",
    deliveryEta: "Sous 24h",
    deliveryEtaAr: "خلال 24 ساعة",
    sortOrder: 3,
  },
  {
    code: "mohammedia",
    city: "Mohammedia",
    label: "Mohammedia",
    labelAr: "المحمدية",
    shippingFee: "18.00",
    minimumOrder: "80.00",
    deliveryEta: "Sous 24h",
    deliveryEtaAr: "خلال 24 ساعة",
    sortOrder: 4,
  },
  {
    code: "marrakech",
    city: "Marrakech",
    label: "Marrakech",
    labelAr: "مراكش",
    shippingFee: "35.00",
    minimumOrder: "120.00",
    deliveryEta: "Sous 24 a 48h",
    deliveryEtaAr: "خلال 24 إلى 48 ساعة",
    sortOrder: 5,
  },
] as const;

const deliverySlotSeeds = [
  {
    code: "morning",
    labelFr: "Matin 09:00 - 12:00",
    labelAr: "الصباح 09:00 - 12:00",
    orderCutoffHour: 8,
    sortOrder: 1,
  },
  {
    code: "afternoon",
    labelFr: "Apres-midi 14:00 - 18:00",
    labelAr: "بعد الزوال 14:00 - 18:00",
    orderCutoffHour: 12,
    sortOrder: 2,
  },
  {
    code: "evening",
    labelFr: "Soir 18:00 - 21:00",
    labelAr: "المساء 18:00 - 21:00",
    orderCutoffHour: 16,
    sortOrder: 3,
  },
] as const;

async function seed() {
  const [{ categories, deliverySlots, deliveryZones, products, users }, { db }] = await Promise.all([
    import("@/db/schema"),
    import("@/lib/db"),
  ]);

  const email = process.env.SUPER_ADMIN_EMAIL;
  const password = process.env.SUPER_ADMIN_PASSWORD;
  const adminUserEmail = process.env.ADMIN_USER_TEST_EMAIL;
  const adminUserPassword = process.env.ADMIN_USER_TEST_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD must be defined in your environment.",
    );
  }

  const existing = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  const passwordHash = await hashPassword(password);

  let superAdminId = existing?.id;

  if (!existing) {
    const [createdSuperAdmin] = await db
      .insert(users)
      .values({
      name: "Super Admin",
      email,
      passwordHash,
      role: "SUPER_ADMIN",
      })
      .returning({ id: users.id });

    superAdminId = createdSuperAdmin.id;
    console.log("Super admin created.");
  } else {
    await db
      .update(users)
      .set({
        passwordHash,
        role: "SUPER_ADMIN",
        updatedAt: new Date(),
      })
      .where(eq(users.id, existing.id));

    console.log("Super admin updated.");
  }

  if (adminUserEmail && adminUserPassword) {
    const existingAdminUser = await db.query.users.findFirst({
      where: eq(users.email, adminUserEmail),
    });

    const adminUserPasswordHash = await hashPassword(adminUserPassword);

    if (!existingAdminUser) {
      await db.insert(users).values({
        name: "Admin User",
        email: adminUserEmail,
        passwordHash: adminUserPasswordHash,
        role: "ADMIN_USER",
      });
      console.log("Admin user created.");
    } else {
      await db
        .update(users)
        .set({
          passwordHash: adminUserPasswordHash,
          role: "ADMIN_USER",
          updatedAt: new Date(),
        })
        .where(eq(users.id, existingAdminUser.id));
      console.log("Admin user updated.");
    }
  }

  for (const zone of deliveryZoneSeeds) {
    const existingZone = await db.query.deliveryZones.findFirst({
      where: eq(deliveryZones.code, zone.code),
    });

    if (!existingZone) {
      await db.insert(deliveryZones).values(zone);
      console.log(`Delivery zone created: ${zone.code}`);
      continue;
    }

    await db
      .update(deliveryZones)
      .set({
        city: zone.city,
        label: zone.label,
        labelAr: zone.labelAr,
        shippingFee: zone.shippingFee,
        minimumOrder: zone.minimumOrder,
        deliveryEta: zone.deliveryEta,
        deliveryEtaAr: zone.deliveryEtaAr,
        codEnabled: true,
        isActive: true,
        sortOrder: zone.sortOrder,
        updatedAt: new Date(),
      })
      .where(eq(deliveryZones.id, existingZone.id));
  }

  for (const slot of deliverySlotSeeds) {
    const existingSlot = await db.query.deliverySlots.findFirst({
      where: eq(deliverySlots.code, slot.code),
    });

    if (!existingSlot) {
      await db.insert(deliverySlots).values(slot);
      console.log(`Delivery slot created: ${slot.code}`);
      continue;
    }

    await db
      .update(deliverySlots)
      .set({
        labelFr: slot.labelFr,
        labelAr: slot.labelAr,
        orderCutoffHour: slot.orderCutoffHour,
        isActive: true,
        sortOrder: slot.sortOrder,
        updatedAt: new Date(),
      })
      .where(eq(deliverySlots.id, existingSlot.id));
  }

  const existingCategory = await db.query.categories.findFirst({
    where: eq(categories.slug, "traditionnel"),
  });

  let categoryId = existingCategory?.id;
  if (!existingCategory) {
    const [createdCategory] = await db
      .insert(categories)
      .values({
        name: "Traditionnel",
        slug: "traditionnel",
        description: "Produits artisanaux marocains",
        createdBy: superAdminId ?? null,
      })
      .returning({ id: categories.id });

    categoryId = createdCategory.id;
    console.log("Default category created.");
  }

  const existingProduct = await db.query.products.findFirst({
    where: eq(products.slug, "msamen-classique"),
  });

  if (!existingProduct) {
    await db.insert(products).values({
      name: "Msamen Classique",
      slug: "msamen-classique",
      description: "Msamen artisanal prépare chaque matin",
      price: "18.00",
      isNew: true,
      isActive: true,
      categoryId: categoryId ?? null,
      createdBy: superAdminId ?? null,
    });
    console.log("Default product created.");
  } else {
    await db
      .update(products)
      .set({
        isActive: true,
        updatedAt: new Date(),
      })
      .where(eq(products.id, existingProduct.id));
    console.log("Default product ensured active.");
  }
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
