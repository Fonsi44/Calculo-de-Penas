'use client';

import { TIPOS_CONCURSO } from '@/lib/catalogos';
import { cn } from '@/lib/ui';

interface Props {
  tipoConcurso: string;
  onChange: (tipo: string) => void;
  onOpenArticle: (ref: string | null) => void;
}

export function Paso6Concurso({ tipoConcurso, onChange, onOpenArticle }: Props) {
  return (
    <div>
      <h2 className="font-bold text-base text-text mb-2">Tipo de concurso</h2>
      <p className="text-xs text-text-secondary mb-3">
        Al existir múltiples delitos, seleccione el tipo de concurso aplicable.
      </p>
      <div className="space-y-2">
        {TIPOS_CONCURSO.map(tc => (
          <button
            key={tc.id}
            type="button"
            onClick={() => onChange(tc.id)}
            className={cn(
              'w-full text-left p-3 rounded-md border-2 transition-all focus-visible:outline-none',
              tipoConcurso === tc.id ? 'border-accent bg-accent/10' : 'border-border bg-surface hover:border-accent/50',
            )}
          >
            <p className="font-semibold text-sm text-text">{tc.nombre}</p>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onOpenArticle(tc.articulo || null); }}
              className="text-[11px] text-accent-dark underline hover:text-accent font-semibold text-left"
            >
              {tc.articulo}
            </button>
            <p className="text-[11px] text-text-muted mt-1">{tc.descripcion}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
