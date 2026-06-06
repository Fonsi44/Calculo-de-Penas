/**
 * Tarjeta premium de servicio jurídico.
 * - Imagen superior (PlaceholderPhoto con tono semántico).
 * - Borde dorado en hover, elevación y sombra premium.
 * - Sin rojo: CTAs en navy primario + acento dorado.
 */

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { getIcon, getAreaTone } from '@/lib/icon-map';
import { PlaceholderPhoto } from './placeholder-photo';
import type { PremiumService } from '@/lib/data/service-catalog';

interface PremiumServiceCardProps {
  service: PremiumService;
  href: string;
}

export function PremiumServiceCard({ service, href }: PremiumServiceCardProps) {
  const Icon = getIcon(service.icono);
  return (
    <Link
      href={href}
      className="card-premium group block overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-premium focus-visible:outline-none"
    >
      <PlaceholderPhoto
        tone={getAreaTone(service.slug)}
        aspect="16/9"
        rounded="none"
        label={service.titulo}
        className="w-full"
      />
      <div className="p-5">
        <div className="mb-3 flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
            {/* eslint-disable-next-line react-hooks/static-components -- dynamic icon by name */}
            <Icon size={16} aria-hidden="true" />
          </div>
          <h3 className="text-base font-bold text-text leading-tight">{service.titulo}</h3>
        </div>
        <p className="text-[13px] text-text-secondary leading-relaxed text-pretty">
          {service.resumen}
        </p>
        {service.destacado && (
          <p className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-accent-dark">
            {service.destacado}
          </p>
        )}
        <div className="mt-4 flex items-center gap-1.5 text-[12px] font-bold text-primary group-hover:text-accent-dark transition-colors">
          Ver detalle
          <ArrowRight size={14} aria-hidden="true" className="transition-transform group-hover:translate-x-0.5" />
        </div>
      </div>
    </Link>
  );
}
