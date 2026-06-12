import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Section, Container } from '@/components/marketing/section';

export function ConsultationCTA() {
  return (
    <Section background="muted" spacing="md">
      <Container size="md" className="text-center">
        <p className="text-xs font-bold uppercase tracking-eyebrow text-accent-dark mb-2">
          Consulta confidencial sin costo en Nacaome, Valle
        </p>
        <h2 className="font-serif font-bold text-2xl md:text-3xl text-primary leading-tight mb-3">
          Cada caso es único. Cuéntenos el suyo y le orientamos sin compromiso.
        </h2>
        <p className="text-sm md:text-base text-text-secondary max-w-lg mx-auto leading-relaxed mb-6">
          Evaluamos su situación con rigor técnico y le explicamos con claridad las opciones
          legales disponibles. Atendemos en Nacaome, San Lorenzo, Choluteca y toda la zona sur
          de Honduras. Sin letra pequeña, sin sorpresas. Presupuesto por escrito antes
          de cualquier actuación.
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
