'use client';

import Link from 'next/link';
import { Phone, MessageCircle, ArrowRight } from 'lucide-react';
import { site, telHref, whatsappHref } from '@/lib/site';
import { trackWhatsAppClick, trackPhoneClick, trackFormClick } from '@/lib/analytics';

export function BlogCtaBar() {
  return (
    <div className="text-center">
      <p className="text-xs font-bold uppercase tracking-widest text-accent-dark mb-2">
        Consulta confidencial en Nacaome
      </p>
      <h2 className="font-serif font-extrabold text-2xl md:text-3xl text-text mb-4">
        ¿Necesita asesoría legal en la zona sur?
      </h2>
      <p className="text-text-secondary mb-6 max-w-lg mx-auto leading-relaxed">
        Hable directamente con un abogado en Nacaome, Valle, Choluteca o San Lorenzo. Podemos revisar su situación y orientarle sobre los siguientes pasos.
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
          href={whatsappHref()}
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
        href="/solicitar-consulta"
        onClick={() => trackFormClick('blog_cta')}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-accent-dark transition-colors"
      >
        O complete el formulario de consulta <ArrowRight size={14} />
      </Link>
    </div>
  );
}
