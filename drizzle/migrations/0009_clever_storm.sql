ALTER TYPE "public"."auditoria_accion" ADD VALUE 'usuario_created';--> statement-breakpoint
ALTER TYPE "public"."auditoria_accion" ADD VALUE 'usuario_updated';--> statement-breakpoint
ALTER TYPE "public"."auditoria_accion" ADD VALUE 'usuario_deleted';--> statement-breakpoint
ALTER TYPE "public"."auditoria_accion" ADD VALUE 'password_reset';--> statement-breakpoint
ALTER TYPE "public"."auditoria_accion" ADD VALUE 'password_changed';--> statement-breakpoint
ALTER TYPE "public"."auditoria_accion" ADD VALUE 'blog_created';--> statement-breakpoint
ALTER TYPE "public"."auditoria_accion" ADD VALUE 'blog_updated';--> statement-breakpoint
ALTER TYPE "public"."auditoria_accion" ADD VALUE 'blog_deleted';--> statement-breakpoint
ALTER TYPE "public"."auditoria_accion" ADD VALUE 'faq_created';--> statement-breakpoint
ALTER TYPE "public"."auditoria_accion" ADD VALUE 'faq_updated';--> statement-breakpoint
ALTER TYPE "public"."auditoria_accion" ADD VALUE 'faq_deleted';--> statement-breakpoint
ALTER TYPE "public"."auditoria_accion" ADD VALUE 'site_config_updated';--> statement-breakpoint
ALTER TABLE "usuarios" ADD COLUMN "active" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "usuarios" ADD COLUMN "must_change_password" boolean DEFAULT false;--> statement-breakpoint
CREATE INDEX "blog_posts_published_idx" ON "blog_posts" USING btree ("published");--> statement-breakpoint
CREATE INDEX "blog_posts_featured_idx" ON "blog_posts" USING btree ("featured");--> statement-breakpoint
CREATE INDEX "faq_entries_published_idx" ON "faq_entries" USING btree ("published");--> statement-breakpoint
CREATE INDEX "usuarios_active_idx" ON "usuarios" USING btree ("active");