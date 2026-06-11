CREATE TABLE "blog_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(300) NOT NULL,
	"title" varchar(500) NOT NULL,
	"description" text NOT NULL,
	"body" text NOT NULL,
	"published_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone,
	"category" varchar(200) NOT NULL,
	"tags" text[] DEFAULT '{}',
	"author" varchar(200) DEFAULT 'Pineda y Asociados',
	"reading_time" varchar(20) DEFAULT '3 min',
	"cover_image" varchar(500),
	"featured" boolean DEFAULT false,
	"published" boolean DEFAULT true,
	"creado_en" timestamp with time zone DEFAULT now(),
	CONSTRAINT "blog_posts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "configuracion_sitio" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clave" varchar(100) NOT NULL,
	"valor" text NOT NULL,
	"descripcion" varchar(300),
	"actualizado_en" timestamp with time zone DEFAULT now(),
	CONSTRAINT "configuracion_sitio_clave_unique" UNIQUE("clave")
);
--> statement-breakpoint
CREATE TABLE "faq_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category" varchar(200) NOT NULL,
	"question" text NOT NULL,
	"answer" text NOT NULL,
	"sort_order" integer DEFAULT 0,
	"published" boolean DEFAULT true,
	"creado_en" timestamp with time zone DEFAULT now(),
	"actualizado_en" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX "blog_posts_slug_idx" ON "blog_posts" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "blog_posts_category_idx" ON "blog_posts" USING btree ("category");--> statement-breakpoint
CREATE INDEX "blog_posts_published_at_idx" ON "blog_posts" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX "faq_entries_category_idx" ON "faq_entries" USING btree ("category");--> statement-breakpoint
CREATE INDEX "faq_entries_sort_order_idx" ON "faq_entries" USING btree ("sort_order");