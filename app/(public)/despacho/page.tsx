import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Scale,
  ShieldCheck,
  Briefcase,
  GraduationCap,
  BookOpen,
  HeartHandshake,
  ArrowRight,
  CheckCircle2,
  Gavel,
} from 'lucide-react';
import { site } from '@/lib/site';
import { Section, SectionHeader } from '@/components/marketing/section';
import { CTAGroup, ContactStrip } from '@/components/marketing/cta-buttons';
import { Card } from '@/components/ui/card';
import { LiveOfficeStatus, StatsCounter } from '@/components/marketing/live-widgets';
import { PageHero } from '@/components/marketing/page-hero';
import { TrustBar } from '@/components/marketing/trust-bar';
import { ProcessStepper } from '@/components/marketing/process-stepper';

export const metadata: Metadata = {
  title: `El Despacho — Bufete multidisciplinar en ${site.address.city}`,
  description: `Conoce ${site.name}: bufete multidisciplinar con sede en Nacaome, Valle. 13 áreas del derecho, defensa penal como especialidad destacada, y un equipo técnico al servicio de su caso en todo el sur de Honduras.`,
  alternates: { canonical: '/despacho' },
};

const VALUES = [
  {
    icon: ShieldCheck,
    title: 'Defensa técnica, no promesas',
    desc: 'Aplicamos el Código Penal con rigor metodológico. Nunca prometemos resultados: le decimos lo que procede y lo que no.',
  },
  {
    icon: BookOpen,
    title: 'Estudio permanente',
    desc: 'Nos actualizamos en jurisprudencia, reformas y doctrina. El derecho cambia, y nuestra práctica también.',
  },
  {
    icon: HeartHandshake,
    title: 'Trato humano',
    desc: 'Detrás de cada caso hay una persona y una familia. Le escuchamos, le informamos y le acompañamos con respeto.',
  },
  {
    icon: Briefcase,
    title: 'Tecnología al servicio del caso',
    desc: 'Motor de cálculo de penas, gestión documental, trazabilidad. Le entregamos cada actuación con fecha y firma.',
  },
];

const TIMELINE = [
  { year: '2010', title: 'Inicio del ejercicio', desc: 'Apertura del bufete en Nacaome, Valle, con atención inicial en derecho penal y procesal penal.' },
  { year: '2014', title: 'Consolidación regional', desc: 'Asumimos defensas y asesorías en todo el departamento de Valle y zonas aledañas de Choluteca y La Paz.' },
  { year: '2018', title: 'Reforma al Código Penal', desc: 'Incorporamos el Decreto 130-2017 a nuestra práctica y desarrollamos el primer motor interno de cálculo de penas.' },
  { year: '2022', title: 'Transformación digital', desc: 'Lanzamos plataforma de gestión de casos, biblioteca jurídica y motor técnico de penas.' },
  { year: '2026', title: 'Bufete multidisciplinar', desc: 'Ampliamos a 13 áreas del derecho y abrimos este portal para que la ciudadanía conozca nuestros servicios y ejerza su defensa.' },
];

const COMMITMENTS = [
  'Consulta inicial confidencial y sin compromiso',
  'Explicación clara de cada etapa procesal',
  'Honestidad sobre las expectativas reales del caso',
  'Presupuesto de honorarios por escrito',
  'Atención directa del abogado responsable',
  'Trazabilidad documental de cada actuación',
  'Coordinación interna entre áreas cuando su caso lo requiere',
  'Información actualizada sobre normativa y reformas',
];

export default function DespachoPage() {
  const orgLd = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: `${site.name} — El Despacho`,
    url: `${site.url}/despacho`,
    inLanguage: 'es-HN',
  };

  return (
    <>
      {/* HERO */}
      <PageHero
        eyebrow="El Despacho"
        badge="Multidisciplinar"
        title="13 áreas del derecho, una sola firma en el sur de Honduras"
        subtitle={
          <>
            {site.name} es un bufete multidisciplinar con sede en Nacaome, Valle. La defensa
            penal —nuestra especialidad fundacional— sigue siendo uno de nuestros pilares
            principales, y la acompañamos con asesoría integral en familia, laboral, civil,
            mercantil, tributario, notarial y más. Trabajamos con técnica, prudencia y cercanía
            humana para quien requiere defensa y orientación jurídica seria en Honduras.
          </>
        }
        cta={<CTAGroup variant="inverse" />}
      />

      {/* TRUST BAR */}
      <TrustBar background="light" />

      {/* STATS + LIVE */}
      <Section background="muted" spacing="sm">
        <div className="grid lg:grid-cols-3 gap-4 items-stretch">
          <div className="lg:col-span-2">
            <StatsCounter />
          </div>
          <LiveOfficeStatus />
        </div>
      </Section>

      {/* MISSION */}
      <Section spacing="md">
        <div className="grid lg:grid-cols-2 gap-10 items-start">
          <div>
            <SectionHeader
              eyebrow="Misión"
              title="Defender con técnica, servir con humanidad"
              subtitle="Nuestra razón de ser es garantizar que toda persona acceda a una defensa y orientación jurídica seria, técnica y respetuosa de sus derechos, en cualquiera de las áreas que atendemos."
            />
            <ul className="space-y-2.5 mt-5">
              {COMMITMENTS.map((c, i) => (
                <li key={i} className="flex items-start gap-2.5 text-[14px] text-text leading-relaxed">
                  <CheckCircle2 size={16} className="text-success flex-shrink-0 mt-0.5" />
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-3">
            <Card padding="md" className="bg-primary text-text-inverse card-premium">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-md bg-accent/20 flex items-center justify-center">
                  <Scale size={22} className="text-accent" />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-accent">
                    Visión
                  </p>
                  <p className="text-[15px] font-bold leading-tight">Justicia accesible y técnica</p>
                </div>
              </div>
              <p className="text-[14px] text-text-inverse/90 leading-relaxed text-pretty">
                Aspiramos a un sistema de justicia donde cada persona, en Nacaome y en el sur de
                Honduras, pueda ejercer su derecho a la defensa y a la asesoría legal con un
                equipo que domine la técnica, explique con claridad y actúe con prudencia.
              </p>
            </Card>
            <Card padding="md" className="border-l-4 border-l-accent card-premium">
              <p className="text-[11px] font-bold uppercase tracking-widest text-accent-dark mb-1">
                Valores
              </p>
              <p className="text-[14px] text-text leading-relaxed">
                Honestidad · Confidencialidad · Rigor técnico · Respeto · Empatía · Discreción
              </p>
            </Card>
            <Card padding="md" className="border-l-4 border-l-primary card-premium">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                  <Gavel size={18} />
                </div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-text-muted">
                  Especialidad destacada
                </p>
              </div>
              <p className="text-[14px] text-text leading-relaxed text-pretty">
                La defensa penal y procesal penal sigue siendo nuestro pilar histórico. Contamos
                con experiencia en asistencia a detenidos, audiencias iniciales, preliminares,
                juicio oral y recursos de casación.
              </p>
            </Card>
          </div>
        </div>
      </Section>

      {/* VALUES */}
      <Section background="muted" spacing="md">
        <SectionHeader
          eyebrow="Nuestros valores"
          title="Lo que nos define como bufete"
          subtitle="Cuatro principios que sostienen cada decisión, cada audiencia, cada escrito."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {VALUES.map((v) => (
            <Card key={v.title} padding="md" className="h-full card-premium">
              <div className="w-11 h-11 rounded-md bg-accent/15 text-accent-dark flex items-center justify-center mb-3 border border-accent/30">
                <v.icon size={20} aria-hidden="true" />
              </div>
              <h3 className="font-bold text-[15px] text-text leading-tight text-balance">{v.title}</h3>
              <p className="text-[13px] text-text-secondary mt-2 leading-relaxed text-pretty">{v.desc}</p>
            </Card>
          ))}
        </div>
      </Section>

      {/* TIMELINE */}
      <Section spacing="md">
        <SectionHeader
          eyebrow="Nuestra historia"
          title="De la defensa en sala a la transformación digital"
          subtitle="Una trayectoria construida caso a caso, con la confianza de quienes nos eligieron."
        />
        <ol className="relative border-l-2 border-accent/30 ml-3 space-y-6">
          {TIMELINE.map((t) => (
            <li key={t.year} className="ml-6 relative">
              <span className="absolute -left-[33px] top-0 w-4 h-4 rounded-full bg-accent border-4 border-background" />
              <Card padding="sm" className="border-l-4 border-l-accent card-premium">
                <p className="text-[12px] font-bold uppercase tracking-widest text-accent-dark">
                  {t.year}
                </p>
                <h3 className="font-bold text-[15px] text-text mt-0.5">{t.title}</h3>
                <p className="text-[13px] text-text-secondary mt-1.5 leading-relaxed text-pretty">
                  {t.desc}
                </p>
              </Card>
            </li>
          ))}
        </ol>
      </Section>

      {/* EQUIPO (placeholder honesto) */}
      <Section background="muted" spacing="md">
        <SectionHeader
          eyebrow="Equipo"
          title="Profesionales al servicio de su defensa"
          subtitle="La información pública del equipo se publica únicamente con consentimiento expreso de cada profesional, conforme al secreto profesional y a la Ley de Protección de Datos."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              rol: 'Dirección y defensa penal',
              desc: 'Abogado responsable del bufete. Litigante en audiencias iniciales, preliminares, de sobreseimiento y juicio oral en el departamento de Valle y zonas circunvecinas.',
            },
            {
              rol: 'Apoyo técnico y multidisciplinar',
              desc: 'Asistencia en la preparación de escritos, recursos, cálculo técnico de penas y coordinación con las distintas áreas del bufete que su caso pueda requerir.',
            },
          ].map((p) => (
            <Card key={p.rol} padding="md" className="card-premium">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-primary text-text-inverse flex items-center justify-center font-bold text-lg flex-shrink-0">
                  <GraduationCap size={22} />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-text-muted">
                    {p.rol}
                  </p>
                  <p className="text-[14px] font-semibold text-text leading-tight">
                    Identidad reservada
                  </p>
                </div>
              </div>
              <p className="text-[13px] text-text-secondary mt-3 leading-relaxed text-pretty">
                {p.desc}
              </p>
            </Card>
          ))}
        </div>
        <p className="text-[12px] text-text-muted text-center mt-6 italic max-w-2xl mx-auto">
          Por seguridad y ética profesional, la identidad completa de los profesionales
          se revela únicamente a clientes con relación de servicio constituida.
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
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { icon: Gavel, title: 'Penal + familia + civil', desc: 'Acusaciones con repercusiones familiares y patrimoniales.' },
            { icon: Briefcase, title: 'Laboral + mercantil', desc: 'Despidos en empresas con contratos y sociedades cruzadas.' },
            { icon: Scale, title: 'Civil + tributario + bancario', desc: 'Embargos, cobros, contratos y obligaciones tributarias.' },
            { icon: BookOpen, title: 'Notarial + registral', desc: 'Compraventas, donaciones, sociedades y traspasos.' },
          ].map((it) => (
            <div key={it.title} className="rounded-md border border-primary-light/40 bg-primary-light/20 p-4 backdrop-blur-sm card-premium">
              <it.icon size={22} className="text-accent mb-2" aria-hidden="true" />
              <h3 className="font-bold text-[14px] text-text-inverse leading-tight text-balance">{it.title}</h3>
              <p className="text-[12px] text-text-inverse/80 leading-relaxed mt-1.5 text-pretty">{it.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link href="/areas-juridicas" className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-accent hover:text-text-inverse transition-colors">
            Ver las 13 áreas del bufete <ArrowRight size={14} />
          </Link>
        </div>
      </Section>

      {/* CONTACT STRIP */}
      <Section spacing="md">
        <SectionHeader
          eyebrow="Hable con nosotros"
          title="Estamos disponibles para escucharle"
        />
        <ContactStrip />
        <div className="mt-8 text-center">
          <Link
            href="/solicitar-consulta"
            className="inline-flex items-center gap-2 h-12 px-6 rounded-md bg-primary text-text-inverse text-base font-bold hover:bg-primary-light transition-colors"
          >
            Solicitar consulta confidencial <ArrowRight size={18} />
          </Link>
        </div>
      </Section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }}
      />
    </>
  );
}
