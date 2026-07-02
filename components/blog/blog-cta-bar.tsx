'use client';

import Link from 'next/link';
import { Phone, MessageCircle, ArrowRight } from 'lucide-react';
import { site, telHref, whatsappHref } from '@/lib/site';
import { trackWhatsAppClick, trackPhoneClick, trackFormClick } from '@/lib/analytics';

const CATEGORY_COPY: Record<string, { h2: string; body: string; whatsappMsg: string }> = {
  'derecho-penal': {
    h2: '¿Enfrenta un proceso penal en la zona sur?',
    body: 'Las decisiones tempranas definen el resultado. Hable con un abogado penalista en Nacaome, Valle. Defensa desde la detención hasta la audiencia.',
    whatsappMsg: 'Necesito defensa penal urgente. Vi su artículo en el blog.',
  },
  'derecho-de-familia': {
    h2: '¿Necesita resolver un asunto de familia?',
    body: 'Divorcio, custodia, pensión alimenticia. Un abogado de familia en Nacaome puede orientarle con discreción y eficacia.',
    whatsappMsg: 'Necesito orientación en un asunto de familia. Vi su artículo en el blog.',
  },
  'derecho-laboral': {
    h2: '¿Tuvo un problema laboral?',
    body: 'Despido injustificado, prestaciones impagas, acoso laboral. Un abogado laboralista en Nacaome puede ayudarle a reclamar lo que le corresponde.',
    whatsappMsg: 'Necesito un abogado laboralista. Vi su artículo en el blog.',
  },
  'derecho-civil': {
    h2: '¿Necesita seguridad jurídica en sus trámites?',
    body: 'Contratos, compraventas, herencias o poderes notariales. Un abogado civil en Nacaome le garantiza documentos seguros y válidos.',
    whatsappMsg: 'Necesito un abogado civil para contratos o herencias. Vi su artículo en el blog.',
  },
  'proceso-penal': {
    h2: '¿Enfrenta un proceso penal en la zona sur?',
    body: 'Cada etapa del proceso penal requiere defensa técnica. Hable hoy con un abogado penalista en Nacaome.',
    whatsappMsg: 'Necesito defensa penal urgente. Vi su artículo en el blog.',
  },
  'derecho-mercantil': {
    h2: '¿Necesita asesoría para su empresa?',
    body: 'Constitución de sociedades, contratos mercantiles, cobro de cartera. Un abogado mercantil en Nacaome puede asistirle.',
    whatsappMsg: 'Necesito asesoría mercantil para mi empresa. Vi su artículo en el blog.',
  },
  'derecho-notarial': {
    h2: '¿Necesita un trámite notarial?',
    body: 'Poderes, escrituras, actas notariales. Un abogado notarial en Nacaome le da fe pública a sus documentos.',
    whatsappMsg: 'Necesito un poder notarial o escritura. Vi su artículo en el blog.',
  },
  'tributario': {
    h2: '¿Tiene un problema con el SAR?',
    body: 'Fiscalizaciones, multas, devoluciones de impuestos. Un abogado tributario en la zona sur puede defenderle.',
    whatsappMsg: 'Necesito defensa tributaria. Vi su artículo en el blog.',
  },
  'hondurenos-en-espana': {
    h2: '¿Está en España y necesita trámites en Honduras?',
    body: 'Poderes, documentos, trámites notariales y familiares desde el extranjero. Le asistimos sin que tenga que viajar.',
    whatsappMsg: 'Estoy en España y necesito hacer trámites en Honduras. Vi su artículo.',
  },
};

interface BlogCtaBarProps {
  category?: string;
}

export function BlogCtaBar({ category }: BlogCtaBarProps) {
  const copy = category ? CATEGORY_COPY[category] : null;

  return (
    <div className="text-center">
      <p className="text-xs font-bold uppercase tracking-widest text-accent-dark mb-2">
        Consulta confidencial en Nacaome
      </p>
      <h2 className="font-serif font-extrabold text-2xl md:text-3xl text-text mb-4">
        {copy?.h2 ?? '¿Necesita asesoría legal en la zona sur?'}
      </h2>
      <p className="text-text-secondary mb-6 max-w-lg mx-auto leading-relaxed">
        {copy?.body ?? 'Hable directamente con un abogado en Nacaome, Valle, Choluteca o San Lorenzo. Podemos revisar su situación y orientarle sobre los siguientes pasos.'}
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
        <a
          href={telHref()}
          onClick={() => trackPhoneClick('blog_cta')}
          className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary-light transition-colors"
        >
          <Phone size={18} />
          {site.phoneDisplay}
        </a>
        <a
          href={whatsappHref(copy?.whatsappMsg ?? undefined)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackWhatsAppClick('blog_cta')}
          className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-lg bg-success text-white text-sm font-bold hover:opacity-90 transition-opacity"
        >
          <MessageCircle size={18} />
          WhatsApp
        </a>
      </div>
      <Link
        href="/solicitar-consulta#formulario"
        onClick={() => trackFormClick('blog_cta')}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-accent-dark transition-colors"
      >
        O complete el formulario de consulta <ArrowRight size={14} />
      </Link>
    </div>
  );
}
