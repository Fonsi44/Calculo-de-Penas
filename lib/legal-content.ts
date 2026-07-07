import { getPageContent } from './page-content-db';

export interface LegalPageData {
  title: string;
  subtitle: string;
  version: string;
  lastUpdated: string;
}

const DEFAULTS: Record<string, LegalPageData> = {
  terminos: {
    title: 'Términos y Condiciones',
    subtitle: 'Reglas que rigen el acceso y la utilización de la calculadora de penas y de los demás servicios publicados en este sitio web.',
    version: '0.2',
    lastUpdated: 'Junio 2026',
  },
  'aviso-legal': {
    title: 'Aviso Legal',
    subtitle: 'Identificación y responsabilidad del titular del sitio web.',
    version: '0.1',
    lastUpdated: 'Junio 2026',
  },
  'politica-privacidad': {
    title: 'Política de Privacidad',
    subtitle: 'Compromiso con la protección de sus datos personales conforme a la Ley de Protección de Datos de Honduras.',
    version: '0.5',
    lastUpdated: 'Julio 2026',
  },
  'politica-cookies': {
    title: 'Política de Cookies',
    subtitle: 'Gestión y control de cookies utilizadas en este sitio web.',
    version: '0.1',
    lastUpdated: 'Junio 2026',
  },
  disclaimer: {
    title: 'Disclaimer',
    subtitle: 'Exención de responsabilidad sobre la información publicada.',
    version: '0.1',
    lastUpdated: 'Junio 2026',
  },
};

export async function getLegalPageContent(page: string): Promise<LegalPageData> {
  const content = await getPageContent(page);
  const defaults = DEFAULTS[page] || DEFAULTS.terminos;
  return {
    title: content['hero.title'] || defaults.title,
    subtitle: content['hero.subtitle'] || defaults.subtitle,
    version: content['content.version'] || defaults.version,
    lastUpdated: content['content.last_updated'] || defaults.lastUpdated,
  };
}
