import { AUDIENCIA_INICIAL_JUZGADOS_VALLE_ARTICLE } from './audiencia-inicial-juzgados-valle';
import { DETENCION_FAMILIAR_NACAOME_ARTICLE } from './detencion-familiar-nacaome-primeras-horas';

export const EDITORIAL_ARTICLES = [
  DETENCION_FAMILIAR_NACAOME_ARTICLE,
  AUDIENCIA_INICIAL_JUZGADOS_VALLE_ARTICLE,
] as const;

export type EditorialArticle = (typeof EDITORIAL_ARTICLES)[number];

export function getEditorialArticle(slug: string): EditorialArticle {
  const article = EDITORIAL_ARTICLES.find((item) => item.slug === slug);
  if (!article) {
    throw new Error(`Artículo editorial no registrado: ${slug}`);
  }
  return article;
}
