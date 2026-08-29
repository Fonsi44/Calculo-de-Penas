/**
 * POST /api/chat — Endpoint server-side del chat asistente público (híbrido).
 *
 * Flujo:
 *   1. rate-limit por IP y por sessionId.
 *   2. validación Zod.
 *   3. guardrails de bloqueo duro (injection, intranet, redacción, estrategia).
 *   4. router: sitio → motor de reglas; «una pregunta:» → NotebookLM (si habilitado).
 *   5. degradación segura a reglas si NLM falla.
 */

import { rateLimit, rateLimitResponse, getClientIp } from '@/lib/rate-limit';
import { validate } from '@/lib/validation';
import { chatRequestSchema } from '@/lib/chat/schema';
import { chatConfig } from '@/lib/chat/config';
import { evaluateBlockingGuardrails, sanitizeReply, detectUrgency } from '@/lib/chat/guardrails';
import { procesarMensajeLocal } from '@/lib/chat/rules-engine';
import { routeChatMessage } from '@/lib/chat/router';
import {
  buildChatLegalPrompt,
  finalizeNlmAnswerForChat,
  isInsufficientAnswer,
  NLM_REPLY_MAX_CHARS,
} from '@/lib/chat/notebooklm-prompt';
import {
  hasLawyerNotebookShortcut,
  stripLawyerNotebookShortcut,
} from '@/lib/chat/lawyer-shortcut';
import {
  LEGAL_CORPUS_ERROR_REPLY,
  LEGAL_CORPUS_RATE_LIMIT_REPLY,
  LEGAL_CORPUS_TIMEOUT_REPLY,
  LEGAL_CORPUS_UNAVAILABLE_REPLY,
} from '@/lib/chat/legal-corpus-fallback';
import {
  isNotebookLmChatConfigured,
  queryNotebookLmForChat,
  NotebookLmChatError,
} from '@/lib/notebooklm/chat-client';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const ip = getClientIp(request);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError('JSON inválido', 400);
  }

  const parsed = validate(chatRequestSchema, body);
  if (!parsed.success) {
    return jsonError(parsed.error, 400);
  }
  const { message, sessionId, history, conversationId } = parsed.data;

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

  const blocking = evaluateBlockingGuardrails(message);
  if (blocking.hit) {
    console.log('[chat] guardrail hit', {
      reason: blocking.reason,
      ip,
      sessionId: sessionId.slice(0, 8),
    });
    return Response.json({
      reply: blocking.reply,
      source: 'guardrail',
      urgent: blocking.urgent === true,
    });
  }

  const routed = routeChatMessage(message);
  if (routed.route === 'blocked' && routed.guardrail) {
    return Response.json({
      reply: routed.guardrail.reply,
      source: 'guardrail',
      urgent: routed.guardrail.urgent === true,
    });
  }

  const urgent = detectUrgency(message);

  if (routed.route === 'legal') {
    const legalMessage = hasLawyerNotebookShortcut(message)
      ? stripLawyerNotebookShortcut(message)
      : message;

    if (hasLawyerNotebookShortcut(message) && !legalMessage) {
      return Response.json({
        reply:
          'Escriba la consulta jurídica justo después de «una pregunta:». Ejemplo: una pregunta: ¿cómo se tramita un poder desde España?',
        source: 'rules',
        urgent: false,
      });
    }

    if (!isNotebookLmChatConfigured()) {
      return Response.json({
        reply: LEGAL_CORPUS_UNAVAILABLE_REPLY,
        source: 'fallback_no_config',
        urgent: false,
      });
    }

    const nlmRl = await rateLimit(sessionId, {
      keyPrefix: 'chat_nlm_sess',
      windowMs: chatConfig.limits.rateWindowMs,
      max: chatConfig.notebooklm.rateLimitPerSession,
    });
    if (!nlmRl.ok) {
      return Response.json({
        reply: LEGAL_CORPUS_RATE_LIMIT_REPLY,
        source: 'fallback_provider_error',
        urgent,
      });
    }

    try {
      const prompt = buildChatLegalPrompt(legalMessage, urgent);
      const nlm = await queryNotebookLmForChat({
        question: prompt,
        conversationId: conversationId ?? undefined,
        sessionId,
      });

      let reply = finalizeNlmAnswerForChat(nlm.answer);
      if (isInsufficientAnswer(nlm.answer)) {
        reply = sanitizeReply(
          `${reply} Le recomiendo contactar con el despacho para una evaluación de su caso concreto.`,
          NLM_REPLY_MAX_CHARS,
        );
      } else {
        reply = sanitizeReply(reply, NLM_REPLY_MAX_CHARS);
      }

      if (urgent) {
        reply += ' Su caso parece urgente: contacte al despacho por WhatsApp o teléfono lo antes posible.';
      }

      return Response.json({
        reply,
        source: 'notebooklm',
        urgent,
        conversationId: nlm.conversationId,
      });
    } catch (err) {
      const code = err instanceof NotebookLmChatError ? err.code : 'unknown';
      console.log('[chat] notebooklm error', {
        code,
        sessionId: sessionId.slice(0, 8),
      });
      const reply =
        code === 'timeout' ? LEGAL_CORPUS_TIMEOUT_REPLY : LEGAL_CORPUS_ERROR_REPLY;
      return Response.json({
        reply,
        source: 'fallback_provider_error',
        urgent,
      });
    }
  }

  const result = procesarMensajeLocal(message);
  return Response.json({
    reply: sanitizeReply(result.reply),
    source: 'rules',
    urgent: result.urgent,
  });
}

function jsonError(message: string, status: number): Response {
  return Response.json({ error: message }, { status });
}
