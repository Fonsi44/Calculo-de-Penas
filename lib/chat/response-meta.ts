/**
 * Metadatos estructurados en respuestas del chat público.
 */

export type ChatSuggestionAction = 'whatsapp' | 'retry_legal';

export type ChatSuggestion = {
  id: string;
  label: string;
  /** Texto enviado al motor si el usuario pulsa el chip (vacío si action está definida). */
  message: string;
  /** Acción especial en lugar de enviar texto al chat. */
  action?: ChatSuggestionAction;
};

export type ChatLink = {
  label: string;
  href: string;
};

export type ChatHistoryTurn = {
  role: 'user' | 'assistant';
  content: string;
};
