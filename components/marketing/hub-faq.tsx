import type { HubFaqItem } from '@/data/faqs-hubs';
import { ChevronDown } from 'lucide-react';

export function HubFaq({
  faqs,
  url,
  title = 'Preguntas frecuentes',
  eyebrow,
  id = 'faq',
}: {
  faqs: HubFaqItem[];
  url: string;
  title?: string;
  eyebrow?: string;
  id?: string;
}) {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${url}#faqpage`,
    url,
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.pregunta,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.respuesta,
      },
    })),
  };

  return (
    <section id={id} className="py-10 md:py-14" aria-labelledby={`${id}-title`}>
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        {eyebrow && (
          <p className="eyebrow-label text-center">{eyebrow}</p>
        )}
        <h2 id={`${id}-title`} className="mt-2 text-center font-serif text-xl md:text-2xl font-extrabold text-primary leading-tight text-balance">
          {title}
        </h2>
        <div className="mt-6 space-y-2.5">
          {faqs.map((faq, i) => (
            <details
              key={i}
              data-faq-question={faq.pregunta}
              data-faq-page={url}
              className="faq-anim group rounded-lg border border-border-light bg-surface shadow-[0_1px_0_0_rgba(255,255,255,0.60)_inset,0_1px_2px_rgba(15,29,58,0.04),0_4px_12px_rgba(15,29,58,0.05)] open:border-accent/40 open:shadow-[0_1px_0_0_rgba(255,255,255,0.70)_inset,0_2px_4px_rgba(15,29,58,0.05),0_8px_20px_rgba(15,29,58,0.07)]"
            >
              <summary className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3.5 text-sm font-semibold text-text leading-snug hover:text-primary transition-colors">
                <span className="text-pretty">{faq.pregunta}</span>
                <ChevronDown
                  size={16}
                  className="flex-shrink-0 text-text-muted group-open:rotate-180 transition-transform duration-200"
                />
              </summary>
              <div className="faq-body">
                <div className="faq-body-inner">
                  <div className="border-t border-border/40 px-4 pb-4 pt-2.5">
                    <p className="text-sm leading-relaxed text-text-secondary text-pretty">
                      {faq.respuesta}
                    </p>
                  </div>
                </div>
              </div>
            </details>
          ))}
        </div>
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </section>
  );
}
