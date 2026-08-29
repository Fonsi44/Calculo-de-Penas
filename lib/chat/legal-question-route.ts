/**
 * Detecta consultas jurídicas sustantivas que deben derivar al abogado
 * (sin responder contenido legal en el chat público).
 */

const LEGAL_QUESTION_PATTERNS: RegExp[] = [
  /\bcu[aá]nto\s+tiempo\b/i,
  /\bcu[aá]ntos?\s+a[nñ]os?\b/i,
  /\bplazo\b/i,
  /\bes\s+legal\b/i,
  /\btengo\s+derecho\b/i,
  /\bpuedo\s+demandar\b/i,
  /\bme\s+pueden\s+condenar\b/i,
  /\bqu[eé]\s+pena\b/i,
  /\bart[ií]culo\s+\d+/i,
  /\bc[oó]digo\s+(penal|civil|de\s+trabajo)/i,
  /\bes\s+delito\b/i,
  /\bqu[eé]\s+documentos\s+necesito\s+para\b/i,
  /\bc[oó]mo\s+se\s+tramita\b/i,
  /\bprocedimiento\s+para\b/i,
];

export function isSubstantiveLegalQuestion(message: string): boolean {
  const text = message ?? '';
  return LEGAL_QUESTION_PATTERNS.some((re) => re.test(text));
}
