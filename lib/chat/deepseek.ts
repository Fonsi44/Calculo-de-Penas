/**
 * Cliente server-side para DeepSeek (chat completions).
 *
 * Reutiliza el patrón de lib/sgie/ia-documental.ts: fetch con
 * AbortController para timeout y reintentos en 429/5xx.
 *
 * SEGURIDAD:
 *   - DEEPSEEK_API_KEY se lee de process.env y NUNCA se expone al cliente.
 *   - Este módulo solo se importa desde route handlers server-side.
 */

import { chatConfig } from './config';

export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

export type DeepSeekResult =
  | { ok: true; reply: string; tokensInput?: number; tokensOutput?: number; durationMs: number }
  | { ok: false; error: string; durationMs: number };

/** Indica si el proveedor está configurado (API key presente). */
export function isDeepSeekConfigured(): boolean {
  return chatConfig.deepseek.apiKey.length > 0;
}

/** Llama al endpoint /chat/completions de DeepSeek con un sistema de mensajes. */
export async function callDeepSeek(messages: ChatMessage[]): Promise<DeepSeekResult> {
  const cfg = chatConfig;
  const t0 = Date.now();

  if (!isDeepSeekConfigured()) {
    return { ok: false, error: 'DEEPSEEK_API_KEY no configurada', durationMs: 0 };
  }

  const { apiKey, model, baseUrl } = cfg.deepseek;
  const { temperature, maxTokens, timeoutMs } = cfg.generation;
  const maxRetries = 1;
  let lastError = '';

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          max_tokens: maxTokens,
          // No response_format json_object: el chat es texto libre.
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!res.ok) {
        // No logueamos el cuerpo: puede contener eco del prompt del usuario.
        await res.text().catch(() => {});
        lastError = `HTTP ${res.status}`;
        // Reintentar solo en 429 o 5xx.
        if (res.status === 429 || res.status >= 500) continue;
        return { ok: false, error: lastError, durationMs: Date.now() - t0 };
      }

      const data = await res.json();
      const content: string | undefined = data?.choices?.[0]?.message?.content;
      if (!content || !content.trim()) {
        lastError = 'Respuesta del proveedor sin contenido';
        continue;
      }

      return {
        ok: true,
        reply: content,
        tokensInput: data?.usage?.prompt_tokens,
        tokensOutput: data?.usage?.completion_tokens,
        durationMs: Date.now() - t0,
      };
    } catch (err) {
      clearTimeout(timeout);
      lastError = (err as Error).message;
      if ((err as Error).name === 'AbortError') {
        lastError = `Timeout (${timeoutMs}ms)`;
      }
      // Reintentar en errores de red.
    }
  }

  return { ok: false, error: lastError, durationMs: Date.now() - t0 };
}
