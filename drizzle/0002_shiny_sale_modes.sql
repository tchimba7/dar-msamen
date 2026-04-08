CREATE TYPE "public"."sale_unit_mode" AS ENUM('PIECE', 'KG', 'BOTH');
ALTER TABLE "products" ADD COLUMN "sale_mode" "sale_unit_mode" DEFAULT 'PIECE' NOT NULL;
ALTER TABLE "products" ADD COLUMN "price_per_piece" numeric(10, 2);
ALTER TABLE "products" ADD COLUMN "price_per_kg" numeric(10, 2);
UPDATE "products" SET "price_per_piece" = "price" WHERE "price_per_piece" IS NULL;
ALTER TABLE "order_items" ALTER COLUMN "quantity" DROP DEFAULT;
ALTER TABLE "order_items" ALTER COLUMN "quantity" TYPE numeric(10, 3) USING "quantity"::numeric;
ALTER TABLE "order_items" ALTER COLUMN "quantity" SET DEFAULT '1';