/**
 * SGIE — Búsqueda híbrida (textual + ranking) para consulta inteligente (Sprint 4, tarea 5).
 *
 * Sin embeddings/índice semántico (no existen en el repo), implementa "consulta
 * asistida": tokeniza el término, busca coincidencias en textos y puntúa por
 * relevancia (TF simple con boost de título). NO es semántica real ni IA:
 * es ranking textual transparente. Función pura, testeable.
 *
 * La capa IA (si está disponible) puede añadir un resumen de los resultados
 * desde el endpoint, pero el ranking es determinista y auditable.
 *
 * Sprint 4.
 */

export interface DocumentoBuscable {
  id: string;
  tipo: 'expediente' | 'documento' | 'campo' | 'cliente' | 'tarea';
  titulo: string;
  subtitulo: string | null;
  cuerpo: string | null;
  href: string;
}

export interface ResultadoHibrido extends DocumentoBuscable {
  puntaje: number;
  coincidencias: string[];
}

/**
 * Normaliza un texto para comparación: minúsculas, sin acentos, sin signos.
 * Función pura.
 */
export function normalizarTexto(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quitar acentos
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Tokeniza un término de búsqueda en palabras significativas (longitud ≥ 2,
 * sin stopwords básicas del español).
 */
const STOPWORDS = new Set(['de', 'la', 'el', 'los', 'las', 'y', 'en', 'a', 'un', 'una', 'unos', 'unas', 'del', 'al', 'por', 'para', 'que', 'con']);

export function tokenizar(q: string): string[] {
  return normalizarTexto(q)
    .split(' ')
    .filter((t) => t.length >= 2 && !STOPWORDS.has(t));
}

/**
 * Puntúa un documento contra los tokens de búsqueda.
 * - Coincidencia en título: +3 por token.
 * - Coincidencia en subtitulo: +2 por token.
 * - Coincidencia en cuerpo: +1 por token.
 * Coincidencia = el token aparece como palabra completa en el texto normalizado.
 *
 * Función pura. Determinista.
 */
export function puntuarDocumento(doc: DocumentoBuscable, tokens: string[]): { puntaje: number; coincidencias: string[] } {
  if (tokens.length === 0) return { puntaje: 0, coincidencias: [] };

  const tituloTokens = new Set(normalizarTexto(doc.titulo).split(' '));
  const subtituloTokens = doc.subtitulo ? new Set(normalizarTexto(doc.subtitulo).split(' ')) : new Set<string>();
  const cuerpoTokens = doc.cuerpo ? new Set(normalizarTexto(doc.cuerpo).split(' ')) : new Set<string>();

  let puntaje = 0;
  const coincidencias: string[] = [];

  for (const t of tokens) {
    let encontrado = false;
    if (tituloTokens.has(t)) { puntaje += 3; encontrado = true; }
    if (subtituloTokens.has(t)) { puntaje += 2; encontrado = true; }
    if (cuerpoTokens.has(t)) { puntaje += 1; encontrado = true; }
    if (encontrado) coincidencias.push(t);
  }

  return { puntaje, coincidencias };
}

/**
 * Rankea documentos por relevancia contra el término de búsqueda.
 * Devuelve sólo los que tienen puntaje > 0, ordenados descendente.
 * Función pura.
 */
export function rankear(documentos: DocumentoBuscable[], q: string): ResultadoHibrido[] {
  const tokens = tokenizar(q);
  if (tokens.length === 0) return [];

  return documentos
    .map((doc) => {
      const { puntaje, coincidencias } = puntuarDocumento(doc, tokens);
      return { ...doc, puntaje, coincidencias };
    })
    .filter((r) => r.puntaje > 0)
    .sort((a, b) => b.puntaje - a.puntaje);
}
