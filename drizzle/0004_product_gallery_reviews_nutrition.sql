ALTER TABLE "products" ADD COLUMN "image_gallery" text;
ALTER TABLE "products" ADD COLUMN "nutrition_facts" text;
CREATE TABLE "product_reviews" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "product_id" uuid NOT NULL,
  "reviewer_name" varchar(120) NOT NULL,
  "rating" integer DEFAULT 5 NOT NULL,
  "comment" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE "product_reviews" ADD CONSTRAINT "product_reviews_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;