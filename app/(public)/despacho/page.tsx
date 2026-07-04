import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import {
  Scale, ShieldCheck, Briefcase, BookOpen,
  HeartHandshake, ArrowRight, CheckCircle2, Gavel, Award,
} from 'lucide-react';
import { site, FOUNDER_PROFILE, THANIA_PROFILE, EMIL_PROFILE } from '@/lib/site';
import { Section, SectionHeader } from '@/components/marketing/section';
import { CTAGroup } from '@/components/marketing/cta-buttons';
import { Card } from '@/components/ui/card';
import { LiveOfficeStatus, StatsCounter } from '@/components/marketing/live-widgets';
import { PageHero } from '@/components/marketing/page-hero';
import { TrustBar } from '@/components/marketing/trust-bar';
import { ProcessStepper } from '@/components/marketing/process-stepper';
import { getCorporateImage } from '@/data/images';
import { getPageContent } from '@/lib/page-content-db';
import { ConsultationCTA } from '@/components/marketing/consultation-cta';
import { Breadcrumbs } from '@/components/marketing/breadcrumbs';
import { BlogHighlights } from '@/components/marketing/blog-highlights';

export const metadata: Metadata = {
  // Absolute para evitar la duplicación de marca "| Pineda y Asociados |
  // Pineda y Asociados" (el title string ya incluía la marca y el template
  // del layout la añadía de nuevo → 78 caracteres con marca duplicada).
  title: { absolute: `Bufete de Abogados en ${site.address.city}, ${site.address.department}` },
  description: `Abogados en Nacaome, Valle con más de 15 años de experiencia en defensa penal, familia, laboral, civil y mercantil. Consulta confidencial y presupuesto por escrito. WhatsApp ${site.whatsappDisplay}.`,
  alternates: { canonical: '/despacho' },
  keywords: ['abogados Nacaome', 'bufete jurídico Valle Honduras', 'abogados Nacaome Valle', 'despacho jurídico sur Honduras', 'equipo legal Nacaome', 'consulta confidencial Valle', 'bufete jurídico Nacaome', 'bufete jurídico sur Honduras', 'abogados Goascorán', 'abogados Amapala', 'abogados Pespire', 'abogados San Marcos de Colón', 'abogados Marcovia'],
  twitter: {
    card: 'summary_large_image',
    title: `Bufete de Abogados en ${site.address.city}, ${site.address.department}`,
    description: `Abogados en Nacaome, Valle. Más de 15 años de experiencia en penal, familia, laboral, civil y mercantil. Consulta confidencial.`,
    images: [`${site.url}/og-image.webp`],
  },
  openGraph: {
    title: `Bufete de Abogados en ${site.address.city}, ${site.address.department}`,
    description: `Abogados en Nacaome, Valle. Más de 15 años de experiencia en defensa penal, familia, laboral, civil y mercantil. Consulta confidencial y presupuesto por escrito.`,
    url: `${site.url}/despacho`,
    siteName: site.name,
    locale: 'es_HN',
    type: 'website',
    images: [{ url: `${site.url}/api/og?tag=El+Despacho&title=${encodeURIComponent(`Bufete en ${site.address.city}, ${site.address.department}`)}&subtitle=${encodeURIComponent('Compromiso legal, rigor técnico y visión de vanguardia. Más de 15 años de ejercicio profesional.')}`, width: 1200, height: 630, alt: `${site.name} - Bufete jurídico en Nacaome, Valle` }],
  },
};

function despachoContent(content: Record<string, string>) {
  return {
    hero: {
      eyebrow: content['hero.eyebrow'] || 'El Despacho',
      badge: content['hero.badge'] || 'Multidisciplinar',
      title: content['hero.title'] || 'Bufete de Abogados en Nacaome, Valle — Compromiso Legal, Rigor Técnico y Visión de Vanguardia',
      subtitle: content['hero.subtitle'] || `${site.name} es un bufete jurídico fundado sobre los pilares del rigor metodológico, la confidencialidad absoluta y la excelencia jurídica. Nos especializamos en ofrecer soluciones legales estratégicas tanto en el ámbito penal como en las distintas ramas del derecho empresarial y privado. Nuestro enfoque combina una sólida solvencia técnica con la digitalización de procesos, garantizando a cada cliente un respaldo legal robusto, transparente y de alto nivel en un entorno global.`,
    },
    mision: {
      title: content['mision_vision.mision_title'] || 'Defender con técnica, servir con humanidad',
      desc: content['mision_vision.mision_desc'] || 'Garantizar que toda persona acceda a una defensa y orientación jurídica seria, técnica y respetuosa de sus derechos.',
    },
    vision: {
      title: content['mision_vision.vision_title'] || 'Justicia accesible y técnica',
      desc: content['mision_vision.vision_desc'] || 'Un sistema de justicia donde cada persona pueda ejercer su derecho a la defensa con un equipo que domine la técnica y actúe con prudencia.',
    },
    values: {
      sectionTitle: content['values.section_title'] || 'Lo que nos define como bufete',
      items: [
        { icon: ShieldCheck, title: content['values.value1_title'] || 'Defensa técnica, no promesas', desc: content['values.value1_desc'] || 'Aplicamos el Código Penal con rigor metodológico. Nunca prometemos resultados: le decimos lo que procede y lo que no.' },
        { icon: BookOpen, title: content['values.value2_title'] || 'Estudio permanente', desc: content['values.value2_desc'] || 'Nos actualizamos en jurisprudencia, reformas y doctrina. El derecho cambia, y nuestra práctica también.' },
        { icon: HeartHandshake, title: content['values.value3_title'] || 'Trato humano', desc: content['values.value3_desc'] || 'Detrás de cada caso hay una persona y una familia. Le escuchamos, le informamos y le acompañamos con respeto.' },
        { icon: Briefcase, title: content['values.value4_title'] || 'Tecnología al servicio del caso', desc: content['values.value4_desc'] || 'Motor de cálculo de penas, gestión documental, trazabilidad. Le entregamos cada actuación con fecha y firma.' },
      ],
    },
    commitments: [
      content['commitments.c1'] || 'Consulta inicial confidencial y sin compromiso',
      content['commitments.c2'] || 'Explicación clara de cada etapa procesal',
      content['commitments.c3'] || 'Honestidad sobre las expectativas reales del caso',
      content['commitments.c4'] || 'Presupuesto de honorarios por escrito',
      content['commitments.c5'] || 'Atención directa del abogado responsable',
      content['commitments.c6'] || 'Trazabilidad documental de cada actuación',
      content['commitments.c7'] || 'Coordinación interna entre áreas cuando su caso lo requiere',
      content['commitments.c8'] || 'Información actualizada sobre normativa y reformas',
    ],
  };
}

export default async function DespachoPage() {
  const contentMap = await getPageContent('despacho');
  const c = despachoContent(contentMap);

  const orgLd = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    '@id': `${site.url}/despacho#aboutpage`,
    name: `${site.name} — El Despacho`,
    url: `${site.url}/despacho`,
    description: `Bufete de abogados en ${site.address.city}, ${site.address.department}, Honduras. Más de 15 años de ejercicio profesional en defensa penal, familia, laboral, civil y mercantil.`,
    inLanguage: 'es-HN',
    isPartOf: { '@id': `${site.url}/#website` },
    about: { '@id': `${site.url}/#organization` },
    mainEntity: { '@id': `${site.url}/#organization` },
  };

  return (
    <>
      <Breadcrumbs items={[
        { label: 'Inicio', href: '/' },
        { label: 'El Despacho' },
      ]} />
      {/* HERO */}
      <PageHero
        eyebrow={c.hero.eyebrow}
        badge={c.hero.badge}
        title={c.hero.title}
        subtitle={c.hero.subtitle}
        cta={<CTAGroup variant="inverse" />}
        bgImage="/images/despacho/diosa-justicia.webp"
      />

      {/* TRUST BAR */}
      <TrustBar background="light" />

      {/* HERO CORPORATIVO */}
      {(() => {
        const heroImg = getCorporateImage('hero_despacho');
        return heroImg ? (
          <div className="relative aspect-[21/9] w-full overflow-hidden bg-primary">
            <Image
              src={heroImg}
              alt={`Interior del despacho ${site.name}`}
              fill
              sizes="100vw"
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-r from-primary/85 via-primary/55 to-transparent" aria-hidden="true" />
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center">
              <div className="max-w-2xl text-text-inverse">
                <p className="eyebrow-rule text-xxs font-bold uppercase tracking-eyebrow text-accent mb-3">
                  Sede del bufete
                </p>
                <h2 className="font-serif font-extrabold text-2xl md:text-3xl lg:text-4xl leading-tight text-balance">
                  Atención presencial en Nacaome, Valle
                </h2>
                <p className="mt-3 text-sm md:text-base text-text-inverse/85 leading-relaxed text-pretty">
                  {site.address.line1}, {site.address.line2}.
                  Le recibimos con cita previa para garantizar confidencialidad.
                </p>
              </div>
            </div>
          </div>
        ) : null;
      })()}

      {/* STATS + LIVE */}
      <Section background="muted" spacing="sm">
        <div className="grid lg:grid-cols-3 gap-4 items-stretch">
          <div className="lg:col-span-2">
            <StatsCounter />
          </div>
          <LiveOfficeStatus />
        </div>
      </Section>

      <BlogHighlights
        slugs={[
          'prescripcion-deudas-plazos-honduras',
          'estafas-fraudes-tipos-penales-honduras',
          'custodia-hijos-honduras-juez',
          'poder-legal-honduras-cuando-se-necesita',
        ]}
        eyebrow="Antes de su consulta"
        title="Temas que ya consultan en Google antes de contactar al despacho"
        subtitle="Estas guías concentran demanda orgánica real y ayudan a llegar a la primera consulta con mejor contexto, documentos y preguntas útiles."
        ctaLabel="Ver todas las guías del blog"
        ctaHref="/blog"
      />

      {/* MISSION */}
      <Section spacing="md">
        <div className="grid lg:grid-cols-2 gap-10 items-start">
          <div>
            <SectionHeader
              eyebrow="Misión"
              title={c.mision.title}
              subtitle={c.mision.desc}
            />
              <ul className="space-y-2.5 mt-5">
              {c.commitments.map((commitment, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-text leading-relaxed">
                  <CheckCircle2 size={16} className="text-success flex-shrink-0 mt-0.5" />
                  <span>{commitment}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-3">
            <Card padding="md" className="border-l-4 border-l-accent card-premium">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 rounded-lg bg-accent/15 text-accent-dark flex items-center justify-center border border-accent/30">
                  <Scale size={20} />
                </div>
                <div>
                  <p className="text-xxs font-bold uppercase tracking-widest text-accent-dark mb-1">
                    Visión
                  </p>
                  <p className="text-sm font-bold leading-tight text-text">{c.vision.title}</p>
                </div>
              </div>
              <p className="text-sm text-text leading-relaxed text-pretty">{c.vision.desc}</p>
            </Card>
            <Card padding="md" className="border-l-4 border-l-accent card-premium">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 rounded-lg bg-accent/15 text-accent-dark flex items-center justify-center border border-accent/30">
                  <HeartHandshake size={20} />
                </div>
                <div>
                  <p className="text-xxs font-bold uppercase tracking-widest text-accent-dark mb-1">
                    Valores
                  </p>
                  <p className="text-sm font-bold leading-tight text-text">Honestidad · Confidencialidad · Rigor técnico</p>
                </div>
              </div>
              <p className="text-sm text-text leading-relaxed">
                Honestidad · Confidencialidad · Rigor técnico · Respeto · Empatía · Discreción
              </p>
            </Card>
            <Card padding="md" className="border-l-4 border-l-primary card-premium">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center border border-primary/15">
                  <Award size={20} />
                </div>
                <div>
                  <p className="text-xxs font-bold uppercase tracking-widest text-primary mb-1">
                    Credenciales profesionales
                  </p>
                </div>
              </div>
              <p className="text-sm text-text leading-relaxed">
                Abogado colegiado en Honduras. Registro profesional vigente. Miembro del
                Colegio de Abogados de Honduras. Consulte en su primera visita la documentación
                que acredita nuestra habilitación profesional.
              </p>
            </Card>
            <Card padding="md" className="border-l-4 border-l-primary card-premium">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-11 h-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center border border-primary/15">
                  <Gavel size={20} />
                </div>
                <p className="text-xxs font-bold uppercase tracking-widest text-text-muted">
                  Especialidad destacada
                </p>
              </div>
              <p className="text-sm text-text leading-relaxed text-pretty">
                La defensa penal y procesal penal sigue siendo nuestro pilar histórico. Contamos
                con experiencia en asistencia a detenidos, audiencias iniciales, preliminares,
                juicio oral y recursos de casación.
              </p>
              <Link
                href="/derecho-penal"
                className="inline-flex items-center gap-1.5 mt-2 text-sm font-semibold text-accent-dark hover:text-primary transition-colors"
              >
                Consulte nuestra especialidad en defensa penal <ArrowRight size={14} />
              </Link>
            </Card>
          </div>
        </div>
      </Section>

      {/* VALUES */}
      <Section background="muted" spacing="md">
        <SectionHeader
          eyebrow="Nuestros valores"
          title={c.values.sectionTitle}
          subtitle="Cuatro principios que sostienen cada decisión, cada audiencia, cada escrito."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {c.values.items.map((v) => (
            <Card key={v.title} padding="md" className="h-full card-premium">
              <div className="flex flex-col items-center justify-center text-center h-full gap-3">
                <div className="w-11 h-11 rounded-lg bg-accent/15 text-accent-dark flex items-center justify-center flex-shrink-0 border border-accent/30">
                  <v.icon size={20} aria-hidden="true" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-text leading-tight text-balance">{v.title}</h3>
                  <p className="text-sm text-text-secondary mt-1.5 leading-relaxed text-pretty">{v.desc}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Section>

      {/* EQUIPO (placeholder honesto) */}
      <Section background="muted" spacing="md">
        <SectionHeader
          eyebrow="Equipo"
          title="Profesionales al servicio de su defensa"
          subtitle="La información pública del equipo se publica únicamente con consentimiento expreso de cada profesional, conforme al secreto profesional y a la Ley de Protección de Datos."
        />
        {(() => {
          const meetingImg = getCorporateImage('corporate_meeting');
          return meetingImg ? (
            <div className="relative aspect-[21/9] w-full overflow-hidden rounded-lg mb-6 border border-border-light">
              <Image
                src={meetingImg}
                alt="Reunión profesional del bufete"
                fill
                sizes="100vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/55 via-transparent to-transparent" aria-hidden="true" />
            </div>
          ) : null;
        })()}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Danilo Pineda Maradiaga — socio director (identidad pública).
              Su foto y nombre se exponen con su consentimiento expreso. */}
          <Card padding="md" className="card-premium border-accent/30 h-full flex flex-col">
            <div className="flex items-center gap-4">
              <div className="relative flex-shrink-0">
                <div className="absolute -inset-1.5 rounded-lg bg-accent/15 blur-xl" aria-hidden="true" />
                <div className="relative w-20 h-20 rounded-lg border border-accent/30 overflow-hidden bg-surface-alt">
                  <Image
                    src="/images/equipo/danilo-pineda-maradiaga.webp"
                    alt={FOUNDER_PROFILE.imageAltText ?? 'Danilo Pineda Maradiaga, abogado penalista en Nacaome, Valle (Honduras)'}
                    width={160}
                    height={160}
                    className="w-full h-full object-cover"
                    sizes="80px"
                  />
                </div>
              </div>
              <div>
                <p className="text-xxs font-bold uppercase tracking-widest text-accent-dark mb-1">
                  Dirección y defensa penal
                </p>
                <p className="font-serif font-bold text-base text-text leading-tight">
                  {FOUNDER_PROFILE.name}
                </p>
                <p className="text-sm text-text-secondary leading-snug mt-0.5">
                  {FOUNDER_PROFILE.jobTitle}
                </p>
              </div>
            </div>
            <p className="text-sm text-text-secondary mt-4 leading-relaxed text-pretty flex-1">
              Abogado responsable del bufete. Más de 15 años de ejercicio profesional.
              Litigante en audiencias iniciales, preliminares, de sobreseimiento y juicio
              oral en el departamento de Valle y zonas circunvecinas. La defensa penal es
              el pilar histórico del despacho.
            </p>
            <Link
              href="/derecho-penal"
              className="inline-flex items-center gap-1.5 mt-3 text-sm font-semibold text-accent-dark hover:text-primary transition-colors"
            >
              Ver especialidad en defensa penal <ArrowRight size={14} />
            </Link>
          </Card>

          {/* Thania Marlene Paz — socia fundadora (administrativo, familia,
              civil y notarial, mercantil y empresarial). */}
          <Card padding="md" className="card-premium border-accent/30 h-full flex flex-col">
            <div className="flex items-center gap-4">
              <div className="relative flex-shrink-0">
                <div className="absolute -inset-1.5 rounded-lg bg-accent/15 blur-xl" aria-hidden="true" />
                <div className="relative w-20 h-20 rounded-lg border border-accent/30 overflow-hidden bg-surface-alt">
                  <Image
                    src="/images/equipo/thania-marlene-paz.webp"
                    alt={THANIA_PROFILE.imageAltText}
                    width={160}
                    height={160}
                    className="w-full h-full object-cover"
                    sizes="80px"
                  />
                </div>
              </div>
              <div>
                <p className="text-xxs font-bold uppercase tracking-widest text-accent-dark mb-1">
                  Familia · Mercantil · Administrativo
                </p>
                <p className="font-serif font-bold text-base text-text leading-tight">
                  {THANIA_PROFILE.name}
                </p>
                <p className="text-sm text-text-secondary leading-snug mt-0.5">
                  {THANIA_PROFILE.jobTitle}
                </p>
              </div>
            </div>
            <p className="text-sm text-text-secondary mt-4 leading-relaxed text-pretty flex-1">
              Abogada socia fundadora del bufete. Especializada en derecho
              administrativo, familia, civil y notarial, y mercantil y empresarial.
              Atiende casos en Nacaome, Valle y la zona sur de Honduras.
            </p>
            <Link
              href="/servicios-juridicos/derecho-de-familia"
              className="inline-flex items-center gap-1.5 mt-3 text-sm font-semibold text-accent-dark hover:text-primary transition-colors"
            >
              Ver especialidad en derecho de familia <ArrowRight size={14} />
            </Link>
          </Card>

          {/* Emil Barahona — socio del bufete (laboral, penal, civil y notarial). */}
          <Card padding="md" className="card-premium border-accent/30 h-full flex flex-col">
            <div className="flex items-center gap-4">
              <div className="relative flex-shrink-0">
                <div className="absolute -inset-1.5 rounded-lg bg-accent/15 blur-xl" aria-hidden="true" />
                <div className="relative w-20 h-20 rounded-lg border border-accent/30 overflow-hidden bg-surface-alt">
                  <Image
                    src="/images/equipo/emil-barahona.webp"
                    alt={EMIL_PROFILE.imageAltText}
                    width={160}
                    height={160}
                    className="w-full h-full object-cover"
                    sizes="80px"
                  />
                </div>
              </div>
              <div>
                <p className="text-xxs font-bold uppercase tracking-widest text-accent-dark mb-1">
                  Laboral · Civil y Notarial
                </p>
                <p className="font-serif font-bold text-base text-text leading-tight">
                  {EMIL_PROFILE.name}
                </p>
                <p className="text-sm text-text-secondary leading-snug mt-0.5">
                  {EMIL_PROFILE.jobTitle}
                </p>
              </div>
            </div>
            <p className="text-sm text-text-secondary mt-4 leading-relaxed text-pretty flex-1">
              Abogado socio del bufete. Especializado en derecho laboral, civil y
              notarial. Atiende casos en Nacaome, Valle y la zona sur de Honduras.
            </p>
            <Link
              href="/servicios-juridicos/derecho-laboral"
              className="inline-flex items-center gap-1.5 mt-3 text-sm font-semibold text-accent-dark hover:text-primary transition-colors"
            >
              Ver especialidad en derecho laboral <ArrowRight size={14} />
            </Link>
          </Card>
        </div>
        <p className="text-xs text-text-muted text-center mt-6 italic max-w-2xl mx-auto">
          Por seguridad y ética profesional, el resto del equipo técnico —colaboradores,
          pasantes y apoyo administrativo— se identifica únicamente a los clientes con
          relación de servicio constituida, conforme al secreto profesional.
        </p>
      </Section>

      {/* CÓMO TRABAJAMOS */}
      <Section spacing="md">
        <SectionHeader
          eyebrow="Cómo trabajamos"
          title="Cuatro pasos para acompañarle en su caso"
          subtitle="Un método claro y trazable que aplicamos a todas las áreas del bufete, con la confidencialidad y el rigor técnico que su situación requiere."
        />
        <ProcessStepper
          steps={[
            { step: 1, title: 'Consulta inicial', desc: 'Evaluamos su caso de forma confidencial y le explicamos las opciones reales con honestidad, sea penal, civil, laboral o cualquier otra área.' },
            { step: 2, title: 'Estrategia legal', desc: 'Analizamos pruebas, normativa aplicable y diseñamos la estrategia jurídica óptima, identificando si requiere coordinación con otras áreas.' },
            { step: 3, title: 'Gestión y litigio', desc: 'Tramitamos su asunto con diligencia en sede administrativa, judicial o notarial, según corresponda. Le mantenemos informado en cada etapa.' },
            { step: 4, title: 'Cierre y seguimiento', desc: 'Le entregamos un informe claro del resultado y, si procede, los recursos o las actuaciones complementarias disponibles.' },
          ]}
          withConnector
        />
      </Section>

      {/* POR QUÉ MULTIDISCIPLINAR */}
      <Section background="primary" spacing="md">
        <div className="text-text-inverse">
          <SectionHeader
            eyebrow="Visión multidisciplinar"
            title="Su caso atendido por el área correcta, con apoyo del bufete completo"
            subtitle="La mayoría de los problemas jurídicos cruzan varias ramas del derecho. Un equipo coordinado es más rápido, más barato y más seguro que tratar cada frente por separado."
            invert
          />
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Gavel, title: 'Penal + familia + civil', desc: 'Acusaciones con repercusiones familiares y patrimoniales.' },
            { icon: Briefcase, title: 'Laboral + mercantil', desc: 'Despidos en empresas con contratos y sociedades cruzadas.' },
            { icon: Scale, title: 'Civil + tributario + bancario', desc: 'Embargos, cobros, contratos y obligaciones tributarias.' },
            { icon: BookOpen, title: 'Notarial + registral', desc: 'Compraventas, donaciones, sociedades y traspasos.' },
          ].map((it) => (
            <div key={it.title} className="rounded-lg border border-white/15 bg-white/10 p-4">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-lg bg-accent/20 text-accent flex items-center justify-center flex-shrink-0 border border-accent/30">
                  <it.icon size={20} aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-sm text-white leading-tight text-balance">{it.title}</h3>
                  <p className="text-sm text-white/85 leading-relaxed mt-1 text-pretty">{it.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link href="/servicios-juridicos" className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:text-text-inverse transition-colors">
            Ver las ramas principales del derecho <ArrowRight size={14} />
          </Link>
        </div>
      </Section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }}
      />
      <ConsultationCTA />
    </>
  );
}

