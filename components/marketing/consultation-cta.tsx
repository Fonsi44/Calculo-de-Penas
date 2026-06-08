import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Section, Container } from '@/components/marketing/section';

export function ConsultationCTA() {
  return (
    <Section background="muted" spacing="md">
      <Container size="md" className="text-center">
        <p className="text-xs font-bold uppercase tracking-eyebrow text-accent-dark mb-2">
          ¿Necesita orientación legal?
        </p>
        <h2 className="font-serif font-bold text-2xl md:text-3xl text-primary leading-tight mb-3">
          ¿No encuentra lo que busca?
        </h2>
        <p className="text-sm md:text-base text-text-secondary max-w-lg mx-auto leading-relaxed mb-6">
          Cada caso es único. Si su situación no encaja exactamente en una de las áreas
          descritas, consúltenos sin compromiso. Analizaremos su caso y le orientaremos
          sobre la vía legal más adecuada.
        </p>
        <Link
          href="/solicitar-consulta"
          className="btn-shimmer inline-flex items-center gap-2 h-12 px-6 rounded-lg bg-primary text-white text-base font-bold hover:bg-primary-light transition-colors"
        >
          Solicitar consulta confidencial <ArrowRight size={18} />
        </Link>
      </Container>
    </Section>
  );
}
