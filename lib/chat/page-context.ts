/**
 * Contexto de página para personalizar chips y saludos del chat público.
 */

export type ChatPageContext =
  | 'home'
  | 'migrantes'
  | 'servicios'
  | 'blog'
  | 'faq'
  | 'contacto'
  | 'penal'
  | 'general';

export type ChatPageHint = {
  context: ChatPageContext;
  greeting?: string;
  extraChips: string[];
};

const MIGRANTES_PREFIX = '/hondurenos-en-espana';
const SERVICIOS_PREFIX = '/servicios-juridicos';
const BLOG_PREFIX = '/blog';
const FAQ_PATH = '/preguntas-frecuentes';
const CONTACTO_PATH = '/solicitar-consulta';
const PENAL_PATH = '/derecho-penal';

/** Deriva contexto a partir del pathname público (sin query). */
export function resolveChatPageContext(pathname: string | null | undefined): ChatPageContext {
  const path = pathname?.split('?')[0] ?? '/';
  if (path === '/' || path === '') return 'home';
  if (path === FAQ_PATH || path.startsWith(`${FAQ_PATH}/`)) return 'faq';
  if (path === CONTACTO_PATH) return 'contacto';
  if (path === PENAL_PATH || path.startsWith(`${PENAL_PATH}/`)) return 'penal';
  if (path === MIGRANTES_PREFIX || path.startsWith(`${MIGRANTES_PREFIX}/`)) return 'migrantes';
  if (path === SERVICIOS_PREFIX || path.startsWith(`${SERVICIOS_PREFIX}/`)) return 'servicios';
  if (path === BLOG_PREFIX || path.startsWith(`${BLOG_PREFIX}/`)) return 'blog';
  return 'general';
}

/** Chips y saludo opcional según la página visitada. */
export function getChatPageHint(pathname: string | null | undefined): ChatPageHint {
  const context = resolveChatPageContext(pathname);
  switch (context) {
    case 'migrantes':
      return {
        context,
        greeting:
          'Veo que está en la sección para hondureños en España. Le ayudo a preparar su consulta o a contactar con el despacho.',
        extraChips: ['Soy hondureño en España', 'Preparar consulta', 'Enviar WhatsApp'],
      };
    case 'servicios':
      return {
        context,
        greeting: '¿Busca orientación sobre algún servicio del despacho? Puedo ayudarle a encaminar su consulta.',
        extraChips: ['Identificar área legal', 'Ver servicios', 'Preparar consulta'],
      };
    case 'penal':
      return {
        context,
        greeting:
          'Si su situación es urgente (detención, audiencia próxima), contacte al despacho de inmediato por WhatsApp o teléfono.',
        extraChips: ['Caso urgente', 'Preparar consulta', 'Enviar WhatsApp'],
      };
    case 'faq':
      return {
        context,
        extraChips: ['Preparar consulta', 'Identificar área legal', 'Enviar WhatsApp'],
      };
    case 'contacto':
      return {
        context,
        greeting: 'Antes de enviar el formulario, puedo ayudarle a estructurar un resumen breve de su caso.',
        extraChips: ['Preparar consulta', 'Checklist de documentos'],
      };
    case 'blog':
      return {
        context,
        extraChips: ['Preparar consulta', 'Identificar área legal', 'Enviar WhatsApp'],
      };
    case 'home':
      return {
        context,
        extraChips: ['Preparar consulta', 'Identificar área legal'],
      };
    default:
      return { context, extraChips: [] };
  }
}

/** Chips iniciales únicos (config + página). */
export function buildInitialQuickReplies(
  pathname: string | null | undefined,
  defaults: readonly string[],
): string[] {
  const hint = getChatPageHint(pathname);
  const merged = [...hint.extraChips, ...defaults];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const chip of merged) {
    if (seen.has(chip)) continue;
    seen.add(chip);
    out.push(chip);
    if (out.length >= 6) break;
  }
  return out;
}
