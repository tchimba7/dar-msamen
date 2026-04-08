CREATE TYPE "public"."order_whatsapp_status" AS ENUM('PENDING', 'SENT', 'FAILED', 'SKIPPED');--> statement-breakpoint
CREATE TABLE "delivery_slots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(40) NOT NULL,
	"label_fr" varchar(140) NOT NULL,
	"label_ar" varchar(140) NOT NULL,
	"order_cutoff_hour" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "delivery_slots_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "delivery_zones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(40) NOT NULL,
	"city" varchar(120) NOT NULL,
	"label" varchar(140) NOT NULL,
	"label_ar" varchar(140),
	"shipping_fee" numeric(10, 2) DEFAULT '0' NOT NULL,
	"minimum_order" numeric(10, 2) DEFAULT '0' NOT NULL,
	"delivery_eta" varchar(140),
	"delivery_eta_ar" varchar(140),
	"cod_enabled" boolean DEFAULT true NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "delivery_zones_code_unique" UNIQUE("code"),
	CONSTRAINT "delivery_zones_city_unique" UNIQUE("city")
);
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "subtotal" numeric(10, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "delivery_fee" numeric(10, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "delivery_zone_id" uuid;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "delivery_zone_label" varchar(140);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "delivery_slot_id" uuid;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "delivery_slot_label" varchar(140);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "whatsapp_status" "order_whatsapp_status" DEFAULT 'PENDING' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "whatsapp_sent_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "whatsapp_error" text;--> statement-breakpoint
UPDATE "orders" SET "subtotal" = "total", "delivery_fee" = '0' WHERE "subtotal" = '0' AND "delivery_fee" = '0';--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_delivery_zone_id_delivery_zones_id_fk" FOREIGN KEY ("delivery_zone_id") REFERENCES "public"."delivery_zones"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_delivery_slot_id_delivery_slots_id_fk" FOREIGN KEY ("delivery_slot_id") REFERENCES "public"."delivery_slots"("id") ON DELETE set null ON UPDATE no action;
