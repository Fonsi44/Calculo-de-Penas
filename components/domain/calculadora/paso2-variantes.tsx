'use client';

import type { DelitoConfig } from '@/lib/types';
import { cn } from '@/lib/ui';
import { AlertTriangle, ShieldAlert } from 'lucide-react';

interface Props {
  current: DelitoConfig | undefined;
  onChange: (patch: Partial<DelitoConfig>) => void;
  onNext: () => void;
}

export function Paso2Variantes({ current, onChange, onNext }: Props) {
  const d = current?.delito as Record<string, unknown> | undefined;
  if (!d) return null;

  // Use enriched fields if available, fall back to legacy fields
  const tienePrision = (d.tiene_prision as boolean) ?? ((d.pena_minima_meses as number) > 0 || (d.pena_maxima_meses as number) > 0);
  const tieneMulta = (d.tiene_multa as boolean) ?? ((d.pena_alternativa_min as number) > 0 || (d.pena_alternativa_max as number) > 0);
  const tipoPena = d.tipo_pena_principal as string | undefined;
  const requiereRevision = (d.requiere_revision_humana as boolean) ?? false;

  // Bloquear si requiere revisión
  if (requiereRevision) {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-4 bg-danger-bg border border-danger/30 rounded-lg">
          <AlertTriangle size={20} className="text-danger shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-sm text-danger mb-1">Revisión jurídica requerida</p>
            <p className="text-xs text-text-secondary">
              Este delito está marcado como &ldquo;requiere revisión humana&rdquo;. No es posible calcular la pena automáticamente sin verificar los metadatos legales.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Sin datos de pena
  if (!tipoPena || (tipoPena === 'sin_pena_directa' || tipoPena === 'otra')) {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-4 bg-warning-bg border border-warning/30 rounded-lg">
          <ShieldAlert size={20} className="text-warning shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-sm text-warning mb-1">Sin pena directa</p>
            <p className="text-xs text-text-secondary">
              Este artículo no establece una pena directa cuantificable. Puede tratarse de una definición legal, regla procesal o disposición general.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const esMultaSolo = tipoPena === 'multa';
  const esPrisOMulta = tipoPena === 'privacion_libertad_o_multa';
  const tipoLabel = tipoPena === 'privacion_libertad' ? 'Prisión'
    : tipoPena === 'Arresto domiciliario' ? 'Arresto domiciliario'
    : tipoPena === 'Prestación de servicios de utilidad pública' ? 'Prestación de servicios'
    : tipoPena === 'Localización permanente' ? 'Localización permanente'
    : tipoPena === 'Disolución de la persona jurídica' ? 'Disolución'
    : tipoPena === 'multa' ? 'Multa'
    : tipoPena;

  // Un solo tipo de pena: avanzar automáticamente
  if ((tienePrision || tipoPena === 'privacion_libertad' || tipoPena === 'Arresto domiciliario' ||
       tipoPena === 'Prestación de servicios de utilidad pública' || tipoPena === 'Localización permanente') && !tieneMulta && !esPrisOMulta) {
    onChange({ pena_seleccionada: 'prision' });
    onNext();
    return null;
  }

  if (esMultaSolo && !tienePrision) {
    onChange({ pena_seleccionada: 'multa' });
    onNext();
    return null;
  }

  // Mutuamente excluyentes: Prisión O Multa
  return (
    <div>
      <h2 className="font-bold text-base text-text mb-2">Tipo de pena</h2>
      <p className="text-xs text-text-secondary mb-3">
        Este delito admite {tipoLabel} o multa de forma alternativa. Seleccione el tipo de pena a calcular.
      </p>
      <div className="space-y-2">
        <button type="button"
          onClick={() => { onChange({ pena_seleccionada: 'prision' }); onNext(); }}
          className={cn(
            'w-full text-left p-3 rounded-md border-2 transition-all focus-visible:outline-none',
            current?.pena_seleccionada === 'prision'
              ? 'border-accent bg-accent/10'
              : 'border-border bg-surface hover:border-accent/50',
          )}>
          <p className="font-semibold text-sm text-text">{tipoLabel}</p>
          <p className="text-xs text-text-muted">Pena principal del delito</p>
        </button>
        <button type="button"
          onClick={() => { onChange({ pena_seleccionada: 'multa' }); onNext(); }}
          className={cn(
            'w-full text-left p-3 rounded-md border-2 transition-all focus-visible:outline-none',
            current?.pena_seleccionada === 'multa'
              ? 'border-accent bg-accent/10'
              : 'border-border bg-surface hover:border-accent/50',
          )}>
          <p className="font-semibold text-sm text-text">Multa</p>
          <p className="text-xs text-text-muted">Pena alternativa no privativa</p>
        </button>
      </div>
    </div>
  );
}
