'use client';

import { Zap, RotateCcw } from 'lucide-react';
import type { ChatSuggestion } from '@/lib/chat/response-meta';

type Props = {
  suggestions: ChatSuggestion[];
  disabled?: boolean;
  whatsappDraft?: string;
  canRetryLegal?: boolean;
  onSelect: (message: string) => void;
  onOpenWhatsApp?: (draft: string) => void;
  onRetryLegal?: () => void;
};

export function ChatSuggestionChips({
  suggestions,
  disabled,
  whatsappDraft,
  canRetryLegal = false,
  onSelect,
  onOpenWhatsApp,
  onRetryLegal,
}: Props) {
  if (!suggestions.length) return null;

  return (
    <div className="flex flex-wrap gap-2 md:gap-1.5 mt-3 pt-2 border-t border-border-light/60">
      {suggestions.map((chip) => {
        const isUrgent =
          chip.label.toLowerCase().includes('urgente') || chip.label.toLowerCase().includes('ahora');
        const isWhatsApp = chip.action === 'whatsapp';
        const isRetry = chip.action === 'retry_legal';

        return (
          <button
            key={chip.id}
            type="button"
            disabled={
              (disabled && !isRetry) ||
              (isWhatsApp && !whatsappDraft?.trim()) ||
              (isRetry && !canRetryLegal)
            }
            onClick={() => {
              if (isRetry) {
                onRetryLegal?.();
                return;
              }
              if (isWhatsApp) {
                const draft = whatsappDraft?.trim();
                if (draft) onOpenWhatsApp?.(draft);
                return;
              }
              if (chip.message.trim()) onSelect(chip.message);
            }}
            className={`text-sm md:text-xs font-medium min-h-10 md:min-h-9 px-3.5 md:px-3 py-2 rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50 ${
              isRetry
                ? 'border-accent/40 bg-accent/10 text-accent-dark hover:bg-accent/15'
                : isWhatsApp
                  ? 'border-success/40 bg-success/10 text-success hover:bg-success/15'
                  : isUrgent
                    ? 'border-danger/40 bg-danger/10 text-danger hover:bg-danger/15'
                    : 'border-border bg-surface-alt text-text-secondary hover:border-accent/40 hover:text-accent-dark'
            }`}
          >
            {isRetry && <RotateCcw size={10} className="inline mr-1" aria-hidden="true" />}
            {isUrgent && !isRetry && <Zap size={10} className="inline mr-1" aria-hidden="true" />}
            {chip.label}
          </button>
        );
      })}
    </div>
  );
}
