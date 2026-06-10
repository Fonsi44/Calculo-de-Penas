'use client';

import Link from 'next/link';
import { Mail } from 'lucide-react';
import { Section, Container } from '@/components/marketing/section';

export function NewsletterSection() {
  return (
    <Section spacing="md" background="muted">
      <Container size="md">
        <div className="text-center max-w-xl mx-auto">
          <div className="w-14 h-14 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-5">
            <Mail size={24} className="text-accent-dark" />
          </div>
          <h2 className="font-serif font-extrabold text-2xl md:text-3xl text-text mb-3">
            Reciba nuestros artículos
          </h2>
          <p className="text-text-secondary mb-6 leading-relaxed">
            Información jurídica práctica y actualizada, directamente en su bandeja de entrada. Sin spam, solo contenido útil.
          </p>
          <form
            className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
            onSubmit={(e) => e.preventDefault()}
          >
            <input
              type="email"
              placeholder="Su dirección de correo electrónico"
              className="flex-1 h-12 px-4 rounded-lg border border-border/40 bg-background text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20"
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary-light transition-colors flex-shrink-0"
            >
              <Mail size={16} />
              Suscribirse
            </button>
          </form>
          <p className="text-xs text-text-muted mt-4">
            ¿Prefiere contacto directo?{' '}
            <Link href="/solicitar-consulta" className="text-primary hover:text-accent-dark font-semibold transition-colors">
              Solicite una consulta gratuita →
            </Link>
          </p>
        </div>
      </Container>
    </Section>
  );
}
