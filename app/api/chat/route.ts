/**
 * POST /api/chat — Endpoint server-side del chat asistente público.
 *
 * Flujo:
 *   1. rate-limit por IP y por sessionId (rateLimits, keyPrefix 'chat_ip' / 'chat_sess').
 *   2. validación Zod (mensaje no vacío, longitud, sessionId, historial corto).
 *   3. guardrails server-side (prompt injection, tema privado, asesoramiento definitivo).
 *   4. si todo OK y hay API key → llamada a DeepSeek → respuesta filtrada.
 *   5. si no hay API key, timeout o error del proveedor → fallback seguro.
 *
 * SEGURIDAD:
 *   - DEEPSEEK_API_KEY nunca se loguea ni se devuelve al cliente.
 *   - Errores son genéricos (no vuelcan stack ni configuración).
 *   - Rate-limit protege contra abuso.
 *   - Solo se llama al proveedor tras pasar guardrails (ahorro + seguridad).
 *
 * No almacena conversaciones: el historial lo envía el cliente por turnos
 * (máx 6 mensajes) y no se persiste en DB.
 */

import { rateLimit, rateLimitResponse, getClientIp } from '@/lib/rate-limit';
import { validate } from '@/lib/validation';
import { chatRequestSchema } from '@/lib/chat/schema';
import { chatConfig } from '@/lib/chat/config';
import { evaluateGuardrails, sanitizeReply } from '@/lib/chat/guardrails';
import { buildSystemPrompt } from '@/lib/chat/system-prompt';
import { buildRAGContext } from '@/lib/chat/knowledge-base';
import { callDeepSeek, isDeepSeekConfigured, type ChatMessage } from '@/lib/chat/deepseek';
import { isRagDisponible } from '@/lib/rag/config';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const ip = getClientIp(request);

  // body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError('JSON inválido', 400);
  }

  // Validación Zod.
  const parsed = validate(chatRequestSchema, body);
  if (!parsed.success) {
    return jsonError(parsed.error, 400);
  }
  const { message, sessionId, history } = parsed.data;

  // Rate-limit por IP y por sessionId (doble cubierta).
  const ipRl = await rateLimit(ip, {
    keyPrefix: 'chat_ip',
    windowMs: chatConfig.limits.rateWindowMs,
    max: chatConfig.limits.rateLimitPerIp,
  });
  if (!ipRl.ok) return rateLimitResponse(ipRl);

  const sessRl = await rateLimit(sessionId, {
    keyPrefix: 'chat_sess',
    windowMs: chatConfig.limits.rateWindowMs,
    max: chatConfig.limits.rateLimitPerSession,
  });
  if (!sessRl.ok) return rateLimitResponse(sessRl);

  // Guardrails server-side: si se disparan, respondemos sin llamar al proveedor.
  const guardrail = evaluateGuardrails(message);
  if (guardrail.hit) {
    // Log estructurado sin contenido del usuario (minimización de datos).
    console.log('[chat] guardrail hit', {
      reason: guardrail.reason,
      ip,
      sessionId: sessionId.slice(0, 8),
    });
    return Response.json({
      reply: guardrail.reply,
      source: 'guardrail',
      urgent: guardrail.urgent === true,
    });
  }

  // Sin API key → fallback directo (modo sin IA).
  if (!isDeepSeekConfigured()) {
    return Response.json({
      reply: chatConfig.fallbackReply,
      source: 'fallback_no_config',
      urgent: guardrail.urgent,
    });
  }

  // Construir mensajes para el proveedor.
  // Incluir contexto RAG si está disponible.
  let ragContext = '';
  if (isRagDisponible()) {
    ragContext = await buildRAGContext(message);
  }
  const messages: ChatMessage[] = [
    { role: 'system', content: buildSystemPrompt(ragContext) },
    ...history.map((h) => ({ role: h.role, content: h.content }) as ChatMessage),
    { role: 'user', content: message },
  ];

  const result = await callDeepSeek(messages);

  if (!result.ok) {
    // Log genérico sin volcar el error detallado del proveedor al cliente.
    console.warn('[chat] proveedor falló', {
      error: result.error,
      durationMs: result.durationMs,
    });
    return Response.json({
      reply: chatConfig.fallbackReply,
      source: 'fallback_provider_error',
    });
  }

  // Respuesta filtrada (truncado defensivo por caracteres).
  const reply = sanitizeReply(result.reply);

  return Response.json({
    reply,
    source: 'deepseek',
    // Detección de urgencia server-side: si el mensaje del usuario coincide
    // con patrones de urgencia, se marca para que el widget resalte CTAs.
    urgent: guardrail.urgent,
  });
}

/** Respuesta de error JSON estándar (sin detalles internos). */
function jsonError(message: string, status: number): Response {
  return Response.json({ error: message }, { status });
}
