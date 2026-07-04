/**
 * Componente reutilizable para renderizar un bloque FAQ en un hub comercial.
 *
 * Usa `<details>/<summary>` nativos (accesibles por teclado, sin JS) y emite el
 * JSON-LD `FAQPage` para rich results. Reutiliza el patrón visual de la home
 * (animación grid-rows + chevron decorativo) sin introducir nuevo design.
 *
 * El parámetro `faqs` proviene de `data/faqs-hubs.ts` (contenido editorial).
 * El parámetro `url` debe ser la URL absoluta canónica de la página.
 */
import type { HubFaqItem } from '@/data/faqs-hubs';

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
    <section id={id} className="py-12 md:py-16" aria-labelledby={`${id}-title`}>
      <div className="mx-auto max-w-3xl px-4">
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-dark text-center">
            {eyebrow}
          </p>
        )}
        <h2 id={`${id}-title`} className="mt-2 text-center font-serif text-2xl md:text-3xl text-primary">
          {title}
        </h2>
        <div className="mt-8 space-y-3">
          {faqs.map((faq, i) => (
            <details
              key={i}
              className="group rounded-lg border border-border bg-surface px-4 py-3 [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex cursor-pointer items-center justify-between gap-3 text-sm font-semibold text-text-secondary hover:text-primary transition-colors">
                <span>{faq.pregunta}</span>
                <span
                  aria-hidden="true"
                  className="flex-shrink-0 text-accent-dark transition-transform group-open:rotate-90"
                >
                  ›
                </span>
              </summary>
              <p className="mt-2 text-sm leading-relaxed text-text-secondary">{faq.respuesta}</p>
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
