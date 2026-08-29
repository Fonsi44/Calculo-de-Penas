'use client';

import { MessageCircle } from 'lucide-react';
import { whatsappHref } from '@/lib/site';

type Props = {
  text: string;
  onOpenWhatsApp?: () => void;
};

/** Abre WhatsApp con el borrador prellenado. */
export function ChatCopyWhatsappButton({ text, onOpenWhatsApp }: Props) {
  const draft = text.trim();
  if (!draft) return null;

  return (
    <a
      href={whatsappHref(draft)}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onOpenWhatsApp}
      className="mt-3 inline-flex items-center gap-1.5 min-h-10 px-3 py-1.5 rounded-lg text-xs font-semibold bg-success text-white hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      <MessageCircle size={14} aria-hidden="true" />
      <span>Enviar por WhatsApp</span>
    </a>
  );
}
