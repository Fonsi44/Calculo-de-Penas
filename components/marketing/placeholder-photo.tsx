import type { ReactNode } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/ui';

const TONES = {
  primary: { from: '#1A2B4A', to: '#2D4070', accent: '#C9A55C' },
  penal: { from: '#3A1212', to: '#7A1F1F', accent: '#E0A858' },
  familia: { from: '#0E2A2A', to: '#1F4A4A', accent: '#7BC9B5' },
  laboral: { from: '#1A2030', to: '#3A4570', accent: '#9CA9D8' },
  mercantil: { from: '#1F2A1A', to: '#3A4F2A', accent: '#B5C97B' },
  civil: { from: '#2A1A1F', to: '#4F2A35', accent: '#D89BA8' },
  bancario: { from: '#10182A', to: '#25355C', accent: '#8FA9D8' },
  administrativo: { from: '#1F1A2A', to: '#3F2A4F', accent: '#B58FD8' },
  aduanero: { from: '#2A1F0E', to: '#5A4520', accent: '#D8B58F' },
  sanitario: { from: '#0E2A1F', to: '#1F4F35', accent: '#7BD8B5' },
  migracion: { from: '#2A0E1F', to: '#5A1F4A', accent: '#D87BB5' },
  propiedad: { from: '#2A2A0E', to: '#4F4F1F', accent: '#D8D87B' },
  tributario: { from: '#1F2A2A', to: '#3F4F4F', accent: '#9BC9C9' },
  ambiental: { from: '#0E2A1A', to: '#1F4F2A', accent: '#7BD89B' },
  arbitraje: { from: '#2A1A0E', to: '#5A3520', accent: '#D8B58F' },
  migrante: { from: '#0E1A2A', to: '#1F3A5A', accent: '#7B9BD8' },
} as const;

export type PlaceholderTone = keyof typeof TONES;

const ASPECT = {
  '16/9': 'aspect-[16/9]',
  '4/3': 'aspect-[4/3]',
  '3/2': 'aspect-[3/2]',
  '1/1': 'aspect-square',
  '21/9': 'aspect-[21/9]',
  '5/4': 'aspect-[5/4]',
  '3/4': 'aspect-[3/4]',
} as const;

export type PlaceholderAspect = keyof typeof ASPECT;

interface PlaceholderPhotoProps {
  tone?: PlaceholderTone;
  aspect?: PlaceholderAspect;
  label?: string;
  icon?: ReactNode;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  /**
   * Ruta local servida por Next (p.ej. /images/services/familia.jpg).
   * Si se indica, se renderiza la imagen con object-cover en lugar del
   * gradiente del tone. El tone se mantiene como fallback accesible y
   * como background bajo la imagen por si la red falla.
   */
  imageSrc?: string;
  /** Alt text de la imagen. Si no se indica, se usa `label`. */
  imageAlt?: string;
}

const ROUNDED = {
  none: '',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
};

const DEFAULT_ICON = (
  <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <rect x="6" y="14" width="52" height="38" rx="3" />
    <circle cx="22" cy="28" r="4" />
    <path d="M6 46 L18 34 L28 42 L42 28 L58 44 L58 52 L6 52 Z" fill="currentColor" fillOpacity="0.25" />
  </svg>
);

export function PlaceholderPhoto({
  tone = 'primary',
  aspect = '4/3',
  label,
  icon,
  rounded = 'lg',
  className,
  imageSrc,
  imageAlt,
}: PlaceholderPhotoProps) {
  const t = TONES[tone];
  const hasImage = Boolean(imageSrc);
  return (
    <div
      className={cn(
        'relative overflow-hidden flex items-center justify-center',
        ASPECT[aspect],
        ROUNDED[rounded],
        className,
      )}
      style={{
        background: `linear-gradient(135deg, ${t.from} 0%, ${t.to} 100%)`,
        color: t.accent,
      }}
      role={hasImage ? undefined : label ? 'img' : undefined}
      aria-label={hasImage ? undefined : label}
    >
      {hasImage ? (
        <Image
          src={imageSrc as string}
          alt={imageAlt ?? label ?? ''}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover"
        />
      ) : (
        <>
          <div
            className="absolute inset-0 opacity-30 pointer-events-none"
            style={{
              backgroundImage:
                'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.18) 0%, transparent 45%), radial-gradient(circle at 80% 80%, rgba(0,0,0,0.25) 0%, transparent 50%)',
            }}
          />
          <div className="relative w-1/3 max-w-[120px] opacity-70">
            {icon ?? DEFAULT_ICON}
          </div>
          {label && (
            <span
              className="absolute bottom-2 right-3 text-caption font-bold uppercase tracking-widest opacity-60"
              style={{ color: t.accent }}
            >
              {label}
            </span>
          )}
        </>
      )}
    </div>
  );
}
