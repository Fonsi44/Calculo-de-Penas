/**
 * Router del chat híbrido (sitio vs NotebookLM vs bloqueado).
 *
 * NotebookLM solo se activa con la palabra clave interna «una pregunta:».
 * Todo lo demás va al motor de reglas del sitio.
 */

import { evaluateBlockingGuardrails } from './guardrails';
import { hasLawyerNotebookShortcut } from './lawyer-shortcut';

export type ChatRoute = 'site' | 'legal' | 'blocked';

export interface RouteResult {
  route: ChatRoute;
  /** Solo presente cuando route === 'blocked'. */
  guardrail?: ReturnType<typeof evaluateBlockingGuardrails> & { hit: true };
}

/**
 * Clasifica un mensaje para decidir si va al motor de reglas, NotebookLM o guardrail.
 */
export function routeChatMessage(message: string): RouteResult {
  const blocking = evaluateBlockingGuardrails(message);
  if (blocking.hit) {
    return { route: 'blocked', guardrail: blocking };
  }

  const text = message ?? '';

  if (hasLawyerNotebookShortcut(text)) {
    return { route: 'legal' };
  }

  return { route: 'site' };
}
