/**
 * Respuestas cuando la ruta legal (una pregunta:) no puede usar NotebookLM.
 * Nunca degradar al motor de sitio: evita respuestas genéricas engañosas.
 */

export const LEGAL_CORPUS_UNAVAILABLE_REPLY =
  'El corpus legal no está disponible en este entorno. Compruebe que el proxy NotebookLM esté activo (npm run chat:dev) o contacte con administración del despacho.';

export const LEGAL_CORPUS_TIMEOUT_REPLY =
  'La consulta al corpus legal ha tardado más de lo previsto. Espere un momento e inténtelo de nuevo; las guías jurídicas pueden tardar 1–2 minutos. Si persiste, contacte al despacho directamente.';

export const LEGAL_CORPUS_ERROR_REPLY =
  'No se pudo consultar el corpus legal en este momento. Inténtelo de nuevo en unos segundos o contacte al despacho si el problema continúa.';

export const LEGAL_CORPUS_RATE_LIMIT_REPLY =
  'Ha alcanzado el límite de consultas al corpus legal en esta sesión. Espere unos minutos o contacte al despacho directamente.';
