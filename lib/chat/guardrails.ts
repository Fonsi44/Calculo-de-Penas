/**
 * Guardrails de entrada para el chat.
 *
 * Detección heurística (no sustituye al system prompt del modelo, es una
 * primera línea de defensa server-side antes de llamar al proveedor):
 *   1. Prompt injection evidente ("ignora tus reglas", "actúa como", etc.).
 *   2. Preguntas sobre temas privados / intranet / configuración técnica.
 *   3. Solicitudes de asesoramiento jurídico definitivo que deben derivarse.
 *
 * Si un guardrail se dispara, se devuelve una respuesta prefijada SIN llamar
 * al proveedor (ahorro de coste y reducción de riesgo).
 */

export type GuardrailHit = {
  hit: true;
  /** Clave interna para analytics (sin contenido del usuario). */
  reason: 'injection' | 'private_topic' | 'definitive_advice';
  reply: string;
};

export type GuardrailOk = { hit: false };

export type GuardrailResult = GuardrailHit | GuardrailOk;

const INJECTION_PATTERNS = [
  /ignora\s+(tus?\s+)?(las?\s+)?(reglas|instrucciones|prompt)/i,
  /ignore\s+(all\s+)?(previous|prior|your)\s+(instructions|rules)/i,
  /act[uú]a\s+como\s+(si\s+fueras|otro|un\s+modelo|un\s+abogado)/i,
  /(muestra|muestra|revela|dame|imprime)\s+(tu|el)\s+(prompt|system prompt|instrucciones)/i,
  /jailbreak/i,
  /\bDAN\b.*mode/i,
  /modo\s+desarrollador/i,
  /developer\s+mode/i,
  /olvida\s+(tus|lo|todo)\s+(reglas|anterior)/i,
  /estás\s+programado|como\s+estás\s+hecho|cuál\s+es\s+tu\s+código/i,
];

const PRIVATE_TOPIC_PATTERNS = [
  /\bintranet\b/i,
  /\bpanel\s+(interno|privado|admin)/i,
  /\bdashboard\b/i,
  /\bcredenciales?\b/i,
  /\bcontrase[ñn]as?\b/i,
  /\bapi\s+key\b/i,
  /\bvariable\s+de\s+entorno\b/i,
  /\.env\b/i,
  /\bendpoints?\b/i,
  /\bbase\s+de\s+datos\b/i,
  /\btabla\s+\w+/i,
  /\btoken\b.*\b(jwt|secreto|auth)/i,
  /\busuario\s+(admin|root|interno)/i,
  /\bpermisos\s+(de|internos|rol)/i,
  /\bestructura\s+(del\s+proyecto|de\s+archivos)/i,
  /\blogin\s+(admin|interno|backend)/i,
];

const DEFINITIVE_ADVICE_PATTERNS = [
  // ¿Cuántos años/meses/días de prisión/cárcel...? (la interrogación inicial es opcional)
  /¿?\s*cu[aá]nt[oa]s?\s+(a[ñn]os|meses|d[ií]as)\s+de\s+(prisi[oó]n|c[aá]rcel|condena)/i,
  // "¿cuánto me tocan?" / "qué pena me toca"
  /cu[aá]nt[oa]\s+(me\s+)?(toc|correspon|van)/i,
  /qu[eé]\s+(pena|condena|castigo|sentencia)\s+(me\s+)?(toc|correspon|van|esper)/i,
  /calcula\s+(la\s+)?(pena|prisi[oó]n|condena)/i,
  /estrategia\s+(legal|procesal|de\s+defensa)/i,
  /cu[aá]l\s+es\s+mi\s+(estrategia|defensa)/i,
  /redacta\s+(una\s+)?(demanda|escrito|recurso|querella)/i,
  /soy\s+(culpable|inocente|responsable)/i,
  /¿?\s*(debo|tengo\s+que)\s+(declararme|confesar|apelar)/i,
  /qu[eé]\s+(debo\s+)?declarar/i,
];

const INJECTION_REPLY =
  'No puedo atender ese tipo de petición. Estoy diseñado solo para orientar sobre los servicios del despacho y facilitar el contacto. ¿Le ayudo a encontrar el servicio adecuado?';

const PRIVATE_TOPIC_REPLY =
  'No puedo ayudar con áreas privadas o internas. Si necesita asistencia, contacte directamente con el despacho por los canales oficiales.';

const DEFINITIVE_ADVICE_REPLY =
  'Esa valoración requiere revisión directa con el despacho, ya que depende del caso concreto y no puedo ofrecerla por chat. Le recomiendo contactar por WhatsApp o teléfono para recibir orientación profesional.';

/** Evalúa un mensaje de usuario contra los guardrails. */
export function evaluateGuardrails(message: string): GuardrailResult {
  const text = message ?? '';

  // Orden: injection primero (intento de evasión), luego privado, luego asesoramiento.
  if (INJECTION_PATTERNS.some((re) => re.test(text))) {
    return { hit: true, reason: 'injection', reply: INJECTION_REPLY };
  }
  if (PRIVATE_TOPIC_PATTERNS.some((re) => re.test(text))) {
    return { hit: true, reason: 'private_topic', reply: PRIVATE_TOPIC_REPLY };
  }
  if (DEFINITIVE_ADVICE_PATTERNS.some((re) => re.test(text))) {
    return { hit: true, reason: 'definitive_advice', reply: DEFINITIVE_ADVICE_REPLY };
  }
  return { hit: false };
}

/** Normalización mínima de la respuesta del modelo antes de devolverla.
 *  - Trunca por caracteres como salvaguarda defensiva (el límite real de
 *    tokens se aplica en la llamada al proveedor).
 *  - No altera el contenido semántico. */
export function sanitizeReply(reply: string, maxChars = 1200): string {
  if (typeof reply !== 'string') return '';
  // Elimina URLs (defensa en profundidad: el system prompt ya las prohíbe,
  // pero por si el LLM las genera, se filtran aquí antes de llegar al usuario).
  let limpia = reply;
  // HTTPS/HTTP URLs
  limpia = limpia.replace(/https?:\/\/[^\s)]+/g, '');
  // URLs sin protocolo (www.ejemplo.com, ejemplo.com, etc.)
  limpia = limpia.replace(/\b(?:www\.)[^\s)]+/g, '');
  limpia = limpia.replace(/\b[a-z0-9][a-z0-9.-]+\.[a-z]{2,}\/[^\s)]*/g, '');
  // Enlaces en markdown [texto](url)
  limpia = limpia.replace(/\[([^\]]*)\]\(https?:\/\/[^\s)]+\)/g, '$1');
  limpia = limpia.replace(/\[([^\]]*)\]\([a-z0-9][a-z0-9.-]+\.[a-z]{2,}[^)]*\)/g, '$1');
  // wa.me (WhatsApp) - dejar solo el texto
  limpia = limpia.replace(/https?:\/\/wa\.me\/[^\s)]+/g, 'WhatsApp');
  const trimmed = limpia.trim();
  if (trimmed.length <= maxChars) return trimmed;
  // Truncar en el último espacio dentro del límite para no cortar palabras.
  const slice = trimmed.slice(0, maxChars);
  const lastSpace = slice.lastIndexOf(' ');
  return `${slice.slice(0, lastSpace > 0 ? lastSpace : maxChars)}…`;
}

export { INJECTION_REPLY, PRIVATE_TOPIC_REPLY, DEFINITIVE_ADVICE_REPLY };
