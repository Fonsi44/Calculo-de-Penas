/**
 * Mapeo slug -> ruta local de imagen corporativa.
 *
 * Las imagenes se descargaron en Fase 1 desde Pexels/Unsplash a:
 *   public/images/corporate/  (6 imagenes generales)
 *   public/images/services/   (13 areas juridicas standalone)
 *   public/images/penal/      (7 grupos de derecho penal)
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
  'derecho-civil': '/images/services/civil.jpg',
  'derecho-mercantil': '/images/services/mercantil.jpg',
  'derecho-bancario': '/images/services/bancario.jpg',
  'derecho-administrativo': '/images/services/administrativo.jpg',
  'derecho-aduanero': '/images/services/aduanero.jpg',
  'derecho-sanitario': '/images/services/sanitario.jpg',
  'extranjeria': '/images/services/extranjeria.jpg',
  'propiedad-intelectual': '/images/services/propiedad-intelectual.jpg',
  'derecho-tributario': '/images/services/tributario.jpg',
  'derecho-ambiental': '/images/services/ambiental.jpg',
  'arbitraje': '/images/services/arbitraje.jpg',
};

const PENAL: Record<string, string> = {
  'litigio-complejo': '/images/penal/litigio-complejo.jpg',
  'resolucion-alternativa': '/images/penal/resolucion-alternativa.jpg',
  'penal-juvenil': '/images/penal/penal-juvenil.jpg',
  'representacion-integral': '/images/penal/representacion-integral.jpg',
  'recursos-impugnaciones': '/images/penal/recursos-impugnaciones.jpg',
  'consultoria-preventiva': '/images/penal/consultoria-preventiva.jpg',
  'penitenciario': '/images/penal/penitenciario.jpg',
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
