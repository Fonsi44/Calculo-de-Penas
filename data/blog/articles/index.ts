import { AUDIENCIA_INICIAL_JUZGADOS_VALLE_ARTICLE } from './audiencia-inicial-juzgados-valle';
import { CONTRATO_COMPRAVENTA_NACAOME_REVISION_ARTICLE } from './contrato-compraventa-nacaome-revision';
import { CUSTODIA_VISITAS_JUZGADO_VALLE_ARTICLE } from './custodia-visitas-juzgado-valle';
import { DEFENSA_PENAL_CHOLUTECA_DESDE_NACAOME_ARTICLE } from './defensa-penal-choluteca-desde-nacaome';
import { DESPIDO_VALLE_DOCUMENTOS_EVALUACION_ARTICLE } from './despido-valle-documentos-evaluacion';
import { DETENCION_FAMILIAR_NACAOME_ARTICLE } from './detencion-familiar-nacaome-primeras-horas';
import { PENSION_ALIMENTICIA_NACAOME_DOCUMENTOS_ARTICLE } from './pension-alimenticia-nacaome-documentos';
import { PREPARAR_VISITA_OFICINA_NACAOME_ARTICLE } from './preparar-visita-oficina-nacaome';
import { PRESTACIONES_PUERTO_SAN_LORENZO_ARTICLE } from './prestaciones-puerto-san-lorenzo';
import { TRAMITE_ADUANERO_GUASAULE_ABOGADO_ARTICLE } from './tramite-aduanero-guasaule-abogado';

export const EDITORIAL_ARTICLES = [
  DETENCION_FAMILIAR_NACAOME_ARTICLE,
  AUDIENCIA_INICIAL_JUZGADOS_VALLE_ARTICLE,
  PENSION_ALIMENTICIA_NACAOME_DOCUMENTOS_ARTICLE,
  CUSTODIA_VISITAS_JUZGADO_VALLE_ARTICLE,
  DESPIDO_VALLE_DOCUMENTOS_EVALUACION_ARTICLE,
  PRESTACIONES_PUERTO_SAN_LORENZO_ARTICLE,
  DEFENSA_PENAL_CHOLUTECA_DESDE_NACAOME_ARTICLE,
  TRAMITE_ADUANERO_GUASAULE_ABOGADO_ARTICLE,
  CONTRATO_COMPRAVENTA_NACAOME_REVISION_ARTICLE,
  PREPARAR_VISITA_OFICINA_NACAOME_ARTICLE,
] as const;

export type EditorialArticle = (typeof EDITORIAL_ARTICLES)[number];

export function getEditorialArticle(slug: string): EditorialArticle {
  const article = EDITORIAL_ARTICLES.find((item) => item.slug === slug);
  if (!article) {
    throw new Error(`Artículo editorial no registrado: ${slug}`);
  }
  return article;
}
