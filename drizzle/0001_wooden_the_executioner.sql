CREATE TABLE "travel_lists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" text NOT NULL,
	"name" varchar(80) NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "travel_lists_name_valid_check" CHECK (char_length("travel_lists"."name") BETWEEN 1 AND 80 AND "travel_lists"."name" = btrim("travel_lists"."name")),
	CONSTRAINT "travel_lists_version_positive_check" CHECK ("travel_lists"."version" > 0)
);
--> statement-breakpoint
ALTER TABLE "travel_lists" ADD CONSTRAINT "travel_lists_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "travel_lists_owner_updated_id_idx" ON "travel_lists" USING btree ("owner_id","updated_at" DESC NULLS LAST,"id" DESC NULLS LAST);