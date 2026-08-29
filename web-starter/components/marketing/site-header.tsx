import Link from 'next/link';
import { site } from '@/lib/site';
import { Container } from '@/components/marketing/section';

export function SiteHeader() {
  return (
    <header role="banner" className="sticky top-0 z-50 border-b border-border-light bg-surface/95 backdrop-blur-sm">
      <Container className="flex h-14 items-center justify-between">
        <Link href="/" className="font-serif font-bold text-lg text-primary">
          {site.name}
        </Link>
        <nav className="flex items-center gap-4 text-sm font-medium">
          {site.nav.map((item) => (
            <Link key={item.href} href={item.href} className="text-text-secondary hover:text-primary transition-colors">
              {item.label}
            </Link>
          ))}
        </nav>
      </Container>
    </header>
  );
}
