/**
 * Catálogo de lead magnets disponibles por área jurídica.
 *
 * Cada lead magnet es una guía PDF descargable que se entrega a cambio del email.
 * La descarga queda registrada en newsletter_subscriptions con source = 'descarga-[area]'.
 *
 * TODO: Crear los PDFs reales y subirlos a /public/descargas/
 * TODO: Añadir formularios de descarga en cada página de servicio individual
 */

import { site } from '@/lib/site';

export interface LeadMagnet {
  area: string;
  titulo: string;
  descripcion: string;
  archivo: string;
  source: string;
}

export const LEAD_MAGNETS: LeadMagnet[] = [
  {
    area: 'derecho-de-familia',
    titulo: 'Guía legal: Derecho de Familia en Honduras',
    descripcion: 'Divorcio, custodia, alimentos y adopción: requisitos, plazos y documentación necesaria en cada caso.',
    archivo: '/descargas/guia-derecho-familia.pdf',
    source: 'descarga-derecho-familia',
  },
  {
    area: 'derecho-civil-y-notarial',
    titulo: 'Guía legal: Derecho Civil y Notarial',
    descripcion: 'Contratos, compraventas, sucesiones y actos notariales: guía práctica para sus trámites.',
    archivo: '/descargas/guia-derecho-civil.pdf',
    source: 'descarga-derecho-civil',
  },
  {
    area: 'tributario-fiscal',
    titulo: 'Guía legal: Derecho Tributario y Fiscal',
    descripcion: 'Obligaciones tributarias, declaraciones y régimen sancionador en Honduras.',
    archivo: '/descargas/guia-derecho-tributario.pdf',
    source: 'descarga-derecho-tributario',
  },
  {
    area: 'extranjeria-en-honduras',
    titulo: 'Guía legal: Extranjería y Migración en Honduras',
    descripcion: 'Residencias, permisos de trabajo, naturalización y trámites migratorios para extranjeros.',
    archivo: '/descargas/guia-extranjeria.pdf',
    source: 'descarga-extranjeria',
  },
  {
    area: 'derecho-administrativo-y-servicio-civil',
    titulo: 'Guía legal: Derecho Administrativo y Servicio Civil',
    descripcion: 'Procedimientos administrativos, recursos y carrera del servicio civil en Honduras.',
    archivo: '/descargas/guia-derecho-administrativo.pdf',
    source: 'descarga-derecho-administrativo',
  },
  {
    area: 'derecho-bancario-y-financiero',
    titulo: 'Guía legal: Derecho Bancario y Financiero',
    descripcion: 'Embargos, cobros, contratos bancarios y derechos del consumidor financiero.',
    archivo: '/descargas/guia-derecho-bancario.pdf',
    source: 'descarga-derecho-bancario',
  },
  {
    area: 'derecho-aduanero-y-comercio-exterior',
    titulo: 'Guía legal: Derecho Aduanero y Comercio Exterior',
    descripcion: 'Importaciones, exportaciones, regímenes aduaneros y sanciones en Honduras.',
    archivo: '/descargas/guia-derecho-aduanero.pdf',
    source: 'descarga-derecho-aduanero',
  },
  {
    area: 'regulacion-sanitaria',
    titulo: 'Guía legal: Regulación Sanitaria en Honduras',
    descripcion: 'Registros ARSA, licencias sanitarias y cumplimiento normativo para negocios.',
    archivo: '/descargas/guia-regulacion-sanitaria.pdf',
    source: 'descarga-regulacion-sanitaria',
  },
  {
    area: 'propiedad-intelectual',
    titulo: 'Guía legal: Propiedad Intelectual en Honduras',
    descripcion: 'Registro de marcas, patentes, derechos de autor y protección de la propiedad intelectual.',
    archivo: '/descargas/guia-propiedad-intelectual.pdf',
    source: 'descarga-propiedad-intelectual',
  },
  {
    area: 'conciliacion-y-arbitraje',
    titulo: 'Guía legal: Conciliación y Arbitraje en Honduras',
    descripcion: 'Mecanismos alternativos de resolución de conflictos: ventajas, procedimiento y marco legal.',
    archivo: '/descargas/guia-conciliacion-arbitraje.pdf',
    source: 'descarga-conciliacion-arbitraje',
  },
];

export function getLeadMagnetByArea(area: string): LeadMagnet | undefined {
  return LEAD_MAGNETS.find((m) => m.area === area);
}

export function getLeadMagnetDownloadUrl(magnet: LeadMagnet, email: string): string {
  return `${site.url}/api/descargar?area=${magnet.area}&email=${encodeURIComponent(email)}`;
}
