CREATE TABLE "articulos_constitucion" (
	"id" integer PRIMARY KEY NOT NULL,
	"articulo" varchar(100) NOT NULL,
	"titulo" varchar(200),
	"capitulo" varchar(200),
	"texto" text
);
--> statement-breakpoint
CREATE TABLE "delitos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nombre" varchar(500) NOT NULL,
	"articulo" varchar(100) NOT NULL,
	"conducta" text,
	"clasificacion" varchar(200),
	"rama_id" varchar(100),
	"constitucion_articulo_id" integer,
	"pena_minima_meses" integer NOT NULL,
	"pena_maxima_meses" integer NOT NULL,
	"tiene_pena_alternativa" boolean DEFAULT false,
	"pena_alternativa_min" integer DEFAULT 0,
	"pena_alternativa_max" integer DEFAULT 0,
	"penas_accesorias" text[] DEFAULT '{}',
	"observaciones" text,
	"es_grave" boolean DEFAULT false,
	"creado_en" timestamp with time zone DEFAULT now(),
	"actualizado_en" timestamp with time zone,
	CONSTRAINT "delitos_nombre_articulo_unique" UNIQUE("nombre","articulo")
);
--> statement-breakpoint
CREATE TABLE "ramas_juridicas" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"nombre" varchar(300) NOT NULL,
	"parent_id" varchar(100),
	"nivel" integer DEFAULT 1 NOT NULL,
	"orden" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "delitos" ADD CONSTRAINT "delitos_rama_id_ramas_juridicas_id_fk" FOREIGN KEY ("rama_id") REFERENCES "public"."ramas_juridicas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delitos" ADD CONSTRAINT "delitos_constitucion_articulo_id_articulos_constitucion_id_fk" FOREIGN KEY ("constitucion_articulo_id") REFERENCES "public"."articulos_constitucion"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ramas_juridicas" ADD CONSTRAINT "ramas_juridicas_parent_id_ramas_juridicas_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."ramas_juridicas"("id") ON DELETE no action ON UPDATE no action;