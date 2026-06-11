/**
 * Metadatos de categorías FAQ.
 *
 * Slug, título y descripción de cada categoría de FAQ.
 * Fuente centralizada de verdad para categorías, usada por:
 * - Admin FAQ (desplegable de categorías)
 * - Página pública de FAQ (títulos y descripciones)
 * - Componentes de UI de FAQ
 *
 * Los slugs deben coincidir con los valores de `category` en `faq_entries` DB.
 */

export type FaqCategoryMeta = {
  slug: string;
  titulo: string;
  descripcion: string;
};

export const faqCategoriesMeta: FaqCategoryMeta[] = [
  {
    slug: 'derecho-penal-general',
    titulo: 'Derecho Penal General',
    descripcion: 'Preguntas frecuentes sobre defensa penal, delitos y el Código Penal hondureño.',
  },
  {
    slug: 'asistencia-detenidos',
    titulo: 'Asistencia a Detenidos y Urgencias',
    descripcion: 'Información sobre sus derechos si es detenido y cómo obtener asistencia legal inmediata.',
  },
  {
    slug: 'proceso-penal',
    titulo: 'Proceso Penal',
    descripcion: 'Etapas, plazos y derechos dentro del proceso penal hondureño.',
  },
  {
    slug: 'derecho-de-familia',
    titulo: 'Derecho de Familia',
    descripcion: 'Divorcio, custodia, pensión de alimentos y sucesiones en Honduras.',
  },
  {
    slug: 'derecho-laboral',
    titulo: 'Derecho Laboral',
    descripcion: 'Despidos, prestaciones, derechos laborales y reclamaciones en Honduras.',
  },
  {
    slug: 'derecho-civil',
    titulo: 'Derecho Civil y Notarial',
    descripcion: 'Contratos, inmuebles, deudas y actos notariales en Honduras.',
  },
  {
    slug: 'derecho-mercantil',
    titulo: 'Derecho Mercantil y Empresarial',
    descripcion: 'Constitución de empresas, contratos comerciales y propiedad intelectual.',
  },
  {
    slug: 'extranjeria-migracion',
    titulo: 'Extranjería y Migración',
    descripcion: 'Visas, residencia, naturalización y trámites migratorios en Honduras.',
  },
  {
    slug: 'tributario-sar',
    titulo: 'Tributario y SAR',
    descripcion: 'Impuestos, fiscalización y defensa ante el Servicio de Administración de Rentas.',
  },
  {
    slug: 'bufete-honorarios',
    titulo: 'El Bufete y Honorarios',
    descripcion: 'Cómo trabajamos, qué esperar de nuestros servicios y preguntas sobre honorarios.',
  },
  {
    slug: 'otras-areas',
    titulo: 'Otras Áreas',
    descripcion: 'Derecho administrativo, ambiental, aduanero, sanitario y más.',
  },
];

export const faqCategorySlugToName: Record<string, string> = Object.fromEntries(
  faqCategoriesMeta.map((c) => [c.slug, c.titulo]),
);

export const faqCategorySlugToDescription: Record<string, string> = Object.fromEntries(
  faqCategoriesMeta.map((c) => [c.slug, c.descripcion]),
);
