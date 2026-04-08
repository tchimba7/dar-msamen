CREATE TYPE "public"."phone_verification_channel" AS ENUM('SMS', 'WHATSAPP');
ALTER TABLE "users" ADD COLUMN "phone_verified_at" timestamp with time zone;
CREATE TABLE "phone_verification_codes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "phone" varchar(30) NOT NULL,
  "channel" "phone_verification_channel" NOT NULL,
  "code_hash" text NOT NULL,
  "attempts" integer DEFAULT 0 NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE "phone_verification_codes" ADD CONSTRAINT "phone_verification_codes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
UPDATE "users" SET "phone_verified_at" = now() WHERE "phone" IS NOT NULL AND "phone" <> '';