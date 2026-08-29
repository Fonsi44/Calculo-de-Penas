import { ChevronDown } from 'lucide-react';

export interface FaqItem {
  question: string;
  answer: string;
}

interface FaqBlockProps {
  items: FaqItem[];
  title?: string;
  eyebrow?: string;
}

export function FaqBlock({ items, title = 'Preguntas frecuentes', eyebrow }: FaqBlockProps) {
  return (
    <section className="py-8 md:py-12" aria-labelledby="faq-title">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        {eyebrow && <p className="text-xs font-bold uppercase tracking-widest text-center text-accent-dark">{eyebrow}</p>}
        <h2 id="faq-title" className="mt-2 text-center font-serif text-xl md:text-2xl font-bold text-primary">
          {title}
        </h2>
        <div className="mt-5 space-y-2">
          {items.map((item) => (
            <details
              key={item.question}
              className="group rounded-lg border border-border-light bg-surface shadow-sm open:border-accent/40"
            >
              <summary className="flex cursor-pointer items-center justify-between gap-2 px-4 py-3 text-sm font-semibold text-text hover:text-primary">
                <span>{item.question}</span>
                <ChevronDown size={15} className="text-text-muted group-open:rotate-180 transition-transform duration-200" />
              </summary>
              <div className="border-t border-border/40 px-4 pb-4 pt-2 text-sm text-text-secondary leading-relaxed">
                {item.answer}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
