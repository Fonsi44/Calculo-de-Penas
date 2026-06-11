CREATE TABLE "page_content" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"page" varchar(200) NOT NULL,
	"section" varchar(200) NOT NULL,
	"field" varchar(100) NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"lang" varchar(10) DEFAULT 'es-HN',
	"updated_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now(),
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX "page_content_page_section_field_idx" ON "page_content" USING btree ("page","section","field");--> statement-breakpoint
CREATE INDEX "page_content_page_idx" ON "page_content" USING btree ("page");