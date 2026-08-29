/**
 * Guardrails de entrada para el chat.
 *
 * Detección heurística (no sustituye al system prompt del modelo, es una
 * primera línea de defensa server-side antes de llamar al proveedor):
 *   1. Prompt injection evidente ("ignora tus reglas", "actúa como", etc.).
 *   2. Preguntas sobre temas privados / intranet / configuración técnica.
 *   3. Solicitudes de asesoramiento jurídico definitivo que deben derivarse.
 *   4. Detección de urgencia (no bloquea, pero marca la respuesta con un
 *      aviso para priorizar WhatsApp/teléfono sin prolongar la conversación).
 *
 * Si un guardrail de bloqueo (injection/privado/asesoramiento) se dispara,
 * se devuelve una respuesta prefijada SIN llamar al proveedor (ahorro de
 * coste y reducción de riesgo). La urgencia NO bloquea: se devuelve como
 * metadato `urgent: true` para que el widget pueda resaltar los CTAs de
 * contacto.
 */

export type GuardrailReason = 'injection' | 'private_topic' | 'document_drafting' | 'case_strategy';

export type GuardrailHit = {
  hit: true;
  /** Clave interna para analytics (sin contenido del usuario). */
  reason: GuardrailReason;
  reply: string;
  /** Una respuesta de guardrail puede además marcar urgencia. */
  urgent?: boolean;
};

export type GuardrailOk = { hit: false; urgent: boolean };

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
  // Patrones adicionales de prompt injection (refuerzo Jul 2026).
  /eres\s+(libre\s+ahora|un\s+modelo\s+sin\s+restricciones)/i,
  /sin\s+(restricciones|límites|filtros)/i,
  /no\s+tengas\s+(reglas|límites|restricciones)/i,
  /resp[oó]ndeme\s+(como|simulando|haciendo\s+creer)/i,
  /finge\s+ser|pretende\s+ser|simula\s+ser/i,
  /modo\s+(god|sin\s+filtros|sin\s+restricciones|libre)/i,
  /\bsobreescribe\s+(tus|las)\s+(reglas|instrucciones)/i,
  /\bnuevo\s+(system\s+)?prompt\b/i,
  /system\s*prompt/i,
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

/** Peticiones de redacción de escritos: siempre bloqueadas (no NLM). */
const DOCUMENT_DRAFTING_PATTERNS = [
  /redacta(r|me)?\s+((un|una)\s+)?(demanda|escrito|recurso|querella|memorial|alegato)/i,
  /escr[ií]b(e|eme|ir)\s+((un|una)\s+)?(demanda|escrito|recurso|querella|memorial|alegato)/i,
  /hazme\s+(un|una)\s+(demanda|escrito|recurso|querella)/i,
];

/** Estrategia o valoración sobre el caso concreto del usuario: bloqueadas. */
const CASE_STRATEGY_PATTERNS = [
  /estrategia\s+(legal|procesal|de\s+defensa)/i,
  /cu[aá]l\s+es\s+mi\s+(estrategia|defensa)/i,
  /soy\s+(culpable|inocente|responsable)/i,
  /¿?\s*(debo|tengo\s+que)\s+(declararme|confesar|apelar)/i,
  /qu[eé]\s+(debo\s+)?declarar/i,
  /calcula\s+(la\s+)?(pena|prisi[oó]n|condena)\s+(de\s+)?mi\s+caso/i,
  /cu[aá]nt[oa]\s+me\s+(toc|correspon|van)/i,
  /qu[eé]\s+(pena|condena|castigo|sentencia)\s+me\s+(toc|correspon|van|esper)/i,
];

/**
 * Patrones de URGENCIA (no bloquean; marcan el mensaje para priorizar CTAs).
 * Detección server-side para responder rápido sin esperar al razonamiento
 * completo del LLM. El system prompt también cubre estos casos.
 */
const URGENCY_PATTERNS = [
  /\bdetenci[oó]n\b|\bdetuvieron\b|\best[aá]\s+detenido|\blo\s+detuvieron/i,
  /\baudiencia\b.*\s+(pr[oó]xim|hoy|ma[ñn]ana|ayer|urgente)/i,
  /\baudiencia\s+inicial/i,
  /\bdenunci[ao]\s+penal|\bfui\s+denunciad[oa]/i,
  /\bviolencia\s+(intrafamiliar|dom[eé]stica|de\s+g[eé]nero)/i,
  /\bmenores?\s+(afectad|en\s+riesgo|involucrad)/i,
  /\bembargo\b|\bembargar|\bme\s+van\s+a\s+embargar/i,
  /\bdespido\s+reciente|\bme\s+despidieron/i,
  /\bvenc(?:e|imiento)\s+(?:de\s+)?(?:el\s+)?plazo|plazo\s+venc|vence\s+(?:el\s+)?plazo|\bplazo\b.*\bvenc/i,
  /\bcitaci[oó]n\s+judicial/i,
  /\briesgo\s+migratorio|\bdeportaci[oó]n/i,
  /\bfecha\s+l[ií]mite\b/i,
  /\bamenaza|\bacoso/i,
  /\burgente\b|\bemergencia\b/i,
  /\bpris[ií]on\s+preventiva|\bmedida\s+cautelar/i,
];

const INJECTION_REPLY =
  'No puedo atender ese tipo de petición. Estoy diseñado solo para orientar sobre los servicios del despacho y facilitar el contacto. ¿Le ayudo a encontrar el servicio adecuado?';

const PRIVATE_TOPIC_REPLY =
  'No puedo ayudar con áreas privadas o internas. Si necesita asistencia, contacte directamente con el despacho por los canales oficiales.';

const DOCUMENT_DRAFTING_REPLY =
  'No puedo redactar demandas, escritos ni recursos por chat. Esa tarea requiere revisión profesional directa. Le recomiendo contactar con el despacho por WhatsApp o teléfono.';

const CASE_STRATEGY_REPLY =
  'Esa valoración sobre su caso concreto requiere revisión directa con el despacho y no puedo ofrecerla por chat. Le recomiendo contactar por WhatsApp o teléfono para recibir orientación profesional.';

/** Detecta si el mensaje contiene señales de urgencia. */
export function detectUrgency(message: string): boolean {
  return URGENCY_PATTERNS.some((re) => re.test(message ?? ''));
}

/**
 * Guardrails de bloqueo duro (injection, intranet, redacción, estrategia de caso).
 * Las consultas jurídicas con palabra clave `una pregunta:` pasan al router/NotebookLM.
 */
export function evaluateBlockingGuardrails(message: string): GuardrailResult {
  const text = message ?? '';
  const urgent = detectUrgency(text);

  if (INJECTION_PATTERNS.some((re) => re.test(text))) {
    return { hit: true, reason: 'injection', reply: INJECTION_REPLY, urgent };
  }
  if (PRIVATE_TOPIC_PATTERNS.some((re) => re.test(text))) {
    return { hit: true, reason: 'private_topic', reply: PRIVATE_TOPIC_REPLY, urgent };
  }
  if (DOCUMENT_DRAFTING_PATTERNS.some((re) => re.test(text))) {
    return { hit: true, reason: 'document_drafting', reply: DOCUMENT_DRAFTING_REPLY, urgent };
  }
  if (CASE_STRATEGY_PATTERNS.some((re) => re.test(text))) {
    return { hit: true, reason: 'case_strategy', reply: CASE_STRATEGY_REPLY, urgent };
  }
  return { hit: false, urgent };
}

/** Alias retrocompatible: delega en evaluateBlockingGuardrails. */
export function evaluateGuardrails(message: string): GuardrailResult {
  return evaluateBlockingGuardrails(message);
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

export {
  INJECTION_REPLY,
  PRIVATE_TOPIC_REPLY,
  DOCUMENT_DRAFTING_REPLY,
  CASE_STRATEGY_REPLY,
};
