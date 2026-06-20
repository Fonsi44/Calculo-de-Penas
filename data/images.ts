/**
 * Mapeo slug -> ruta local de imagen corporativa.
 *
 * Las imagenes se descargaron en Fase 1 desde Pexels/Unsplash a:
 *   public/images/corporate/  (6 imagenes generales)
 *   public/images/services/   (13 areas juridicas standalone)
 *   public/images/penal/      (7 grupos de derecho penal)
 *
 * Las claves coinciden con los slugs canonicos de data/areas-juridicas.ts
 * (areasGenerales, hubPenal.grupos, hubMigrantes.subareas) para que
 * ServiceCard pueda resolver la imagen pasando `slug={area.slug}`.
 *
 * Cualquier consumidor que reciba un `slug` conocido recibira una URL
 * local servida por Next.js (sin dependencias de CDN externo en runtime).
 *
 * Si el slug no existe en el mapa, el caller debe caer a PlaceholderPhoto
 * para mantener una representacion visual coherente.
 */

export type ImageCategory = 'corporate' | 'services' | 'penal';

const SERVICES: Record<string, string> = {
  'derecho-penal': '/images/penal/litigio-complejo.webp',
  'derecho-de-familia': '/images/services/defensa-familia-nacaome.webp',
  'derecho-laboral': '/images/services/derecho-laboral-honduras.webp',
  'derecho-civil-y-notarial': '/images/services/derecho-civil-notarial-valle.webp',
  'derecho-mercantil-empresarial': '/images/services/mercantil.webp',
  'derecho-bancario-y-financiero': '/images/services/bancario.webp',
  'derecho-administrativo-y-servicio-civil': '/images/services/administrativo.webp',
  'derecho-aduanero-y-comercio-exterior': '/images/services/aduanero.webp',
  'regulacion-sanitaria': '/images/services/sanitario.webp',
  'extranjeria-en-honduras': '/images/services/extranjeria.webp',
  'propiedad-intelectual': '/images/services/propiedad-intelectual.webp',
  'tributario-fiscal': '/images/services/tributario.webp',
  'ambiental-regulatorio': '/images/services/ambiental.webp',
  'conciliacion-y-arbitraje': '/images/services/arbitraje.webp',
  'gestion-documental-y-legalizacion': '/images/services/gestion-documental-y-legalizacion.webp',
  'actos-notariales-internacionales': '/images/services/actos-notariales-internacionales.webp',
  'asuntos-civiles-y-familiares-desde-el-extranjero': '/images/services/asuntos-civiles-y-familiares-desde-el-extranjero.webp',
};

const PENAL: Record<string, string> = {
  'atencion-casos-penales-litigiosos': '/images/penal/litigio-complejo.webp',
  'mediacion-conflictos-penales-y-multas': '/images/penal/resolucion-alternativa.webp',
  'menores-justicia-juvenil': '/images/penal/penal-juvenil.webp',
  'proceso-penal-completo': '/images/penal/representacion-integral.webp',
  'recursos-y-defensa-avanzada': '/images/penal/recursos-impugnaciones.webp',
  'estrategia-penal-y-litigio': '/images/penal/consultoria-preventiva.webp',
  'ejecucion-penal-y-beneficios': '/images/penal/penitenciario.webp',
};

const CORPORATE: Record<string, string> = {
  hero_home: '/images/corporate/hero_home.webp',
  hero_despacho: '/images/corporate/hero_despacho.webp',
  services_general: '/images/corporate/services_general.webp',
  services_penal: '/images/corporate/services_penal.webp',
  courthouse: '/images/corporate/courthouse.webp',
  corporate_meeting: '/images/corporate/corporate_meeting.webp',
};

export function getServiceImage(slug: string): string | undefined {
  return SERVICES[slug];
}

export function getPenalImage(slug: string): string | undefined {
  return PENAL[slug];
}

export function getCorporateImage(key: string): string | undefined {
  return CORPORATE[key];
}

export function hasServiceImage(slug: string): boolean {
  return slug in SERVICES;
}

export function hasPenalImage(slug: string): boolean {
  return slug in PENAL;
}

export const SERVICE_IMAGE_KEYS = Object.keys(SERVICES);
export const PENAL_IMAGE_KEYS = Object.keys(PENAL);
export const CORPORATE_IMAGE_KEYS = Object.keys(CORPORATE);
