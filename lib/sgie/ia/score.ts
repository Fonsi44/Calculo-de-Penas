/**
 * SGIE — Score compuesto documento-expediente (Fase 4).
 *
 * Primera versión DETERMINISTA (no depende solo de la confianza del modelo):
 * combina coincidencias entre los datos extraídos por la IA y los datos
 * esperados del expediente/cliente, más la confianza de extracción y las
 * contradicciones detectadas.
 *
 * La IA NUNCA aprueba jurídicamente: el `suggested_status` es una sugerencia
 * operativa que el humano (asistente/abogado) confirma, escala o ignora.
 *
 * Referencia: docs/implementation/mvp-fase-4-ia-documental-deepseek.md
 */

export type CheckStatus = 'pass' | 'warn' | 'fail' | 'unknown';

export interface ValidationCheck {
  check_name: string;
  status: CheckStatus;
  score: number; // 0–100 (contribución al score compuesto)
  reason: string;
}

export type SuggestedStatus =
  | 'prevalidado'
  | 'aceptado_con_advertencia'
  | 'revision_asistente'
  | 'revision_abogado'
  | 'correccion_cliente'
  | 'rechazado';

export interface ScoreInput {
  /** Confianza de extracción de la IA (0–100). */
  iaConfidence: number;
  /** Coincidencia de cliente (nombre). */
  clienteCoincide: boolean | null;
  /** Coincidencia de identidad/RTN. */
  identidadCoincide: boolean | null;
  /** El tipo documental esperado coincide con el sugerido. */
  tipoDocumentalCoincide: boolean | null;
  /** Coincidencia de número de expediente judicial. */
  numeroJudicialCoincide: boolean | null;
  /** Coincidencia de materia. */
  materiaCoincide: boolean | null;
  /** Coincidencia de juzgado/autoridad. */
  juzgadoCoincide: boolean | null;
  /** Hay contradicciones detectadas (críticas si contradiccionCritica=true). */
  contradicciones: boolean;
  contradiccionCritica: boolean;
  /** El requisito exigía identidad y no se encontró. */
  identidadEsperadaAusente: boolean;
  /** Número de campos extraídos con valor. */
  camposExtraidos: number;
}

export interface ScoreResult {
  score: number; // 0–100
  checks: ValidationCheck[];
  suggested_status: SuggestedStatus;
}

/** Umbrales configurables (Fase 4: constantes; futuro: Admin). */
export const UMBRAL_PREVALIDADO = 80;
export const UMBRAL_ADVERTENCIA = 60;

/**
 * Calcula el score compuesto y el estado sugerido. FUNCIÓN PURA (sin DB).
 *
 * Pesos (suman 100):
 *  - confianza IA: 25
 *  - cliente: 15
 *  - identidad/RTN: 20
 *  - tipo documental: 15
 *  - número judicial: 10
 *  - materia: 5
 *  - juzgado: 10
 *
 * Penalizaciones: contradicción crítica → score bajo + fuerza abogado.
 */
export function calcularScoreYEstado(input: ScoreInput): ScoreResult {
  const checks: ValidationCheck[] = [];

  // Confianza IA (25)
  const iaScore = Math.max(0, Math.min(100, input.iaConfidence));
  checks.push({
    check_name: 'confianza_ia',
    status: iaScore >= UMBRAL_PREVALIDADO ? 'pass' : iaScore >= UMBRAL_ADVERTENCIA ? 'warn' : 'fail',
    score: iaScore,
    reason: `Confianza de extracción IA: ${iaScore}%`,
  });

  // Cliente (15)
  const clienteScore = input.clienteCoincide === null ? 50 : input.clienteCoincide ? 100 : 0;
  checks.push({
    check_name: 'coincidencia_cliente',
    status: input.clienteCoincide === null ? 'unknown' : input.clienteCoincide ? 'pass' : 'fail',
    score: clienteScore,
    reason: input.clienteCoincide === null ? 'Cliente no verificable (sin dato esperado)' : input.clienteCoincide ? 'Cliente coincide' : 'Cliente NO coincide',
  });

  // Identidad/RTN (20)
  const identidadScore = input.identidadCoincide === null ? 50 : input.identidadCoincide ? 100 : 0;
  checks.push({
    check_name: 'coincidencia_identidad',
    status: input.identidadCoincide === null ? 'unknown' : input.identidadCoincide ? 'pass' : 'fail',
    score: identidadScore,
    reason: input.identidadCoincide === null ? 'Identidad/RTN no verificable' : input.identidadCoincide ? 'Identidad/RTN coincide' : 'Identidad/RTN NO coincide',
  });

  // Tipo documental (15)
  const tipoScore = input.tipoDocumentalCoincide === null ? 50 : input.tipoDocumentalCoincide ? 100 : 20;
  checks.push({
    check_name: 'coincidencia_tipo_documental',
    status: input.tipoDocumentalCoincide === null ? 'unknown' : input.tipoDocumentalCoincide ? 'pass' : 'warn',
    score: tipoScore,
    reason: input.tipoDocumentalCoincide === null ? 'Tipo documental no contrastable' : input.tipoDocumentalCoincide ? 'Tipo documental coincide con el requisito' : 'Tipo documental dudoso',
  });

  // Número judicial (10)
  const numJudScore = input.numeroJudicialCoincide === null ? 50 : input.numeroJudicialCoincide ? 100 : 0;
  checks.push({
    check_name: 'coincidencia_numero_judicial',
    status: input.numeroJudicialCoincide === null ? 'unknown' : input.numeroJudicialCoincide ? 'pass' : 'fail',
    score: numJudScore,
    reason: input.numeroJudicialCoincide === null ? 'Número judicial no presente en expediente' : input.numeroJudicialCoincide ? 'Número judicial coincide' : 'Número judicial NO coincide',
  });

  // Materia (5)
  const materiaScore = input.materiaCoincide === null ? 50 : input.materiaCoincide ? 100 : 40;
  checks.push({
    check_name: 'coincidencia_materia',
    status: input.materiaCoincide === null ? 'unknown' : input.materiaCoincide ? 'pass' : 'warn',
    score: materiaScore,
    reason: input.materiaCoincide === null ? 'Materia no contrastable' : input.materiaCoincide ? 'Materia coincide' : 'Materia dudosa',
  });

  // Juzgado (10)
  const juzgadoScore = input.juzgadoCoincide === null ? 50 : input.juzgadoCoincide ? 100 : 40;
  checks.push({
    check_name: 'coincidencia_juzgado',
    status: input.juzgadoCoincide === null ? 'unknown' : input.juzgadoCoincide ? 'pass' : 'warn',
    score: juzgadoScore,
    reason: input.juzgadoCoincide === null ? 'Juzgado no contrastable' : input.juzgadoCoincide ? 'Juzgado coincide' : 'Juzgado dudoso',
  });

  // Score ponderado.
  const pesos = [25, 15, 20, 15, 10, 5, 10];
  const valores = [iaScore, clienteScore, identidadScore, tipoScore, numJudScore, materiaScore, juzgadoScore];
  let score = 0;
  for (let i = 0; i < pesos.length; i++) score += (valores[i] * pesos[i]) / 100;
  score = Math.round(Math.max(0, Math.min(100, score)));

  // Contradicciones: penalizan.
  if (input.contradicciones) score = Math.round(score * 0.7);
  checks.push({
    check_name: 'contradicciones',
    status: input.contradiccionCritica ? 'fail' : input.contradicciones ? 'warn' : 'pass',
    score: input.contradicciones ? 30 : 100,
    reason: input.contradiccionCritica ? 'Contradicción crítica detectada' : input.contradicciones ? 'Contradicciones menores detectadas' : 'Sin contradicciones',
  });

  // Determinación del estado sugerido.
  let suggested_status: SuggestedStatus;
  if (input.contradiccionCritica) {
    suggested_status = 'revision_abogado';
  } else if (input.identidadEsperadaAusente) {
    suggested_status = 'revision_asistente';
  } else if (score >= UMBRAL_PREVALIDADO && !input.contradicciones) {
    suggested_status = 'prevalidado';
  } else if (score >= UMBRAL_ADVERTENCIA) {
    suggested_status = 'aceptado_con_advertencia';
  } else if (score >= 40) {
    suggested_status = 'revision_asistente';
  } else {
    suggested_status = 'revision_abogado';
  }

  return { score, checks, suggested_status };
}
