import { PageHero } from '@/components/marketing/page-hero';
import { FeatureGrid } from '@/components/marketing/feature-grid';
import { FaqBlock } from '@/components/marketing/faq-block';
import { CtaBlock } from '@/components/marketing/cta-block';
import { site } from '@/lib/site';

const FAQ = [
  {
    question: '¿Necesito Figma para diseñar?',
    answer: 'No. Este starter usa diseño code-first: tokens CSS, componentes reutilizables y preview con Next.js. Penpot es opcional solo para bocetos.',
  },
  {
    question: '¿Cómo cambio el look entre proyectos?',
    answer: 'Cambia `theme` en lib/site.ts a uno de los presets (corporate-navy, modern-minimal, warm-legal, vibrant-startup) y ajusta variables si hace falta.',
  },
  {
    question: '¿Puedo añadir páginas nuevas rápido?',
    answer: 'Sí. Crea app/tu-pagina/page.tsx y compón con PageHero, Section, CtaBlock y FaqBlock existentes.',
  },
];

export default function HomePage() {
  return (
    <>
      <PageHero
        eyebrow={`Tema activo: ${site.theme}`}
        title="Alternativa gratuita a Figma para muchas webs"
        subtitle="Plantilla global code-first con temas intercambiables, bloques marketing y validación Playwright."
        ctaHref="/about"
        ctaLabel="Ver segunda página"
        align="center"
      />
      <FeatureGrid />
      <FaqBlock items={FAQ} eyebrow="FAQ" />
      <CtaBlock />
    </>
  );
}
