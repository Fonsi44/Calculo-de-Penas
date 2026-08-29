/**
 * Núcleo compartido para consultas NotebookLM vía CLI `nlm`.
 * Usado por scripts editoriales y por el microservicio proxy.
 */

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export interface NlmQueryOptions {
  question: string;
  notebookId?: string;
  conversationId?: string;
  timeoutSec?: number;
  newConversation?: boolean;
  nlmBin?: string;
}

export interface NlmQueryResult {
  answer: string;
  conversationId?: string;
  raw: unknown;
}

const DEFAULT_TIMEOUT_SEC = 180;
const MAX_RETRIES = 2;
const MAX_RATE_LIMIT_RETRIES = 8;
const RETRY_DELAY_MS = 3000;
const RATE_LIMIT_BASE_DELAY_MS = 45_000;

function isRateLimitError(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    lower.includes('usage limit')
    || lower.includes('rate limit')
    || lower.includes('temporarily rejected')
    || lower.includes('too many requests')
  );
}

function isTransientNlmError(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    isRateLimitError(text)
    || lower.includes('timeout')
    || lower.includes('temporarily unavailable')
    || lower.includes('econnreset')
    || lower.includes('socket hang up')
  );
}

function extractExecErrorText(err: unknown): string {
  if (!err || typeof err !== 'object') return String(err ?? '');
  const e = err as { message?: string; stdout?: string; stderr?: string };
  return [e.message, e.stdout, e.stderr].filter(Boolean).join('\n');
}

function assertSuccessfulNlmPayload(raw: unknown): void {
  if (!raw || typeof raw !== 'object') return;
  const obj = raw as Record<string, unknown>;
  if (obj.status === 'error') {
    const message = String(obj.error ?? obj.message ?? 'Error NLM');
    throw new Error(message);
  }
}

export function getNlmBin(): string {
  return process.env.NLM_BIN?.trim() || 'nlm';
}

export function getNotebookId(): string {
  const id = process.env.NOTEBOOKLM_NOTEBOOK_ID?.trim();
  if (!id) {
    throw new Error(
      'NOTEBOOKLM_NOTEBOOK_ID no configurada. Defínela en .env.local o use: nlm alias set legal <notebook-id>',
    );
  }
  return id;
}

/** Extrae respuesta y conversationId de un payload JSON de `nlm`. */
export function extractAnswerFromJson(payload: unknown): { answer: string; conversationId?: string } {
  if (!payload || typeof payload !== 'object') {
    return { answer: String(payload ?? '') };
  }
  const obj = payload as Record<string, unknown>;
  const answer =
    (typeof obj.answer === 'string' && obj.answer) ||
    (typeof obj.response === 'string' && obj.response) ||
    (typeof obj.text === 'string' && obj.text) ||
    (typeof obj.message === 'string' && obj.message) ||
    '';
  const conversationId =
    (typeof obj.conversation_id === 'string' && obj.conversation_id) ||
    (typeof obj.conversationId === 'string' && obj.conversationId) ||
    undefined;
  if (answer) return { answer, conversationId };
  return { answer: JSON.stringify(payload), conversationId };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Ejecuta `nlm notebook query` y devuelve la respuesta parseada.
 * Reintenta hasta MAX_RETRIES en errores transitorios.
 */
export async function queryNotebook(options: NlmQueryOptions): Promise<NlmQueryResult> {
  const nlmBin = options.nlmBin ?? getNlmBin();
  const notebookId = options.notebookId ?? getNotebookId();
  const timeoutSec = options.timeoutSec ?? DEFAULT_TIMEOUT_SEC;

  const args = [
    'notebook',
    'query',
    notebookId,
    options.question,
    '--json',
    '--timeout',
    String(timeoutSec),
  ];
  if (options.conversationId) {
    args.push('--conversation-id', options.conversationId);
  }
  if (options.newConversation) {
    args.push('--new-conversation');
  }

  let lastError: Error | null = null;
  let rateLimitAttempts = 0;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const { stdout, stderr } = await execFileAsync(nlmBin, args, {
        maxBuffer: 10 * 1024 * 1024,
        timeout: (timeoutSec + 30) * 1000,
      });
      const combined = stdout.trim() || stderr.trim();
      if (!combined) {
        throw new Error('nlm devolvió salida vacía');
      }
      let raw: unknown = combined;
      try {
        raw = JSON.parse(combined);
      } catch {
        raw = { answer: combined };
      }
      assertSuccessfulNlmPayload(raw);
      const { answer, conversationId } = extractAnswerFromJson(raw);
      return { answer, conversationId, raw };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      const errorText = extractExecErrorText(err);
      if (isRateLimitError(errorText) && rateLimitAttempts < MAX_RATE_LIMIT_RETRIES) {
        rateLimitAttempts++;
        const waitMs = RATE_LIMIT_BASE_DELAY_MS * rateLimitAttempts;
        console.warn(
          `  ⏳ Límite NLM alcanzado; reintento ${rateLimitAttempts}/${MAX_RATE_LIMIT_RETRIES} en ${Math.round(waitMs / 1000)}s...`,
        );
        await sleep(waitMs);
        attempt--;
        continue;
      }
      if (attempt < MAX_RETRIES && isTransientNlmError(errorText)) {
        await sleep(RETRY_DELAY_MS * (attempt + 1));
      }
    }
  }
  throw lastError ?? new Error('Error desconocido al consultar NotebookLM');
}
