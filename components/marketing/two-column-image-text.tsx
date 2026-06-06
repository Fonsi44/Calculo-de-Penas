import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { PlaceholderPhoto, type PlaceholderAspect, type PlaceholderTone } from './placeholder-photo';
import { CircularIcon } from './circular-icon';

export interface TwoColItem {
  icon: LucideIcon;
  title?: string;
  body: ReactNode;
}

interface TwoColumnImageTextProps {
  image: {
    tone?: PlaceholderTone;
    aspect?: PlaceholderAspect;
    label?: string;
    src?: string;
    alt?: string;
  };
  heading?: string;
  intro?: string;
  items: TwoColItem[];
  reverse?: boolean;
  className?: string;
  iconSize?: 'sm' | 'md' | 'lg';
}

export function TwoColumnImageText({
  image,
  heading,
  intro,
  items,
  reverse = false,
  className,
  iconSize = 'md',
}: TwoColumnImageTextProps) {
  return (
    <div
      className={`grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center ${className ?? ''}`}
    >
      <div className={reverse ? 'lg:order-2' : ''}>
        <PlaceholderPhoto
          tone={image.tone ?? 'primary'}
          aspect={image.aspect ?? '4/3'}
          label={image.label}
          imageSrc={image.src}
          imageAlt={image.alt}
          rounded="xl"
        />
      </div>
      <div className={reverse ? 'lg:order-1' : ''}>
        {heading && (
          <h3 className="font-serif font-extrabold text-2xl md:text-3xl text-primary leading-tight">
            {heading}
          </h3>
        )}
        {intro && (
          <p className="mt-3 text-sm md:text-base text-text-secondary leading-relaxed">
            {intro}
          </p>
        )}
        <ul className={`mt-6 space-y-5 ${heading || intro ? '' : 'mt-0'}`}>
          {items.map((it, idx) => (
            <li key={idx} className="flex items-start gap-4">
              <CircularIcon icon={it.icon} size={iconSize} background="white" tone="gold" bordered />
              <div className="min-w-0 flex-1">
                {it.title && (
                  <h4 className="font-bold text-sm md:text-base text-primary leading-snug">
                    {it.title}
                  </h4>
                )}
                <p className={`text-sm md:text-base text-text leading-relaxed ${it.title ? 'mt-1' : ''}`}>
                  {it.body}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
