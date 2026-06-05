import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { PlaceholderPhoto, type PlaceholderAspect, type PlaceholderTone } from './placeholder-photo';

interface ServiceCardPhotoProps {
  href: string;
  title: string;
  description?: string;
  tone?: PlaceholderTone;
  aspect?: PlaceholderAspect;
  label?: string;
  className?: string;
}

export function ServiceCardPhoto({
  href,
  title,
  description,
  tone = 'primary',
  aspect = '4/3',
  label,
  className,
}: ServiceCardPhotoProps) {
  return (
    <Link
      href={href}
      className={`group block bg-surface rounded-xl border border-border-light overflow-hidden hover:border-accent/60 hover:shadow-lg transition-all duration-200 focus-visible:outline-none ${className ?? ''}`}
    >
      <PlaceholderPhoto tone={tone} aspect={aspect} rounded="none" label={label} />
      <div className="p-5 md:p-6">
        <h3 className="font-serif font-bold text-lg md:text-xl text-primary leading-snug group-hover:text-primary-light transition-colors">
          {title}
        </h3>
        {description && (
          <p className="mt-2 text-[13px] leading-relaxed text-text-secondary line-clamp-3">
            {description}
          </p>
        )}
        <span className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wider text-accent-dark group-hover:gap-2.5 transition-all">
          Conocer mas
          <ArrowRight size={14} aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}
