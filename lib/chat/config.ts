/**
 * Configuración centralizada del chat asistente público.
 *
 * Toda la configuración del widget y del endpoint `/api/chat` vive aquí.
 * Esto permite activar/desactivar, ajustar límites y cambiar el proveedor
 * sin tocar componentes ni rutas.
 *
 * Variables de entorno (todas en `.env.local`, NUNCA en el cliente):
 *   CHAT_ENABLED                "false" desactiva el widget en producción
 *   DEEPSEEK_API_KEY            API key del proveedor (solo servidor)
 *   DEEPSEEK_MODEL              Identificador del modelo. Por defecto
 *                               "deepseek-v4-flash" (requerimiento del
 *                               proyecto). Si el proveedor usa otro
 *                               identificador oficial (p. ej. deepseek-chat),
 *                               basta con cambiar esta variable, sin tocar
 *                               código. Documentado en README.md § Chat.
 *   DEEPSEEK_BASE_URL           Base URL de la API (default: api.deepseek.com/v1)
 *   CHAT_TEMPERATURE            Temperatura (default 0.3 — baja, sobria)
 *   CHAT_MAX_TOKENS             Máximo tokens de respuesta (default 400)
 *   CHAT_TIMEOUT_MS             Timeout de la llamada al proveedor (default 20000)
 *   CHAT_MAX_MESSAGE_LENGTH     Longitud máxima de mensaje del usuario (default 600)
 *   CHAT_RATE_LIMIT_PER_IP      Máx mensajes por ventana por IP (default 12)
 *   CHAT_RATE_LIMIT_PER_SESSION Máx mensajes por ventana por sessionId (default 12)
 *   CHAT_RATE_WINDOW_MS         Ventana del rate limit (default 10 min)
 *
 * Las variables NEXT_PUBLIC_CONTACT_* (WhatsApp, teléfono) se leen vía
 * `lib/site.ts`, no desde aquí, para mantener una sola fuente de verdad.
 */

function numEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function boolEnv(name: string, fallback: boolean): boolean {
  const raw = process.env[name]?.toLowerCase();
  if (raw === undefined) return fallback;
  return raw === 'true' || raw === '1' || raw === 'yes';
}

export const chatConfig = {
  /** Activa/desactiva el widget globalmente sin cambiar código. */
  enabled: boolEnv('CHAT_ENABLED', true),

  deepseek: {
    apiKey: process.env.DEEPSEEK_API_KEY ?? '',
    /**
     * "deepseek-v4-flash" es el identificador requerido por el proyecto.
     * Es modificable por env porque los identificadores oficiales de la API
     * pueden cambiar; si el proveedor devuelve error de modelo, el endpoint
     * entra en modo fallback seguro (ver app/api/chat/route.ts).
     */
    model: process.env.DEEPSEEK_MODEL ?? 'deepseek-v4-flash',
    baseUrl: (process.env.DEEPSEEK_BASE_URL ?? 'https://api.deepseek.com/v1').replace(/\/+$/, ''),
  },

  generation: {
    temperature: numEnv('CHAT_TEMPERATURE', 0.3),
    maxTokens: numEnv('CHAT_MAX_TOKENS', 400),
    timeoutMs: numEnv('CHAT_TIMEOUT_MS', 20_000),
  },

  limits: {
    maxMessageLength: numEnv('CHAT_MAX_MESSAGE_LENGTH', 600),
    rateLimitPerIp: numEnv('CHAT_RATE_LIMIT_PER_IP', 12),
    rateLimitPerSession: numEnv('CHAT_RATE_LIMIT_PER_SESSION', 12),
    rateWindowMs: numEnv('CHAT_RATE_WINDOW_MS', 10 * 60 * 1000),
  },

  /** Identidad del asistente mostrada en el widget (client). */
  assistant: {
    name: 'Asistente virtual',
    initialMessage:
      'Hola, soy el asistente virtual de Pineda & Asociados. Estoy a tu disposición para ayudarle a encontrar el servicio adecuado. ¿En qué podemos ayudarle?',
    quickReplies: [
      'Necesito una consulta penal',
      'Tengo una urgencia legal',
      'Quiero saber qué servicio necesito',
      'Soy hondureño en España',
      'Quiero hablar por WhatsApp',
      'Ver servicios jurídicos',
    ],
    disclaimer: 'Este chat ofrece orientación inicial y no sustituye una consulta jurídica.',
  },

  /** Respuesta de fallback cuando no hay IA o el proveedor falla.
   *  Nunca revela configuración interna; solo ofrece canales oficiales. */
  fallbackReply:
    'En este momento no puedo generar una respuesta automática. Le recomiendo contactar directamente con el despacho por WhatsApp o teléfono para recibir atención personalizada.',
} as const;

export type ChatConfig = typeof chatConfig;
