CREATE TABLE "travel_list_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"travel_list_id" uuid NOT NULL,
	"content_id" text NOT NULL,
	"content_type_id" text NOT NULL,
	"position" integer NOT NULL,
	"title" text NOT NULL,
	"address" text,
	"thumbnail_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "travel_list_items_list_content_unique" UNIQUE("travel_list_id","content_id"),
	CONSTRAINT "travel_list_items_list_position_unique" UNIQUE("travel_list_id","position"),
	CONSTRAINT "travel_list_items_position_nonnegative_check" CHECK ("travel_list_items"."position" >= 0),
	CONSTRAINT "travel_list_items_content_id_check" CHECK ("travel_list_items"."content_id" ~ '^[0-9]{1,64}$'),
	CONSTRAINT "travel_list_items_content_type_id_check" CHECK ("travel_list_items"."content_type_id" ~ '^[0-9]{1,8}$'),
	CONSTRAINT "travel_list_items_title_nonblank_check" CHECK (char_length(btrim("travel_list_items"."title")) > 0)
);
--> statement-breakpoint
ALTER TABLE "travel_list_items" ADD CONSTRAINT "travel_list_items_travel_list_id_travel_lists_id_fk" FOREIGN KEY ("travel_list_id") REFERENCES "public"."travel_lists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "travel_list_items_list_position_id_idx" ON "travel_list_items" USING btree ("travel_list_id","position","id");