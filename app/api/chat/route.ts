/**
 * POST /api/chat — Endpoint server-side del chat asistente público.
 *
 * Flujo:
 *   1. rate-limit por IP y por sessionId (rateLimits, keyPrefix 'chat_ip' / 'chat_sess').
 *   2. validación Zod (mensaje no vacío, longitud, sessionId, historial corto).
 *   3. guardrails server-side (prompt injection, tema privado, asesoramiento definitivo).
 *   4. motor de reglas local (sin LLM externo): los mensajes del usuario NO se
 *      transmiten a ningún proveedor de IA. Se procesan localmente con reglas,
 *      plantillas y heurísticas.
 *
 * SEGURIDAD Y PRIVACIDAD:
 *   - Los mensajes del usuario NO se envían a ningún proveedor externo de IA.
 *   - No se persisten conversaciones: el historial lo envía el cliente por turnos
 *     (máx 6 mensajes) y no se almacena en DB.
 *   - No se loguea contenido sensible completo.
 *   - Errores son genéricos (no vuelcan stack ni configuración).
 *   - Rate-limit protege contra abuso.
 *
 * El endpoint se mantiene server-side (en lugar de mover todo al cliente) para:
 *   - Centralizar los guardrails y rate-limiting (defensa en profundidad).
 *   - Evitar exponer la lógica de reglas/heurísticas en el bundle del cliente.
 *   - Registrar eventos mínimos de analytics sin datos sensibles.
 */

import { rateLimit, rateLimitResponse, getClientIp } from '@/lib/rate-limit';
import { validate } from '@/lib/validation';
import { chatRequestSchema } from '@/lib/chat/schema';
import { chatConfig } from '@/lib/chat/config';
import { evaluateGuardrails, sanitizeReply } from '@/lib/chat/guardrails';
import { procesarMensajeLocal } from '@/lib/chat/rules-engine';

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
  const { message, sessionId } = parsed.data;

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

  // Guardrails server-side: si se disparan, respondemos sin procesar más.
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

  // Motor de reglas local: procesa el mensaje sin llamar a ningún proveedor externo.
  const result = procesarMensajeLocal(message);
  return Response.json({
    reply: sanitizeReply(result.reply),
    source: 'rules',
    urgent: result.urgent,
  });
}

/** Respuesta de error JSON estándar (sin detalles internos). */
function jsonError(message: string, status: number): Response {
  return Response.json({ error: message }, { status });
}
