import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Gavel,
  Briefcase,
  HeartHandshake,
  Scale,
  Building2,
  Receipt,
  AlertTriangle,
  Layers,
  Compass,
  ArrowRight,
  type LucideIcon,
} from 'lucide-react';

import { site, absoluteUrl } from '@/lib/site';
import { Section, SectionHeader, Container } from '@/components/marketing/section';
import { CTAGroup } from '@/components/marketing/cta-buttons';
import { PageHero } from '@/components/marketing/page-hero';
import { TrustBar } from '@/components/marketing/trust-bar';
import { ServiceCard } from '@/components/marketing/service-card';
import { Card } from '@/components/ui/card';
import { ConsultationCTA } from '@/components/marketing/consultation-cta';
import { BlogHighlights } from '@/components/marketing/blog-highlights';
import { getAreasFromDb } from '@/lib/areas-db';
import { webpageSchema } from '@/lib/seo-schema';
import { Breadcrumbs } from '@/components/marketing/breadcrumbs';
import { getPageContent } from '@/lib/page-content-db';
import { ServiceSearch } from '@/components/blog/service-search';
import { TOP_ORGANIC_GUIDE_SLUGS } from '@/data/seo/high-intent-guides';

export const metadata: Metadata = {
  // Absolute para controlar la longitud total y evitar que el template del
  // layout añada "| Pineda y Asociados" (la marca ya va incluida). Antes el
  // title resuelto medía 77 caracteres (>65): se truncaba en SERP.
  title: { absolute: `Abogados en ${site.address.city} - Todas las Áreas del Derecho` },
  description: `Abogados en Nacaome, Valle: penal, familia, laboral, civil, mercantil y tributario. Cobertura San Lorenzo y Choluteca. Consulta por WhatsApp ${site.whatsappDisplay}.`,
  alternates: { canonical: '/servicios-juridicos' },
  keywords: ['abogados Nacaome', 'abogado Valle Honduras', 'áreas del derecho Nacaome', 'derecho familia Valle', 'derecho laboral Nacaome', 'derecho mercantil Valle', 'derecho civil Choluteca', 'bufete jurídico Nacaome'],
  twitter: {
    card: 'summary_large_image',
    title: `Abogados en ${site.address.city} - Todas las Áreas del Derecho`,
    description: `Abogados en Nacaome, Valle: penal, familia, laboral, civil, mercantil y tributario. Cobertura San Lorenzo y Choluteca.`,
    images: [`${site.url}/og-image.png`],
  },
  openGraph: {
    title: `Abogados en ${site.address.city}, ${site.address.department} - Todas las Áreas del Derecho`,
    description: `Abogados en Nacaome, Valle, Honduras. Penal, familia, laboral, civil, mercantil y tributario bajo un mismo bufete. Cobertura en la zona sur.`,
    url: `${site.url}/servicios-juridicos`,
    siteName: site.name,
    locale: 'es_HN',
    type: 'website',
    images: [{ url: `${site.url}/og/civil.webp`, width: 1200, height: 630, alt: `${site.name} - Servicios Jurídicos` }],
  },
};

export default async function AreasJuridicasPage() {
  const areas = await getAreasFromDb('servicio');
  const contentMap = await getPageContent('servicios-juridicos');
  const decisionMatrix: { problema: string; area: string; badge: string; primerPaso: string; href: string; icon: LucideIcon; tone: string }[] = [
    {
      problema: 'Detención, citación o investigación penal',
      area: 'Derecho Penal',
      badge: 'Penal',
      primerPaso: 'No declare sin asesoría. Preserve pruebas, documentos y comunicaciones, y active una defensa inmediata.',
      href: '/derecho-penal',
      icon: Gavel,
      tone: 'danger',
    },
    {
      problema: 'Despido, salarios pendientes o accidente laboral',
      area: 'Derecho Laboral',
      badge: 'Laboral',
      primerPaso: 'Reúna contrato, comprobantes de pago, comunicaciones y una cronología clara de los hechos.',
      href: '/servicios-juridicos/derecho-laboral',
      icon: Briefcase,
      tone: 'success',
    },
    {
      problema: 'Divorcio, custodia o pensión alimenticia',
      area: 'Derecho de Familia',
      badge: 'Familia',
      primerPaso: 'Organice la documentación familiar y valore si existen medidas urgentes de protección o regulación.',
      href: '/servicios-juridicos/derecho-de-familia',
      icon: HeartHandshake,
      tone: 'primary',
    },
    {
      problema: 'Contrato incumplido, deuda o conflicto de propiedad',
      area: 'Derecho Civil y Notarial',
      badge: 'Civil',
      primerPaso: 'Revise contratos, requerimientos, pagos, escrituras y cualquier evidencia documental disponible.',
      href: '/servicios-juridicos/derecho-civil-y-notarial',
      icon: Scale,
      tone: 'accent',
    },
    {
      problema: 'Empresa, sociedad, marca o cumplimiento comercial',
      area: 'Derecho Mercantil y Empresarial',
      badge: 'Mercantil',
      primerPaso: 'Evalúe riesgos contractuales, estructura legal y obligaciones antes de firmar, operar o escalar.',
      href: '/servicios-juridicos/derecho-mercantil-empresarial',
      icon: Building2,
      tone: 'primary',
    },
    {
      problema: 'Fiscalización SAR, impuestos o facturación electrónica',
      area: 'Derecho Tributario y Fiscal',
      badge: 'Fiscal',
      primerPaso: 'Audite soportes contables, notificaciones y descargos antes de responder formalmente.',
      href: '/servicios-juridicos/tributario-fiscal',
      icon: Receipt,
      tone: 'warning',
    },
  ];

  return (
    <>
      <Breadcrumbs items={[
        { label: 'Inicio', href: '/' },
        { label: 'Servicios Jurídicos' },
      ]} />
      <PageHero
        eyebrow={contentMap['hero.eyebrow'] || 'Servicios Jurídicos'}
        badge={contentMap['hero.badge'] || 'Cobertura integral'}
        title={contentMap['hero.title'] || `Servicios Jurídicos en ${site.address.city}, ${site.address.department} — Ramas principales del derecho`}
        subtitle={contentMap['hero.subtitle'] || 'Desde Nacaome, Valle, ofrecemos cobertura legal integral en las principales ramas del derecho hondureño. La defensa penal es nuestra especialidad destacada y la acompañamos con servicios especializados en familia, laboral, civil, mercantil, tributario y más.'}
        cta={<CTAGroup variant="inverse" />}
        bgImage="/images/servicios/servicios-bg.webp"
      />

      <div className="bg-background py-6 md:py-8">
        <div className="mx-auto px-4 sm:px-6 max-w-7xl">
          <ServiceSearch
            items={areas.map((a) => ({
              href: `/servicios-juridicos/${a.slug}`,
              title: a.titulo,
              description: a.descripcionCorta || '',
            }))}
            placeholder='Buscar servicio jurídico: "divorcio", "despido", "contrato"...'
            domain="servicios-juridicos"
          />
        </div>
      </div>

      <TrustBar background="light" />

      <Section background="muted" spacing="md">
        <SectionHeader
          eyebrow="Servicios Jurídicos"
          title={contentMap['content.section_title'] || 'Cobertura legal completa en la zona sur de Honduras'}
          subtitle={contentMap['content.section_subtitle'] || 'Seleccione el área que necesita y acceda a información detallada sobre nuestros servicios, subservicios y preguntas frecuentes.'}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {areas.map((area) => (
            <ServiceCard
              key={area.slug}
              href={`/servicios-juridicos/${area.slug}`}
              slug={area.slug}
              title={area.titulo}
              description={area.descripcionCorta}
              category="services"
              tone="primary"
            />
          ))}
        </div>
      </Section>

      <Section spacing="md" id="matriz-orientacion">
        <SectionHeader
          eyebrow="Orientación legal"
          title="¿Qué servicio jurídico necesita según su situación?"
          subtitle="Identifique el área legal más adecuada para su caso y conozca el primer paso recomendado antes de tomar decisiones importantes."
          align="center"
        />

        {/* ── ESCRITORIO: tabla elegante con filas tipo card ── */}
        <div className="hidden lg:block rounded-lg border border-border/40 bg-background overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-alt border-b border-border/40">
              <tr>
                <th className="text-left p-4 font-bold text-text">Problema habitual</th>
                <th className="text-left p-4 font-bold text-text">Área recomendada</th>
                <th className="text-left p-4 font-bold text-text">Primer paso estratégico</th>
                <th className="text-right p-4 font-bold text-text">Acción</th>
              </tr>
            </thead>
            <tbody>
              {decisionMatrix.map((item) => {
                const Icon = item.icon;
                return (
                  <tr key={item.problema} className="border-b border-border/20 last:border-0 hover:bg-surface-alt/50 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-lg bg-accent/10 border border-accent/15 flex items-center justify-center flex-shrink-0">
                          <Icon className="text-accent-dark" size={20} aria-hidden="true" />
                        </div>
                        <span className="text-text font-medium leading-snug">{item.problema}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${
                        item.tone === 'danger' ? 'bg-danger/10 border-danger/20 text-danger' :
                        item.tone === 'success' ? 'bg-success/10 border-success/20 text-success' :
                        item.tone === 'warning' ? 'bg-warning/10 border-warning/20 text-warning' :
                        item.tone === 'accent' ? 'bg-accent/10 border-accent/20 text-accent-dark' :
                        'bg-primary/10 border-primary/20 text-primary'
                      }`}>
                        {item.badge}
                      </span>
                    </td>
                    <td className="p-4 text-text-secondary leading-relaxed max-w-md">{item.primerPaso}</td>
                    <td className="p-4 text-right">
                      <Link
                        href={item.href}
                        className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg border border-border-light bg-surface text-text text-xs font-bold hover:border-accent/40 hover:text-accent-dark transition-colors whitespace-nowrap"
                      >
                        Ver servicio <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ── MÓVIL/TABLET: tarjetas verticales ── */}
        <div className="lg:hidden space-y-4">
          {decisionMatrix.map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.problema} padding="md" className="h-full">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-11 h-11 rounded-lg bg-accent/10 border border-accent/15 flex items-center justify-center flex-shrink-0">
                    <Icon className="text-accent-dark" size={20} aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-text font-medium text-sm leading-snug">{item.problema}</p>
                    <span className={`inline-flex items-center mt-1.5 px-2 py-0.5 rounded-md text-xxs font-bold border ${
                      item.tone === 'danger' ? 'bg-danger/10 border-danger/20 text-danger' :
                      item.tone === 'success' ? 'bg-success/10 border-success/20 text-success' :
                      item.tone === 'warning' ? 'bg-warning/10 border-warning/20 text-warning' :
                      item.tone === 'accent' ? 'bg-accent/10 border-accent/20 text-accent-dark' :
                      'bg-primary/10 border-primary/20 text-primary'
                    }`}>
                      {item.badge}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-text-secondary leading-relaxed mb-4">{item.primerPaso}</p>
                <Link
                  href={item.href}
                  className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg border border-border-light bg-surface text-text text-xs font-bold hover:border-accent/40 hover:text-accent-dark transition-colors"
                >
                  Ver servicio <ArrowRight size={13} />
                </Link>
              </Card>
            );
          })}
        </div>

        {/* ── 3 TARJETAS DESTACADAS ── */}
        <div className="grid md:grid-cols-3 gap-4 mt-8">
          <Card padding="md" className="h-full border-l-4 border-l-danger/50">
            <div className="flex items-center gap-2.5 mb-2">
              <AlertTriangle size={18} className="text-danger flex-shrink-0" aria-hidden="true" />
              <h3 className="font-bold text-sm text-text">Si existe urgencia procesal</h3>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed">
              Priorice la defensa penal, las medidas cautelares o cualquier actuación con plazo inmediato. Las primeras horas pueden ser decisivas para proteger su posición jurídica.
            </p>
          </Card>
          <Card padding="md" className="h-full border-l-4 border-l-accent/50">
            <div className="flex items-center gap-2.5 mb-2">
              <Layers size={18} className="text-accent-dark flex-shrink-0" aria-hidden="true" />
              <h3 className="font-bold text-sm text-text">Si su caso involucra varias áreas</h3>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed">
              Inicie por el problema principal y coordine una estrategia multidisciplinar dentro del despacho. Esto evita respuestas aisladas o decisiones legales contradictorias.
            </p>
          </Card>
          <Card padding="md" className="h-full border-l-4 border-l-primary/50">
            <div className="flex items-center gap-2.5 mb-2">
              <Compass size={18} className="text-primary flex-shrink-0" aria-hidden="true" />
              <h3 className="font-bold text-sm text-text">Si no sabe por dónde empezar</h3>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed">
              Solicite una consulta inicial para ordenar hechos, identificar riesgos, revisar documentos clave y recibir una hoja de ruta clara sobre los próximos pasos.
            </p>
          </Card>
        </div>
      </Section>

      <Section spacing="sm">
        <Container size="lg">
          <div className="text-center">
            <p className="text-sm text-text-secondary leading-relaxed">
              Defensa penal técnica y confidencial en{' '}
              <Link href="/derecho-penal" className="font-semibold text-primary hover:text-accent-dark transition-colors">derecho penal</Link>
              {' · '}Conozca{' '}
              <Link href="/despacho" className="font-semibold text-primary hover:text-accent-dark transition-colors">nuestro despacho</Link>
              {' · '}Resuelva dudas en{' '}
              <Link href="/preguntas-frecuentes" className="font-semibold text-primary hover:text-accent-dark transition-colors">preguntas frecuentes</Link>
              {' · '}
              <Link href="/blog" className="font-semibold text-primary hover:text-accent-dark transition-colors">blog jurídico</Link>
            </p>
          </div>
        </Container>
      </Section>

      {/* GUIAS DESTACADAS — enlazado interno servicios→blog.
          Cubre categorías no penales (laboral, civil, mercantil, familiar) para
          reforzar el crawl path hacia posts que no reciben enlaces desde /derecho-penal. */}
      <BlogHighlights
        slugs={[
          TOP_ORGANIC_GUIDE_SLUGS[2],
          TOP_ORGANIC_GUIDE_SLUGS[3],
          TOP_ORGANIC_GUIDE_SLUGS[4],
          'pension-alimenticia-honduras-guia-completa',
          'danos-perjuicios-indemnizacion-honduras',
          'prescripcion-deudas-plazos-honduras',
          'jornada-laboral-horas-extra-descansos-honduras',
        ]}
        eyebrow="Artículos relacionados"
        title="Guías de nuestras áreas de práctica"
        subtitle="Recursos con demanda orgánica real sobre familia, notarial, mercantil y conflictos civiles que suelen preceder una consulta jurídica." 
        ctaLabel="Explorar todas las guías del blog"
        ctaHref="/blog"
      />

      <ConsultationCTA />

      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: JSON.stringify(
          webpageSchema(
            'Servicios Jurídicos en Nacaome, Valle | Ramas principales del derecho',
            'Cobertura legal integral en las principales ramas del derecho en Nacaome, Valle, Honduras.',
            '/servicios-juridicos'
          ),
        ),
      }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: 'Áreas del derecho en Nacaome, Valle',
          url: absoluteUrl('/servicios-juridicos'),
          itemListElement: areas.map((area, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: area.titulo,
            url: absoluteUrl(`/servicios-juridicos/${area.slug}`),
          })),
        }),
      }} />
    </>
  );
}
