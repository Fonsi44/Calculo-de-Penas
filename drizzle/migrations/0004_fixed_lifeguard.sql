CREATE TABLE "rate_limits" (
	"identifier" varchar(255) NOT NULL,
	"key_prefix" varchar(50) NOT NULL,
	"count" integer DEFAULT 1 NOT NULL,
	"window_start" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "rate_limits_pk" UNIQUE("identifier","key_prefix")
);
--> statement-breakpoint
CREATE INDEX "rate_limits_expires_idx" ON "rate_limits" USING btree ("expires_at");