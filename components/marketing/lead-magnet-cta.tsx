'use client';

import { useState, type FormEvent } from 'react';
import { FileDown, Loader2, CheckCircle2, Mail } from 'lucide-react';

interface LeadMagnetCTAProps {
  area: string;
  titulo: string;
  descripcion: string;
}

export function LeadMagnetCTA({ area, titulo, descripcion }: LeadMagnetCTAProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || status === 'loading') return;
    setStatus('loading');

    const url = `/api/descargar?area=${encodeURIComponent(area)}&email=${encodeURIComponent(email.trim())}`;

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Error al generar el PDF');
      const blob = await res.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `guia-${area}.pdf`;
      a.click();
      URL.revokeObjectURL(downloadUrl);
      setStatus('success');
      setEmail('');
    } catch {
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="mt-8 p-6 rounded-xl bg-success/5 border border-success/20 text-center">
        <CheckCircle2 size={24} className="text-success mx-auto mb-2" />
        <p className="font-bold text-sm text-text">Guía descargada correctamente</p>
        <p className="text-xs text-text-secondary mt-1">Revise su bandeja de entrada. Si necesita asesoría personalizada, solicite una consulta gratuita.</p>
      </div>
    );
  }

  return (
    <div className="mt-4 p-4 sm:p-5 rounded-xl bg-accent/5 border border-accent/20">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
          <FileDown size={18} className="text-accent-dark" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-sm text-primary leading-snug">{titulo}</p>
          <p className="text-xs text-text-secondary mt-1 leading-relaxed">{descripcion}</p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 mt-3">
        <label htmlFor="lead-magnet-email" className="sr-only">Correo electrónico para recibir la guía</label>
        <input
          id="lead-magnet-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Su correo electrónico"
          required
          className="flex-1 h-10 px-3 rounded-lg border border-border/40 bg-background text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-accent/60"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary-light transition-colors flex-shrink-0 disabled:opacity-60"
        >
          {status === 'loading' ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />}
          Descargar guía gratuita
        </button>
      </form>
      {status === 'error' && (
        <p className="text-xs text-aggravation mt-2">Error al generar la guía. Intente de nuevo.</p>
      )}
      <p className="text-xxs text-text-muted mt-2">
        <Mail size={10} className="inline mr-1" />
        Recibirá la guía en PDF. No compartimos su correo. Consulte nuestra{' '}
        <a href="/politica-privacidad" className="underline hover:text-primary">política de privacidad</a>.
      </p>
    </div>
  );
}
