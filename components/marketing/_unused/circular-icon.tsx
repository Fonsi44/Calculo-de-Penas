import { createElement, isValidElement, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/ui';

const SIZES = {
  sm: { box: 'w-12 h-12', icon: 22 },
  md: { box: 'w-16 h-16', icon: 28 },
  lg: { box: 'w-20 h-20', icon: 34 },
  xl: { box: 'w-24 h-24', icon: 40 },
} as const;

const TONES = {
  gold: 'text-accent-dark',
  primary: 'text-primary',
  dark: 'text-primary-dark',
  inverse: 'text-text-inverse',
} as const;

const BG = {
  white: 'bg-white',
  transparent: 'bg-transparent',
  primary: 'bg-primary',
  muted: 'bg-surface-alt',
};

type IconLike = LucideIcon | ReactNode;

function renderIcon(icon: IconLike, size: number): ReactNode {
  if (isValidElement(icon)) {
    return createElement(
      icon.type as React.ElementType,
      { size, 'aria-hidden': true },
    );
  }
  if (typeof icon === 'function') {
    const Cmp = icon as React.ElementType;
    return <Cmp size={size} aria-hidden="true" />;
  }
  return icon;
}

interface CircularIconProps {
  icon: IconLike;
  size?: keyof typeof SIZES;
  tone?: keyof typeof TONES;
  background?: keyof typeof BG;
  bordered?: boolean;
  className?: string;
  ariaLabel?: string;
}

export function CircularIcon({
  icon,
  size = 'md',
  tone = 'gold',
  background = 'white',
  bordered = true,
  className,
  ariaLabel,
}: CircularIconProps) {
  const s = SIZES[size];
  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center flex-shrink-0',
        s.box,
        BG[background],
        bordered && 'border-2 border-accent',
        TONES[tone],
        className,
      )}
      role={ariaLabel ? 'img' : undefined}
      aria-label={ariaLabel}
    >
      {renderIcon(icon, s.icon)}
    </div>
  );
}

interface CircularIconBulletProps {
  icon: IconLike;
  size?: keyof typeof SIZES;
  className?: string;
  ariaLabel?: string;
}

export function CircularIconBullet({ icon, size = 'md', className, ariaLabel }: CircularIconBulletProps) {
  return (
    <CircularIcon
      icon={icon}
      size={size}
      background="white"
      tone="gold"
      bordered
      ariaLabel={ariaLabel}
      className={className}
    />
  );
}
