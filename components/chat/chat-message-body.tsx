'use client';

import { formatNlmReplyToHtml, sanitizeNlmHtml } from '@/lib/chat/format-nlm-reply';

type Props = {
  content: string;
  source?: string;
};

const NLM_BODY_CLASS =
  'chat-nlm-body space-y-3 text-base leading-[1.65] sm:text-[15px] sm:leading-relaxed md:text-sm [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:font-serif [&_h3]:text-primary [&_h3]:mt-4 [&_h3]:mb-1.5 sm:[&_h3]:text-base [&_h4]:text-base [&_h4]:font-semibold [&_h4]:mt-3 sm:[&_h4]:text-[15px] [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-2 [&_li]:leading-relaxed [&_p]:my-2 [&_strong]:font-semibold [&_strong]:text-text';

/** Renderiza texto plano o guía estructurada NotebookLM (markdown ligero). */
export function ChatMessageBody({ content, source }: Props) {
  if (source === 'notebooklm') {
    const html = sanitizeNlmHtml(formatNlmReplyToHtml(content));
    return (
      <div
        className={NLM_BODY_CLASS}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }
  return <span className="whitespace-pre-wrap text-base leading-[1.65] sm:text-[15px] sm:leading-relaxed md:text-sm">{content}</span>;
}
