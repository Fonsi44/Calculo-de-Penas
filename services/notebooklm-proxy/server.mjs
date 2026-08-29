/**
 * Microservicio proxy NotebookLM para el chat público.
 * Ejecuta `nlm notebook query` en un servidor con sesión Google autenticada.
 *
 * Variables: NOTEBOOKLM_PROXY_API_KEY, NOTEBOOKLM_NOTEBOOK_ID, NLM_BIN, PORT
 */

import { createServer } from 'node:http';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const PORT = Number(process.env.PORT) || 8787;
const API_KEY = process.env.NOTEBOOKLM_PROXY_API_KEY?.trim();
const NOTEBOOK_ID = process.env.NOTEBOOKLM_NOTEBOOK_ID?.trim();
const NLM_BIN = process.env.NLM_BIN?.trim() || 'nlm';
const TIMEOUT_MS = Number(process.env.CHAT_NOTEBOOKLM_TIMEOUT_MS) || 90_000;
const TIMEOUT_SEC = Math.max(10, Math.ceil(TIMEOUT_MS / 1000));

const rateLimitMap = new Map();
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX = 30;

function json(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function checkAuth(req) {
  if (!API_KEY) return false;
  const header = req.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  return token === API_KEY;
}

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_MAX) return false;
  entry.count += 1;
  return true;
}

function extractAnswer(raw) {
  if (!raw || typeof raw !== 'object') return { answer: String(raw ?? '') };
  const answer =
    raw.answer || raw.response || raw.text || raw.message || '';
  const conversationId = raw.conversation_id || raw.conversationId;
  if (answer) return { answer: String(answer), conversationId };
  return { answer: JSON.stringify(raw), conversationId };
}

async function queryNotebook(question, conversationId) {
  if (!NOTEBOOK_ID) throw new Error('NOTEBOOKLM_NOTEBOOK_ID no configurada');
  const args = [
    'notebook', 'query', NOTEBOOK_ID, question,
    '--json', '--timeout', String(TIMEOUT_SEC),
  ];
  if (conversationId) args.push('--conversation-id', conversationId);

  const { stdout, stderr } = await execFileAsync(NLM_BIN, args, {
    maxBuffer: 10 * 1024 * 1024,
    timeout: (TIMEOUT_SEC + 30) * 1000,
  });
  const combined = stdout.trim() || stderr.trim();
  if (!combined) throw new Error('nlm devolvió salida vacía');
  let raw;
  try {
    raw = JSON.parse(combined);
  } catch {
    raw = { answer: combined };
  }
  if (raw?.status === 'error') {
    throw new Error(String(raw.error ?? raw.message ?? 'Error NLM'));
  }
  return extractAnswer(raw);
}

async function handleQuery(req, res) {
  if (!API_KEY) {
    json(res, 503, { error: 'NOTEBOOKLM_PROXY_API_KEY no configurada' });
    return;
  }
  if (!checkAuth(req)) {
    json(res, 401, { error: 'No autorizado' });
    return;
  }

  const ip = req.socket.remoteAddress ?? 'unknown';
  if (!checkRateLimit(ip)) {
    json(res, 429, { error: 'Demasiadas solicitudes' });
    return;
  }

  let payload;
  try {
    payload = JSON.parse(await readBody(req));
  } catch {
    json(res, 400, { error: 'JSON inválido' });
    return;
  }

  const question = payload.question?.trim();
  if (!question || question.length > 4000) {
    json(res, 400, { error: 'Pregunta inválida' });
    return;
  }

  try {
    const result = await queryNotebook(question, payload.conversationId);
    json(res, 200, result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error interno';
    json(res, 502, { error: message });
  }
}

createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/health') {
    json(res, 200, { status: 'ok' });
    return;
  }
  if (req.method === 'POST' && (req.url === '/query' || req.url === '/')) {
    await handleQuery(req, res);
    return;
  }
  json(res, 404, { error: 'No encontrado' });
}).listen(PORT, () => {
  console.log(`[notebooklm-proxy] escuchando en :${PORT}`);
});
