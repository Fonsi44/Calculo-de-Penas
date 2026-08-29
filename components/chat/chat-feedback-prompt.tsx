'use client';

type Props = {
  onFeedback: (helpful: boolean) => void;
  onDismiss: () => void;
};

export function ChatFeedbackPrompt({ onFeedback, onDismiss }: Props) {
  return (
    <div className="mx-4 mb-2 rounded-lg border border-border-light bg-surface-alt px-3 py-2.5 text-xs text-text shadow-sm">
      <p className="font-medium text-text mb-2">¿Le fue útil esta conversación?</p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onFeedback(true)}
          className="min-h-9 px-3 py-1.5 rounded-lg bg-primary text-text-inverse text-xs font-semibold hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          Sí, gracias
        </button>
        <button
          type="button"
          onClick={() => onFeedback(false)}
          className="min-h-9 px-3 py-1.5 rounded-lg border border-border bg-surface text-xs font-semibold text-text-secondary hover:border-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          Podría mejorar
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="min-h-9 px-2 py-1.5 text-xs text-text-muted hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-lg"
        >
          Omitir
        </button>
      </div>
    </div>
  );
}
