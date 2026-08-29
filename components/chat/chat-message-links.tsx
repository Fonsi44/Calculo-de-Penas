'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { ChatLink } from '@/lib/chat/response-meta';

type Props = {
  links: ChatLink[];
};

export function ChatMessageLinks({ links }: Props) {
  if (!links.length) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {links.map((link) => (
        <Link
          key={`${link.href}-${link.label}`}
          href={link.href}
          className="inline-flex items-center gap-1 text-xs font-semibold text-accent-dark hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-lg px-2 py-1 min-h-9"
        >
          {link.label}
          <ArrowRight size={11} aria-hidden="true" />
        </Link>
      ))}
    </div>
  );
}
