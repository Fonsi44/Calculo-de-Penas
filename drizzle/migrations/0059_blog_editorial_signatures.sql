ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "review_origin" varchar(50);
--> statement-breakpoint
ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "signature_type" varchar(20);
--> statement-breakpoint
ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "signature_name" varchar(200);
--> statement-breakpoint
ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "signature_candidate" varchar(200);
--> statement-breakpoint
ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "reviewed_content_hash" varchar(64);
--> statement-breakpoint
ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "signature_valid" boolean DEFAULT false;
