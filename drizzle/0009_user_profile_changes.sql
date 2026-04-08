CREATE TABLE "user_profile_changes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid,
  "changed_by_user_id" uuid,
  "changed_by_role" "role" NOT NULL,
  "previous_name" varchar(120),
  "new_name" varchar(120),
  "previous_email" varchar(255),
  "new_email" varchar(255),
  "previous_phone" varchar(30),
  "new_phone" varchar(30),
  "previous_address_line" text,
  "new_address_line" text,
  "previous_city" varchar(120),
  "new_city" varchar(120),
  "changed_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "user_profile_changes" ADD CONSTRAINT "user_profile_changes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;

ALTER TABLE "user_profile_changes" ADD CONSTRAINT "user_profile_changes_changed_by_user_id_users_id_fk" FOREIGN KEY ("changed_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
