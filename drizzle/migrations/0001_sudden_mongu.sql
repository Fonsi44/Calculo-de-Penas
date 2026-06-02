CREATE TABLE "articulos_cp" (
	"id" serial PRIMARY KEY NOT NULL,
	"articulo" varchar(50) NOT NULL,
	"libro" varchar(200),
	"titulo" varchar(200),
	"capitulo" varchar(200),
	"seccion" varchar(200),
	"epigrafe" varchar(300),
	"texto" text NOT NULL,
	"tema" varchar(100),
	CONSTRAINT "articulos_cp_articulo_unique" UNIQUE("articulo")
);
