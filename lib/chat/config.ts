/**
 * Configuración centralizada del chat asistente público.
 *
 * Toda la configuración del widget y del endpoint `/api/chat` vive aquí.
 * Esto permite activar/desactivar y ajustar límites sin tocar componentes ni rutas.
 *
 * El chat funciona exclusivamente con un motor de reglas local: NO usa ningún
 * proveedor de LLM externo (DeepSeek, OpenAI, etc.) y los mensajes del usuario
 * no se transmiten a terceros. No se requiere ninguna API key de IA.
 *
 * Variables de entorno (todas en `.env.local`, NUNCA en el cliente):
 *   CHAT_ENABLED                "false" desactiva el widget en producción
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

  limits: {
    maxMessageLength: numEnv('CHAT_MAX_MESSAGE_LENGTH', 600),
    rateLimitPerIp: numEnv('CHAT_RATE_LIMIT_PER_IP', 12),
    rateLimitPerSession: numEnv('CHAT_RATE_LIMIT_PER_SESSION', 12),
    rateWindowMs: numEnv('CHAT_RATE_WINDOW_MS', 10 * 60 * 1000),
  },

  /** Identidad del asistente mostrada en el widget (client). */
  assistant: {
    name: 'Asistente virtual',
    // Mensaje inicial con triple aviso obligatorio: sistema automatizado + no asesoría + privacidad.
    initialMessage:
      'Hola, soy el asistente virtual de Pineda y Asociados. Le ayudo a identificar el área legal de su consulta, preparar un resumen inicial y contactar con el despacho. Soy un sistema automatizado (no abogado) y esto no sustituye una consulta jurídica personalizada. Sus mensajes se procesan localmente y no se envían a proveedores externos de IA; puede ver nuestra política de privacidad en el pie de página. ¿En qué podemos ayudarle?',
    quickReplies: [
      'Preparar consulta',
      'Identificar área legal',
      'Caso urgente',
      'Enviar WhatsApp',
      'Ir al formulario',
      'Soy hondureño en España',
    ],
    disclaimer:
      'Asistente automatizado. Orientación inicial, no asesoría jurídica. No sustituye una consulta profesional.',
  },

  /** Respuesta de fallback cuando ocurre un error inesperado.
   *  Nunca revela configuración interna; solo ofrece canales oficiales. */
  fallbackReply:
    'En este momento no puedo procesar su mensaje. Le recomiendo contactar directamente con el despacho por WhatsApp o teléfono para recibir atención personalizada.',
} as const;

export type ChatConfig = typeof chatConfig;
