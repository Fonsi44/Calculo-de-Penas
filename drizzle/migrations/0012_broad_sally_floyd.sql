ALTER TYPE "public"."auditoria_accion" ADD VALUE 'categoria_blog_created';--> statement-breakpoint
ALTER TYPE "public"."auditoria_accion" ADD VALUE 'categoria_blog_updated';--> statement-breakpoint
ALTER TYPE "public"."auditoria_accion" ADD VALUE 'categoria_blog_deleted';--> statement-breakpoint
ALTER TYPE "public"."auditoria_accion" ADD VALUE 'categoria_faq_created';--> statement-breakpoint
ALTER TYPE "public"."auditoria_accion" ADD VALUE 'categoria_faq_updated';--> statement-breakpoint
ALTER TYPE "public"."auditoria_accion" ADD VALUE 'categoria_faq_deleted';--> statement-breakpoint
ALTER TYPE "public"."auditoria_accion" ADD VALUE 'tag_created';--> statement-breakpoint
ALTER TYPE "public"."auditoria_accion" ADD VALUE 'tag_updated';--> statement-breakpoint
ALTER TYPE "public"."auditoria_accion" ADD VALUE 'tag_deleted';--> statement-breakpoint
ALTER TYPE "public"."auditoria_accion" ADD VALUE 'autor_created';--> statement-breakpoint
ALTER TYPE "public"."auditoria_accion" ADD VALUE 'autor_updated';--> statement-breakpoint
ALTER TYPE "public"."auditoria_accion" ADD VALUE 'autor_deleted';--> statement-breakpoint
ALTER TYPE "public"."auditoria_accion" ADD VALUE 'pagina_cms_created';--> statement-breakpoint
ALTER TYPE "public"."auditoria_accion" ADD VALUE 'pagina_cms_updated';--> statement-breakpoint
ALTER TYPE "public"."auditoria_accion" ADD VALUE 'pagina_cms_deleted';--> statement-breakpoint
ALTER TYPE "public"."auditoria_accion" ADD VALUE 'area_juridica_created';--> statement-breakpoint
ALTER TYPE "public"."auditoria_accion" ADD VALUE 'area_juridica_updated';--> statement-breakpoint
ALTER TYPE "public"."auditoria_accion" ADD VALUE 'area_juridica_deleted';--> statement-breakpoint
ALTER TYPE "public"."auditoria_accion" ADD VALUE 'medio_created';--> statement-breakpoint
ALTER TYPE "public"."auditoria_accion" ADD VALUE 'medio_updated';--> statement-breakpoint
ALTER TYPE "public"."auditoria_accion" ADD VALUE 'medio_deleted';--> statement-breakpoint
ALTER TYPE "public"."auditoria_accion" ADD VALUE 'redirect_created';--> statement-breakpoint
ALTER TYPE "public"."auditoria_accion" ADD VALUE 'redirect_updated';--> statement-breakpoint
ALTER TYPE "public"."auditoria_accion" ADD VALUE 'redirect_deleted';--> statement-breakpoint
ALTER TYPE "public"."auditoria_accion" ADD VALUE 'menu_updated';--> statement-breakpoint
ALTER TYPE "public"."auditoria_accion" ADD VALUE 'rol_created';--> statement-breakpoint
ALTER TYPE "public"."auditoria_accion" ADD VALUE 'rol_updated';--> statement-breakpoint
ALTER TYPE "public"."auditoria_accion" ADD VALUE 'rol_deleted';--> statement-breakpoint
ALTER TYPE "public"."auditoria_accion" ADD VALUE 'permiso_updated';--> statement-breakpoint
CREATE TABLE "areas_juridicas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(200) NOT NULL,
	"titulo" varchar(300) NOT NULL,
	"descripcion_corta" text,
	"descripcion_larga" text,
	"icono" varchar(100),
	"imagen" varchar(500),
	"categoria" varchar(50) DEFAULT 'servicio' NOT NULL,
	"grupo" varchar(200),
	"subservicios" jsonb,
	"faqs" jsonb,
	"seo" jsonb,
	"sort_order" integer DEFAULT 0,
	"estado" varchar(20) DEFAULT 'publicado',
	"creado_en" timestamp with time zone DEFAULT now(),
	"actualizado_en" timestamp with time zone,
	CONSTRAINT "areas_juridicas_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "autores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(200) NOT NULL,
	"nombre" varchar(200) NOT NULL,
	"email" varchar(255),
	"bio" text,
	"foto" varchar(500),
	"redes" jsonb,
	"creado_en" timestamp with time zone DEFAULT now(),
	"actualizado_en" timestamp with time zone,
	CONSTRAINT "autores_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "categorias_blog" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(200) NOT NULL,
	"nombre" varchar(200) NOT NULL,
	"descripcion" varchar(500),
	"color" varchar(50),
	"icono" varchar(100),
	"sort_order" integer DEFAULT 0,
	"creado_en" timestamp with time zone DEFAULT now(),
	"actualizado_en" timestamp with time zone,
	CONSTRAINT "categorias_blog_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "categorias_faq" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(200) NOT NULL,
	"titulo" varchar(200) NOT NULL,
	"descripcion" varchar(500),
	"icono" varchar(100),
	"color" varchar(50),
	"sort_order" integer DEFAULT 0,
	"creado_en" timestamp with time zone DEFAULT now(),
	"actualizado_en" timestamp with time zone,
	CONSTRAINT "categorias_faq_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "medios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nombre_archivo" varchar(500) NOT NULL,
	"alt_text" varchar(500),
	"titulo" varchar(300),
	"descripcion" text,
	"tipo_mime" varchar(100) NOT NULL,
	"tamaño" integer NOT NULL,
	"dimensiones" jsonb,
	"url" varchar(500) NOT NULL,
	"formatos" jsonb,
	"created_by" uuid,
	"creado_en" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "menus" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nombre" varchar(100) NOT NULL,
	"items" jsonb,
	"creado_en" timestamp with time zone DEFAULT now(),
	"actualizado_en" timestamp with time zone,
	CONSTRAINT "menus_nombre_unique" UNIQUE("nombre")
);
--> statement-breakpoint
CREATE TABLE "paginas_cms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(200) NOT NULL,
	"titulo" varchar(300) NOT NULL,
	"descripcion" text,
	"contenido" jsonb,
	"plantilla" varchar(100) DEFAULT 'default',
	"estado" varchar(20) DEFAULT 'borrador',
	"seo" jsonb,
	"parent_id" uuid,
	"sort_order" integer DEFAULT 0,
	"created_by" uuid,
	"published_at" timestamp with time zone,
	"creado_en" timestamp with time zone DEFAULT now(),
	"actualizado_en" timestamp with time zone,
	CONSTRAINT "paginas_cms_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "permisos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recurso" varchar(100) NOT NULL,
	"accion" varchar(100) NOT NULL,
	"descripcion" varchar(300),
	CONSTRAINT "permisos_recurso_accion_unique" UNIQUE("recurso","accion")
);
--> statement-breakpoint
CREATE TABLE "posts_tags" (
	"post_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	CONSTRAINT "posts_tags_pk" UNIQUE("post_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "redirects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"origen" varchar(500) NOT NULL,
	"destino" varchar(500) NOT NULL,
	"tipo" integer DEFAULT 301 NOT NULL,
	"activo" boolean DEFAULT true,
	"creado_en" timestamp with time zone DEFAULT now(),
	"actualizado_en" timestamp with time zone,
	CONSTRAINT "redirects_origen_unique" UNIQUE("origen")
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nombre" varchar(100) NOT NULL,
	"descripcion" varchar(300),
	"creado_en" timestamp with time zone DEFAULT now(),
	CONSTRAINT "roles_nombre_unique" UNIQUE("nombre")
);
--> statement-breakpoint
CREATE TABLE "roles_permisos" (
	"rol_id" uuid NOT NULL,
	"permiso_id" uuid NOT NULL,
	CONSTRAINT "roles_permisos_pk" UNIQUE("rol_id","permiso_id")
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(200) NOT NULL,
	"nombre" varchar(200) NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now(),
	CONSTRAINT "tags_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "usuarios_roles" (
	"usuario_id" uuid NOT NULL,
	"rol_id" uuid NOT NULL,
	CONSTRAINT "usuarios_roles_pk" UNIQUE("usuario_id","rol_id")
);
--> statement-breakpoint
CREATE TABLE "versiones_contenido" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entidad_tipo" varchar(50) NOT NULL,
	"entidad_id" varchar(100) NOT NULL,
	"contenido" jsonb NOT NULL,
	"version" integer NOT NULL,
	"creado_por" uuid,
	"descripcion" varchar(500),
	"creado_en" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "medios" ADD CONSTRAINT "medios_created_by_usuarios_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "paginas_cms" ADD CONSTRAINT "paginas_cms_parent_id_paginas_cms_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."paginas_cms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "paginas_cms" ADD CONSTRAINT "paginas_cms_created_by_usuarios_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts_tags" ADD CONSTRAINT "posts_tags_post_id_blog_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."blog_posts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts_tags" ADD CONSTRAINT "posts_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roles_permisos" ADD CONSTRAINT "roles_permisos_rol_id_roles_id_fk" FOREIGN KEY ("rol_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roles_permisos" ADD CONSTRAINT "roles_permisos_permiso_id_permisos_id_fk" FOREIGN KEY ("permiso_id") REFERENCES "public"."permisos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usuarios_roles" ADD CONSTRAINT "usuarios_roles_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usuarios_roles" ADD CONSTRAINT "usuarios_roles_rol_id_roles_id_fk" FOREIGN KEY ("rol_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "versiones_contenido" ADD CONSTRAINT "versiones_contenido_creado_por_usuarios_id_fk" FOREIGN KEY ("creado_por") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "areas_juridicas_slug_idx" ON "areas_juridicas" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "areas_juridicas_categoria_idx" ON "areas_juridicas" USING btree ("categoria");--> statement-breakpoint
CREATE INDEX "categorias_blog_slug_idx" ON "categorias_blog" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "categorias_faq_slug_idx" ON "categorias_faq" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "paginas_cms_slug_idx" ON "paginas_cms" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "posts_tags_post_idx" ON "posts_tags" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "posts_tags_tag_idx" ON "posts_tags" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX "tags_slug_idx" ON "tags" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "versiones_entidad_idx" ON "versiones_contenido" USING btree ("entidad_tipo","entidad_id");