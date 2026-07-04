import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/ui';

/**
 * <IconBadge /> —封装 del patrón icono-contenedor canónico de la web pública
 * (R16: w-11 h-11 rounded-lg con borde + tint). Antes este patrón estaba
 * clonado inline en ~10 puntos de la home y /despacho con leves variaciones
 * de tamaño (w-10/w-11), de tint (bg-accent/15 vs bg-primary/10) y de borde.
 *
 * Centralizarlo aquí asegura consistencia visual y reduce el ruido de clases
 * repetidas en el JSX de las páginas.
 *
 * Variants:
 *  - accent: dorado (acento de marca). Para destacar.
 *  - primary: navy. Para bloques informativos.
 *  - muted: neutro. Para bloques secundarios.
 */
export type IconBadgeVariant = 'accent' | 'primary' | 'muted';

interface IconBadgeProps {
  icon: LucideIcon;
  variant?: IconBadgeVariant;
  /** Tamaño del contenedor. Default 'md' = w-11 h-11 (canónico R16). */
  size?: 'sm' | 'md' | 'lg';
  /** Tamaño del icono interior en px. Default 20. */
  iconSize?: number;
  className?: string;
  /** Etiqueta aria del icono. Por defecto aria-hidden. */
  label?: string;
}

const VARIANT_CLS: Record<IconBadgeVariant, string> = {
  accent: 'bg-accent/15 border border-accent/30 text-accent-dark',
  primary: 'bg-primary/10 border border-primary/15 text-primary',
  muted: 'bg-surface-alt border border-border-light text-text-secondary',
};

const SIZE_CLS = {
  sm: 'w-9 h-9',
  md: 'w-11 h-11',
  lg: 'w-12 h-12',
};

export function IconBadge({
  icon: Icon,
  variant = 'accent',
  size = 'md',
  iconSize = 20,
  className,
  label,
}: IconBadgeProps) {
  return (
    <div
      className={cn(
        'rounded-lg flex items-center justify-center flex-shrink-0',
        VARIANT_CLS[variant],
        SIZE_CLS[size],
        className,
      )}
      aria-hidden={label ? undefined : true}
      role={label ? 'img' : undefined}
      aria-label={label}
    >
      <Icon size={iconSize} aria-hidden="true" />
    </div>
  );
}
