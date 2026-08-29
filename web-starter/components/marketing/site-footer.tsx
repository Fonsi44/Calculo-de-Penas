import Link from 'next/link';
import { site } from '@/lib/site';
import { Container } from '@/components/marketing/section';

export function SiteFooter() {
  return (
    <footer role="contentinfo" className="border-t border-border-light bg-primary text-text-inverse">
      <Container className="py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
        <p className="font-serif font-bold">{site.name}</p>
        <p className="text-text-inverse/75">{site.tagline}</p>
        <nav className="flex gap-4">
          {site.nav.map((item) => (
            <Link key={item.href} href={item.href} className="text-text-inverse/80 hover:text-accent transition-colors">
              {item.label}
            </Link>
          ))}
        </nav>
      </Container>
    </footer>
  );
}
