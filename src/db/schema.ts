import {
  boolean,
  foreignKey,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["SUPER_ADMIN", "ADMIN_USER", "CLIENT"]);
export const orderStatusEnum = pgEnum("order_status", [
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "OUT_FOR_DELIVERY",
  "DELIVERY_DELAYED",
  "DELIVERED",
  "CANCELLED",
]);
export const paymentMethodEnum = pgEnum("payment_method", ["COD", "ONLINE"]);
export const saleUnitModeEnum = pgEnum("sale_unit_mode", ["PIECE", "KG", "BOTH"]);
export const phoneVerificationChannelEnum = pgEnum("phone_verification_channel", [
  "SMS",
  "WHATSAPP",
]);
export const orderWhatsappStatusEnum = pgEnum("order_whatsapp_status", [
  "PENDING",
  "SENT",
  "FAILED",
  "SKIPPED",
]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 120 }).notNull(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    phone: varchar("phone", { length: 30 }),
    phoneVerifiedAt: timestamp("phone_verified_at", { withTimezone: true }),
    addressLine: text("address_line"),
    city: varchar("city", { length: 120 }),
    passwordHash: text("password_hash").notNull(),
    role: roleEnum("role").notNull().default("CLIENT"),
    adminOwnerId: uuid("admin_owner_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.adminOwnerId],
      foreignColumns: [table.id],
      name: "users_admin_owner_id_fkey",
    }).onDelete("set null"),
  ],
);

export const userProfileChanges = pgTable("user_profile_changes", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  changedByUserId: uuid("changed_by_user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  changedByRole: roleEnum("changed_by_role").notNull(),
  previousName: varchar("previous_name", { length: 120 }),
  newName: varchar("new_name", { length: 120 }),
  previousEmail: varchar("previous_email", { length: 255 }),
  newEmail: varchar("new_email", { length: 255 }),
  previousPhone: varchar("previous_phone", { length: 30 }),
  newPhone: varchar("new_phone", { length: 30 }),
  previousAddressLine: text("previous_address_line"),
  newAddressLine: text("new_address_line"),
  previousCity: varchar("previous_city", { length: 120 }),
  newCity: varchar("new_city", { length: 120 }),
  changedAt: timestamp("changed_at", { withTimezone: true }).defaultNow().notNull(),
});

export const categories = pgTable("categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 140 }).notNull(),
  slug: varchar("slug", { length: 160 }).notNull().unique(),
  description: text("description"),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const products = pgTable("products", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 180 }).notNull(),
  slug: varchar("slug", { length: 200 }).notNull().unique(),
  shortDescription: varchar("short_description", { length: 220 }),
  shortDescriptionAr: varchar("short_description_ar", { length: 220 }),
  description: text("description"),
  descriptionAr: text("description_ar"),
  rawMaterials: text("raw_materials"),
  rawMaterialsAr: text("raw_materials_ar"),
  imageGallery: text("image_gallery"),
  nutritionFacts: text("nutrition_facts"),
  nutritionFactsAr: text("nutrition_facts_ar"),
  recommendations: text("recommendations"),
  recommendationsAr: text("recommendations_ar"),
  imageUrl: text("image_url"),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  saleMode: saleUnitModeEnum("sale_mode").notNull().default("PIECE"),
  pricePerPiece: numeric("price_per_piece", { precision: 10, scale: 2 }),
  pricePerKg: numeric("price_per_kg", { precision: 10, scale: 2 }),
  isNew: boolean("is_new").notNull().default(true),
  isActive: boolean("is_active").notNull().default(true),
  categoryId: uuid("category_id").references(() => categories.id, {
    onDelete: "set null",
  }),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const deliveryZones = pgTable("delivery_zones", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: varchar("code", { length: 40 }).notNull().unique(),
  city: varchar("city", { length: 120 }).notNull().unique(),
  label: varchar("label", { length: 140 }).notNull(),
  labelAr: varchar("label_ar", { length: 140 }),
  shippingFee: numeric("shipping_fee", { precision: 10, scale: 2 }).notNull().default("0"),
  minimumOrder: numeric("minimum_order", { precision: 10, scale: 2 }).notNull().default("0"),
  deliveryEta: varchar("delivery_eta", { length: 140 }),
  deliveryEtaAr: varchar("delivery_eta_ar", { length: 140 }),
  codEnabled: boolean("cod_enabled").notNull().default(true),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const deliverySlots = pgTable("delivery_slots", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: varchar("code", { length: 40 }).notNull().unique(),
  labelFr: varchar("label_fr", { length: 140 }).notNull(),
  labelAr: varchar("label_ar", { length: 140 }).notNull(),
  orderCutoffHour: integer("order_cutoff_hour"),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const orders = pgTable("orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  customerId: uuid("customer_id")
    .references(() => users.id, { onDelete: "set null" })
    .notNull(),
  adminOwnerId: uuid("admin_owner_id").references(() => users.id, {
    onDelete: "set null",
  }),
  status: orderStatusEnum("status").notNull().default("PENDING"),
  paymentMethod: paymentMethodEnum("payment_method").notNull().default("COD"),
  total: numeric("total", { precision: 10, scale: 2 }).notNull(),
  subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull().default("0"),
  deliveryFee: numeric("delivery_fee", { precision: 10, scale: 2 }).notNull().default("0"),
  deliveryZoneId: uuid("delivery_zone_id").references(() => deliveryZones.id, {
    onDelete: "set null",
  }),
  deliveryZoneLabel: varchar("delivery_zone_label", { length: 140 }),
  deliverySlotId: uuid("delivery_slot_id").references(() => deliverySlots.id, {
    onDelete: "set null",
  }),
  deliverySlotLabel: varchar("delivery_slot_label", { length: 140 }),
  addressLine: text("address_line").notNull(),
  city: varchar("city", { length: 120 }).notNull(),
  phone: varchar("phone", { length: 30 }).notNull(),
  notes: text("notes"),
  whatsappStatus: orderWhatsappStatusEnum("whatsapp_status").notNull().default("PENDING"),
  whatsappSentAt: timestamp("whatsapp_sent_at", { withTimezone: true }),
  whatsappError: text("whatsapp_error"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const orderItems = pgTable("order_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id")
    .references(() => orders.id, { onDelete: "cascade" })
    .notNull(),
  productId: uuid("product_id")
    .references(() => products.id, { onDelete: "restrict" })
    .notNull(),
  quantity: numeric("quantity", { precision: 10, scale: 3 }).notNull().default("1"),
  unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
});

export const orderStatusEvents = pgTable("order_status_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id")
    .references(() => orders.id, { onDelete: "cascade" })
    .notNull(),
  status: orderStatusEnum("status").notNull(),
  changedBy: uuid("changed_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const phoneVerificationCodes = pgTable("phone_verification_codes", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  phone: varchar("phone", { length: 30 }).notNull(),
  channel: phoneVerificationChannelEnum("channel").notNull(),
  codeHash: text("code_hash").notNull(),
  attempts: integer("attempts").notNull().default(0),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const passwordResetCodes = pgTable("password_reset_codes", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  phone: varchar("phone", { length: 30 }).notNull(),
  codeHash: text("code_hash").notNull(),
  attempts: integer("attempts").notNull().default(0),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const productReviews = pgTable("product_reviews", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id")
    .references(() => products.id, { onDelete: "cascade" })
    .notNull(),
  reviewerName: varchar("reviewer_name", { length: 120 }).notNull(),
  rating: integer("rating").notNull().default(5),
  comment: text("comment").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type AppRole = (typeof roleEnum.enumValues)[number];
