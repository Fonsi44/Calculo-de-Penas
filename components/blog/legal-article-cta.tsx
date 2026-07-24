'use client';

import { trackEvent } from '@/lib/analytics';

export type LegalArticleCtaProps = {
  area: string;
  sourceSlug: string;
  position: 'inline' | 'end';
  title?: string;
  description?: string;
};

const AREA_ROUTES: Record<string, string> = {
  'derecho-de-familia': '/servicios-juridicos/derecho-de-familia',
  'derecho-civil': '/servicios-juridicos/derecho-civil-y-notarial',
  'derecho-notarial': '/servicios-juridicos/derecho-civil-y-notarial',
  'derecho-penal': '/derecho-penal',
  'derecho-laboral': '/servicios-juridicos/derecho-laboral',
  'extranjeria-migracion': '/servicios-juridicos/extranjeria-y-migracion',
  'general': '/solicitar-consulta',
};

const AREA_DEFAULTS: Record<string, { title: string; description: string }> = {
  'derecho-de-familia': {
    title: '¿Necesita orientación sobre su caso de derecho de familia?',
    description: 'Una consulta temprana puede aclarar sus opciones y proteger sus derechos. Atendemos casos de pensión, custodia, divorcio y más.',
  },
  'derecho-civil': {
    title: '¿Requiere asesoría en materia civil o notarial?',
    description: 'Prescripción de deudas, daños, contratos y poderes. Podemos revisar su caso y orientarle sobre los pasos a seguir.',
  },
  'extranjeria-migracion': {
    title: '¿Necesita información sobre trámites migratorios?',
    description: 'Visas, residencia, naturalización y documentos para hondureños en el exterior. Consulte su situación sin compromiso.',
  },
  'general': {
    title: 'Consulte su caso con un abogado',
    description: 'Describa brevemente su situación y le orientaremos sobre las opciones legales disponibles.',
  },
};

export function LegalArticleCta({ area, sourceSlug, position, title, description }: LegalArticleCtaProps) {
  const defaults = AREA_DEFAULTS[area] || AREA_DEFAULTS['general'];
  const ctaTitle = title || defaults.title;
  const ctaDescription = description || defaults.description;
  const href = AREA_ROUTES[area] || AREA_ROUTES['general'];

  function handleClick() {
    trackEvent('seo_blog_cta_click', {
      cta_location: position,
      cta_type: area,
      source_path: `/blog/${sourceSlug}`,
      destination_path: href,
    });
  }

  const className = position === 'inline'
    ? 'my-7 rounded-lg border border-accent/30 bg-surface-alt p-4'
    : 'mt-10 rounded-lg border border-accent/30 bg-surface-alt p-6';

  return (
    <aside className={className}>
      <p className="text-xxs font-bold uppercase tracking-wider text-accent-dark mb-1">Consulta legal</p>
      <p className="text-sm font-semibold text-text mb-1">{ctaTitle}</p>
      <p className="text-sm text-text-secondary leading-relaxed mb-3">{ctaDescription}</p>
      <div className="flex flex-wrap gap-3">
        <a
          href={`${href}#formulario`}
          data-event-name="seo_blog_cta_click"
          onClick={handleClick}
          className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 text-sm font-medium"
        >
          Solicitar consulta
        </a>
        <a
          href="tel:+50495363724"
          onClick={() => trackEvent('phone_click', { value: 1, source_path: `/blog/${sourceSlug}` })}
          className="inline-flex items-center justify-center rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-text hover:bg-surface-alt"
        >
          Llamar ahora
        </a>
      </div>
    </aside>
  );
}
