import type { LucideIcon } from 'lucide-react';
import { CircularIcon } from './circular-icon';

export interface CommitmentItem {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface CommitmentsGridProps {
  title?: string;
  subtitle?: string;
  items: CommitmentItem[];
  columns?: 2 | 3 | 4;
  background?: 'muted' | 'default' | 'accent';
  className?: string;
}

const COLS = {
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-2 lg:grid-cols-3',
  4: 'sm:grid-cols-2 lg:grid-cols-4',
};

const BG = {
  default: 'bg-background',
  muted: 'bg-surface-alt',
  accent: 'bg-accent/10',
};

export function CommitmentsGrid({
  title,
  subtitle,
  items,
  columns = 4,
  background = 'muted',
  className,
}: CommitmentsGridProps) {
  return (
    <section className={`${BG[background]} py-14 md:py-20 ${className ?? ''}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {(title || subtitle) && (
          <div className="text-center max-w-3xl mx-auto mb-10 md:mb-14">
            {title && (
              <h2 className="font-serif font-extrabold text-2xl md:text-3xl lg:text-4xl text-primary leading-tight">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="mt-3 text-[15px] md:text-base text-text-secondary leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
        )}
        <div className={`grid grid-cols-1 ${COLS[columns]} gap-8 md:gap-10`}>
          {items.map((it) => (
            <div key={it.title} className="flex flex-col items-center text-center">
              <CircularIcon
                icon={it.icon}
                size="lg"
                background="white"
                tone="primary"
                bordered
              />
              <p className="mt-4 text-[14px] md:text-[15px] text-text-secondary leading-relaxed max-w-xs">
                {it.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
