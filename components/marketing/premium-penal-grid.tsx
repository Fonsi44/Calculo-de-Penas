/**
 * Grid premium de 3 columnas para los 7 grupos del hub de Derecho Penal.
 */

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { getIcon, getAreaTone } from '@/lib/icon-map';
import { PlaceholderPhoto } from './placeholder-photo';
import { premiumPenalGrupos } from '@/lib/data/penal-catalog';

export function PremiumPenalGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {premiumPenalGrupos.map((g) => {
        const Icon = getIcon(g.icono);
        return (
          <Link
            key={g.slug}
            href={`/derecho-penal/${g.slug}`}
            className="card-premium group block overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-premium focus-visible:outline-none"
          >
            <PlaceholderPhoto
              tone={getAreaTone(g.slug)}
              aspect="16/9"
              rounded="none"
              label={g.titulo}
              className="w-full"
            />
            <div className="p-5">
              <div className="mb-3 flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Icon size={16} aria-hidden="true" />
                </div>
                <h3 className="text-base font-bold text-text leading-tight">{g.titulo}</h3>
              </div>
              <p className="text-[13px] text-text-secondary leading-relaxed text-pretty">
                {g.resumen}
              </p>
              <div className="mt-4 flex items-center gap-1.5 text-[12px] font-bold text-primary group-hover:text-accent-dark transition-colors">
                Ver grupo especializado
                <ArrowRight size={14} aria-hidden="true" className="transition-transform group-hover:translate-x-0.5" />
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
