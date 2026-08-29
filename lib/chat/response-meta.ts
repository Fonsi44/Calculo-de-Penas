/**
 * Metadatos estructurados en respuestas del chat público.
 */

export type ChatSuggestion = {
  id: string;
  label: string;
  /** Texto enviado al motor si el usuario pulsa el chip. */
  message: string;
};

export type ChatLink = {
  label: string;
  href: string;
};

export type ChatHistoryTurn = {
  role: 'user' | 'assistant';
  content: string;
};
