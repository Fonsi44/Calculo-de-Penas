ALTER TABLE "blog_posts" ADD COLUMN "ai_review_provider" varchar(100);--> statement-breakpoint
ALTER TABLE "blog_posts" ADD COLUMN "ai_review_requires_human" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "blog_posts" ADD COLUMN "ai_research_provider" varchar(100);--> statement-breakpoint
ALTER TABLE "blog_posts" ADD COLUMN "ai_search_queries_count" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "blog_posts" ADD COLUMN "ai_official_sources_count" integer DEFAULT 0;