/**
 * Esquemas Zod del chat asistente.
 *
 * Validación server-side del payload POST /api/chat.
 */

import { z } from 'zod';
import { chatConfig } from './config';

export const chatRequestSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, 'Mensaje vacío')
    .max(chatConfig.limits.maxMessageLength, 'Mensaje demasiado largo'),
  /** Identificador de sesión generado en el cliente (localStorage).
   *  No contiene contenido de conversación; sirve solo para rate-limit
   *  por sesión y mantener coherencia mínima de turnos. */
  sessionId: z
    .string()
    .trim()
    .min(8, 'sessionId inválido')
    .max(64, 'sessionId inválido')
    .regex(/^[a-zA-Z0-9_-]+$/, 'sessionId inválido'),
  /** Historial corto (máx 6 turnos) para coherencia conversacional.
   *  Solo role + content saneado; nunca PII obligatoria. */
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().trim().max(chatConfig.limits.maxMessageLength),
      }),
    )
    .max(6)
    .optional()
    .default([]),
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;
