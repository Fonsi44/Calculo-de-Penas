export type Post = {
  slug: string;
  title: string;
  description: string;
  body: string;
  publishedAt: string;
  updatedAt?: string;
  category: string;
  tags: string[];
  author: string;
  authorId?: string;
  readingTime: string;
  coverImage?: string;
  featured?: boolean;

  // SEO metadata
  metaTitle?: string;
  metaDescription?: string;
  ogImage?: string;

  // Indexation
  noindex?: boolean;

  // Canonical
  canonicalUrl?: string;

  // Review workflow
  reviewStatus?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewedContentHash?: string;
  reviewOrigin?: string;
  signatureType?: string;
  signatureName?: string;
  signatureCandidate?: string;
  signatureValid?: boolean;
  legalReviewNotes?: string;

  // AI document review (Fase 3B)
  aiReviewStatus?: string;
  aiReviewedAt?: string | Date | null;

  // Content audit
  lastReviewedAt?: string;
  nextReviewDueAt?: string;
};

/**
 * Modelo público de listado. Nunca contiene HTML, notas legales internas,
 * hashes ni candidatos de firma.
 */
export type BlogPostSummary = {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  updatedAt?: string;
  category: string;
  tags: string[];
  author: string;
  readingTime: string;
  coverImage?: string;
  featured: boolean;
  noindex?: boolean;
  canonicalUrl?: string;
  editoriallyIndexable: boolean;
};

/**
 * Payload ligero de un post para componentes cliente (búsqueda, filtros,
 * "cargar más"). Omite `body` (HTML grande) para no inflar el bundle ni el
 * peso del HTML inicial: el cliente solo necesita metadatos para filtrar,
 * ordenar y renderizar tarjetas. El cuerpo se carga en la página de detalle.
 */
export type BlogCardData = {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  updatedAt?: string;
  category: string;
  tags: string[];
  author: string;
  readingTime: string;
  coverImage?: string;
  featured?: boolean;
};

/**
 * Categoría enriquecida con conteo de posts, para navegación y sidebar.
 * `count` se calcula en servidor a partir de los posts publicados.
 */
export type BlogCategoryWithCount = {
  slug: string;
  nombre: string;
  descripcion: string;
  color: string;
  count: number;
};

/**
 * Entrada del archivo por meses (widget de archivo del sidebar).
 * `value` es la clave YYYY-MM (ordenable); `label` es legible (es-HN).
 */
export type BlogArchiveMonth = {
  value: string;
  label: string;
  count: number;
};
