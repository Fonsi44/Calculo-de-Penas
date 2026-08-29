import { Sparkles, Palette, Zap } from 'lucide-react';
import { Section, SectionHeader } from '@/components/marketing/section';
import { Card } from '@/components/ui/card';

const FEATURES = [
  {
    icon: Sparkles,
    title: 'Temas intercambiables',
    description: 'Cambia la personalidad visual con un preset CSS. Misma estructura, distinto look.',
  },
  {
    icon: Palette,
    title: 'Tokens centralizados',
    description: 'Colores, radios y sombras en un solo lugar. Sin hardcodear hex en componentes.',
  },
  {
    icon: Zap,
    title: 'Sin suscripción Figma',
    description: 'El código es la fuente de verdad. Preview instantáneo con Next.js.',
  },
];

export function FeatureGrid() {
  return (
    <Section variant="default" spacing="md">
      <SectionHeader
        eyebrow="Por qué code-first"
        title="Diseña webs distintas reutilizando bloques"
        subtitle="Hero, secciones, CTA y FAQ ya listos. Solo cambias tema y contenido."
        align="center"
      />
      <div className="grid gap-4 md:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, description }) => (
          <Card key={title} premium>
            <div className="w-11 h-11 rounded-lg bg-accent/15 flex items-center justify-center mb-4">
              <Icon className="w-5 h-5 text-accent-dark" />
            </div>
            <h3 className="font-bold text-primary">{title}</h3>
            <p className="mt-2 text-sm text-text-secondary leading-relaxed">{description}</p>
          </Card>
        ))}
      </div>
    </Section>
  );
}
