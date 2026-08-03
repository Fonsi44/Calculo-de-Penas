'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { Mail, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Section, Container } from '@/components/marketing/section';

export function NewsletterSection() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || status === 'loading') return;

    setStatus('loading');
    setMessage('');

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setStatus('success');
        setMessage('Suscrito correctamente. Recibirá nuestros artículos en su correo.');
        setEmail('');
      } else {
        setStatus('error');
        setMessage(data.error || 'No se pudo completar la suscripción. Intente de nuevo.');
      }
    } catch {
      setStatus('error');
      setMessage('Error de conexión. Verifique su internet e intente de nuevo.');
    }
  };

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

          {status === 'success' ? (
            <div className="flex items-center justify-center gap-2 p-4 rounded-lg bg-success/10 border border-success/20 text-success text-sm font-semibold mb-4">
              <CheckCircle2 size={18} />
              {message}
            </div>
          ) : (
            <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto" onSubmit={handleSubmit}>
              <label htmlFor="newsletter-email" className="sr-only">Dirección de correo electrónico para suscripción</label>
              <input
                id="newsletter-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Su dirección de correo electrónico"
                required
                className="flex-1 h-12 px-4 rounded-lg border border-border/40 bg-background text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20"
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary-light transition-colors flex-shrink-0 disabled:opacity-60"
              >
                {status === 'loading' ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Mail size={16} />
                )}
                Suscribirse
              </button>
            </form>
          )}

          {status === 'error' && (
            <div className="flex items-center justify-center gap-2 mt-3 text-sm text-aggravation">
              <AlertCircle size={16} />
              {message}
            </div>
          )}

          {status === 'success' && (
            <button
              onClick={() => setStatus('idle')}
              className="mt-3 text-sm text-primary hover:text-accent-dark font-semibold transition-colors"
            >
              Suscribir otro correo
            </button>
          )}

          <p className="text-xs text-text-muted mt-4">
            ¿Prefiere contacto directo?{' '}
            <Link href="/solicitar-consulta#formulario" className="text-primary hover:text-accent-dark font-semibold transition-colors">
              Solicite una evaluación inicial confidencial →
            </Link>
          </p>
        </div>
      </Container>
    </Section>
  );
}
