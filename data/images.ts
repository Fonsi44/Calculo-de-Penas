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
  'derecho-de-familia': '/images/services/familia.jpg',
  'derecho-laboral': '/images/services/laboral.jpg',
  'derecho-civil-y-notarial': '/images/services/civil.jpg',
  'derecho-mercantil-empresarial': '/images/services/mercantil.jpg',
  'derecho-bancario-y-financiero': '/images/services/bancario.jpg',
  'derecho-administrativo-y-servicio-civil': '/images/services/administrativo.jpg',
  'derecho-aduanero-y-comercio-exterior': '/images/services/aduanero.jpg',
  'regulacion-sanitaria': '/images/services/sanitario.jpg',
  'extranjeria-en-honduras': '/images/services/extranjeria.jpg',
  'propiedad-intelectual': '/images/services/propiedad-intelectual.jpg',
  'tributario-fiscal': '/images/services/tributario.jpg',
  'ambiental-regulatorio': '/images/services/ambiental.jpg',
  'conciliacion-y-arbitraje': '/images/services/arbitraje.jpg',
};

const PENAL: Record<string, string> = {
  'atencion-casos-penales-litigiosos': '/images/penal/litigio-complejo.jpg',
  'mediacion-conflictos-penales-y-multas': '/images/penal/resolucion-alternativa.jpg',
  'menores-justicia-juvenil': '/images/penal/penal-juvenil.jpg',
  'proceso-penal-completo': '/images/penal/representacion-integral.jpg',
  'recursos-y-defensa-avanzada': '/images/penal/recursos-impugnaciones.jpg',
  'estrategia-penal-y-litigio': '/images/penal/consultoria-preventiva.jpg',
  'ejecucion-penal-y-beneficios': '/images/penal/penitenciario.jpg',
};

const CORPORATE: Record<string, string> = {
  hero_home: '/images/corporate/hero_home.jpg',
  hero_despacho: '/images/corporate/hero_despacho.jpg',
  services_general: '/images/corporate/services_general.jpg',
  services_penal: '/images/corporate/services_penal.jpg',
  courthouse: '/images/corporate/courthouse.jpg',
  corporate_meeting: '/images/corporate/corporate_meeting.jpg',
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
