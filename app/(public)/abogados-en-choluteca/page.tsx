import type { Metadata } from 'next';
import Link from 'next/link';
import { getLandingBySlug, landingMetadata } from '@/data/landings-locales';
import { LandingLocalView } from '@/components/marketing/landing-local';
import { BlogHighlights } from '@/components/marketing/blog-highlights';
import { Section, SectionHeader } from '@/components/marketing/section';
import { Card } from '@/components/ui/card';

const landing = getLandingBySlug('choluteca')!;

export const metadata: Metadata = landingMetadata(landing);

export default async function AbogadosEnCholutecaPage() {
  const casosPrioritarios = [
    { text: 'Defensa penal y audiencias de urgencia', href: '/abogado-penalista-choluteca' },
    { text: 'Despidos, prestaciones y reclamaciones laborales' },
    { text: 'Divorcios, custodia y pensión alimenticia' },
    { text: 'Contratos civiles y conflictos mercantiles' },
    { text: 'Trámites notariales y documentales con seguimiento' },
  ];

  const enlacesServicio = [
    { href: '/abogado-penalista-choluteca', label: 'Penalista en Choluteca' },
    { href: '/derecho-penal', label: 'Defensa penal' },
    { href: '/servicios-juridicos/derecho-laboral', label: 'Derecho laboral' },
    { href: '/servicios-juridicos/derecho-de-familia', label: 'Derecho de familia' },
    { href: '/servicios-juridicos/derecho-civil-y-notarial', label: 'Derecho civil y notarial' },
    { href: '/servicios-juridicos/derecho-mercantil-empresarial', label: 'Derecho mercantil y empresarial' },
  ];

  return (
    <>
      <LandingLocalView landing={landing} />

      <Section background="muted" spacing="md">
        <SectionHeader
          eyebrow="Contexto local"
          title="Atención jurídica para Choluteca y su zona de influencia"
          subtitle="Cobertura coordinada desde Nacaome con seguimiento en diligencias, audiencias y trámites frecuentes para clientes de Choluteca."
        />

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card padding="md" className="h-full border-l-4 border-l-primary/40">
            <h3 className="font-bold text-sm text-text">Cobertura geográfica verificable</h3>
            <p className="mt-1.5 text-sm text-text-secondary leading-relaxed">
              Atendemos casos en Choluteca ciudad y municipios cercanos, coordinando presencia en sedes judiciales y administrativas cuando el asunto lo requiere.
            </p>
          </Card>
          <Card padding="md" className="h-full border-l-4 border-l-accent/40">
            <h3 className="font-bold text-sm text-text">Modalidad de atención</h3>
            <p className="mt-1.5 text-sm text-text-secondary leading-relaxed">
              Puede iniciar por WhatsApp o llamada, seguir con revisión documental remota y programar atención presencial con agenda y hoja de ruta por escrito.
            </p>
          </Card>
          <Card padding="md" className="h-full border-l-4 border-l-warning/40">
            <h3 className="font-bold text-sm text-text">Por qué contactar al despacho</h3>
            <p className="mt-1.5 text-sm text-text-secondary leading-relaxed">
              Recibe estrategia clara, plazos orientativos y coordinación multidisciplinar cuando su caso combina penal, laboral, familia, civil o mercantil.
            </p>
          </Card>
        </div>

        <div className="mt-6 grid lg:grid-cols-2 gap-4">
          <Card padding="md" className="h-full">
            <h3 className="font-bold text-sm text-text">Tipos de casos atendidos en Choluteca</h3>
            <ul className="mt-2 space-y-2 text-sm text-text-secondary">
              {casosPrioritarios.map((caso) => (
                <li key={caso.text} className="leading-relaxed">
                  -{' '}
                  {caso.href ? (
                    <Link href={caso.href} className="font-semibold text-primary hover:text-accent-dark">
                      {caso.text}
                    </Link>
                  ) : (
                    caso.text
                  )}
                </li>
              ))}
            </ul>
          </Card>
          <Card padding="md" className="h-full">
            <h3 className="font-bold text-sm text-text">Enlaces de acción rápida</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {enlacesServicio.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold bg-surface-alt text-primary hover:text-accent-dark transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </div>
            <p className="mt-3 text-sm text-text-secondary leading-relaxed">
              Si su problema involucra varias ramas, puede iniciar por la principal y el despacho coordina las demás frentes sin duplicar gestiones.
            </p>
          </Card>
        </div>
      </Section>

      <BlogHighlights
        slugs={[
          'divorcio-honduras-guia-completa',
          'calcular-liquidacion-laboral-honduras',
          'contratos-trabajo-tipos-clausulas-honduras',
          'compraventa-inmuebles-aspectos-legales-honduras',
          'contratos-mercantiles-esenciales-empresas-honduras',
          'pension-alimenticia-honduras-guia-completa',
        ]}
        eyebrow="Guías para Choluteca"
        title="Recursos legales de interés para la zona de Choluteca"
        subtitle="Guías prácticas sobre derecho de familia, laboral, civil y mercantil para la zona de Choluteca."
        ctaLabel="Ver todas las guías del blog"
        ctaHref="/blog"
      />
    </>
  );
}
