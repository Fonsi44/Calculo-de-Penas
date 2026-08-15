import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Section, Container } from '@/components/marketing/section';

interface CargoHubBridgeProps {
  hubHref: string;
  hubLabel: string;
  title: string;
  body: string;
  profileHref: string;
  profileLabel: string;
}

/** Puente corto cargo → hub canónico. Evita que la landing de query exacta
 *  compita como segundo hub de área. */
export function CargoHubBridge({
  hubHref,
  hubLabel,
  title,
  body,
  profileHref,
  profileLabel,
}: CargoHubBridgeProps) {
  return (
    <Section background="muted" spacing="sm">
      <Container size="md">
        <div className="rounded-lg border border-accent/30 bg-surface px-5 py-5 md:px-7 md:py-6">
          <p className="text-xxs font-bold uppercase tracking-widest text-accent-dark mb-2">
            Página de orientación local
          </p>
          <h2 className="font-serif font-extrabold text-xl md:text-2xl text-primary leading-tight text-balance">
            {title}
          </h2>
          <p className="mt-2 text-sm text-text-secondary leading-relaxed text-pretty">
            {body}
          </p>
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
            <Link
              href={hubHref}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-accent-dark"
            >
              {hubLabel} <ArrowRight size={14} aria-hidden="true" />
            </Link>
            <Link
              href={profileHref}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent-dark hover:text-primary"
            >
              {profileLabel} <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </Container>
    </Section>
  );
}
