/**
 * Palabra clave interna para abogados: solo mensajes que empiezan por
 * «una pregunta:» enrutan a NotebookLM.
 *
 * No se documenta en la UI pública.
 */

/** Prefijo obligatorio al inicio del mensaje (insensible a mayúsculas). */
const LAWYER_NLM_SHORTCUT = /^\s*una\s+pregunta\s*:\s*/i;

export function hasLawyerNotebookShortcut(message: string): boolean {
  return LAWYER_NLM_SHORTCUT.test(message ?? '');
}

/** Quita el prefijo y deja solo la consulta jurídica para NotebookLM. */
export function stripLawyerNotebookShortcut(message: string): string {
  return (message ?? '').replace(LAWYER_NLM_SHORTCUT, '').trim();
}
