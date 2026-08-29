/**
 * Configuración centralizada del chat asistente público.
 *
 * Toda la configuración del widget y del endpoint `/api/chat` vive aquí.
 * El chat es híbrido: motor de reglas local para el público y NotebookLM vía
 * proxy propio solo con la palabra clave interna `una pregunta:` (requiere NOTEBOOKLM_PROXY_*).
 *
 * Variables de entorno (todas en `.env.local`, NUNCA en el cliente):
 *   CHAT_ENABLED                      "false" desactiva el widget
 *   CHAT_NOTEBOOKLM_ENABLED           "true" activa consultas jurídicas vía NLM
 *   NOTEBOOKLM_PROXY_URL              URL del proxy (ej. https://host/query)
 *   NOTEBOOKLM_PROXY_API_KEY          API key del proxy (solo servidor)
 *   CHAT_NOTEBOOKLM_TIMEOUT_MS        Timeout consulta NLM (default 180000)
 *   CHAT_NOTEBOOKLM_RATE_LIMIT_PER_SESSION  Límite NLM por sesión (default 6)
 *   CHAT_MAX_MESSAGE_LENGTH           Longitud máxima de mensaje (default 600)
 *   CHAT_RATE_LIMIT_PER_IP            Máx mensajes por ventana por IP (default 12)
 *   CHAT_RATE_LIMIT_PER_SESSION       Máx mensajes por ventana por sessionId (default 12)
 *   CHAT_RATE_WINDOW_MS               Ventana del rate limit (default 10 min)
 */

import { LEGAL_DISCLAIMER_SHORT } from '@/lib/legal-disclaimer';

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

  notebooklm: {
    enabled: boolEnv('CHAT_NOTEBOOKLM_ENABLED', false),
    timeoutMs: numEnv('CHAT_NOTEBOOKLM_TIMEOUT_MS', 180_000),
    rateLimitPerSession: numEnv('CHAT_NOTEBOOKLM_RATE_LIMIT_PER_SESSION', 6),
  },

  /** Identidad del asistente mostrada en el widget (client). */
  assistant: {
    name: 'Asistente virtual',
    initialMessage:
      'Hola, soy el asistente virtual de Pineda y Asociados. Le ayudo con información sobre nuestros servicios, a preparar su consulta y a orientarle sobre cómo contactar con el despacho. Soy un sistema automatizado (no abogado) y esto no sustituye una consulta jurídica personalizada. ¿En qué podemos ayudarle?',
    quickReplies: [
      'Preparar consulta',
      'Identificar área legal',
      'Caso urgente',
      'Enviar WhatsApp',
      'Ir al formulario',
      'Soy hondureño en España',
    ],
    disclaimer: LEGAL_DISCLAIMER_SHORT,
    notebooklmBadge: 'Basado en fuentes legales del despacho',
  },

  /** Respuesta de fallback cuando ocurre un error inesperado. */
  fallbackReply:
    'En este momento no puedo procesar su mensaje. Le recomiendo contactar directamente con el despacho por WhatsApp o teléfono para recibir atención personalizada.',
} as const;

export type ChatConfig = typeof chatConfig;
