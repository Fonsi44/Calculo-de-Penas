import { PageHero } from '@/components/marketing/page-hero';
import { Section, SectionHeader } from '@/components/marketing/section';
import { Card } from '@/components/ui/card';
import { CtaBlock } from '@/components/marketing/cta-block';

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="Segunda página de ejemplo"
        title="Nosotros"
        subtitle="Esta página demuestra el flujo: mismo starter, distinto contenido, mismos bloques."
        variant="muted"
        align="center"
      />
      <Section variant="default" spacing="md">
        <SectionHeader
          eyebrow="Workflow"
          title="De plantilla a web en minutos"
          subtitle="Copia web-starter, elige tema, edita lib/site.ts y compón páginas."
        />
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <h3 className="font-bold text-primary">1. Clonar starter</h3>
            <p className="mt-2 text-sm text-text-secondary">Copia la carpeta web-starter a tu nuevo proyecto.</p>
          </Card>
          <Card>
            <h3 className="font-bold text-primary">2. Elegir tema</h3>
            <p className="mt-2 text-sm text-text-secondary">Cambia theme en lib/site.ts entre los 4 presets.</p>
          </Card>
          <Card>
            <h3 className="font-bold text-primary">3. Componer páginas</h3>
            <p className="mt-2 text-sm text-text-secondary">Usa Hero, Section, CTA y FAQ sin rediseñar desde cero.</p>
          </Card>
          <Card>
            <h3 className="font-bold text-primary">4. Validar</h3>
            <p className="mt-2 text-sm text-text-secondary">npm run validate:all y npm run test:e2e para smoke visual.</p>
          </Card>
        </div>
      </Section>
      <CtaBlock variant="inline" title="¿Siguiente paso?" subtitle="Duplica este starter y lanza tu primera web sin pagar Figma." />
    </>
  );
}
