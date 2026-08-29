'use client';

import { Zap } from 'lucide-react';
import type { ChatSuggestion } from '@/lib/chat/response-meta';

type Props = {
  suggestions: ChatSuggestion[];
  disabled?: boolean;
  onSelect: (message: string) => void;
};

export function ChatSuggestionChips({ suggestions, disabled, onSelect }: Props) {
  if (!suggestions.length) return null;

  return (
    <div className="flex flex-wrap gap-2 md:gap-1.5 mt-3 pt-2 border-t border-border-light/60">
      {suggestions.map((chip) => {
        const isUrgent =
          chip.label.toLowerCase().includes('urgente') || chip.label.toLowerCase().includes('ahora');
        return (
          <button
            key={chip.id}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(chip.message)}
            className={`text-sm md:text-xs font-medium min-h-10 md:min-h-9 px-3.5 md:px-3 py-2 rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50 ${
              isUrgent
                ? 'border-danger/40 bg-danger/10 text-danger hover:bg-danger/15'
                : 'border-border bg-surface-alt text-text-secondary hover:border-accent/40 hover:text-accent-dark'
            }`}
          >
            {isUrgent && <Zap size={10} className="inline mr-1" aria-hidden="true" />}
            {chip.label}
          </button>
        );
      })}
    </div>
  );
}
