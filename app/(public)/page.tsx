import Link from 'next/link';
import type { Metadata } from 'next';
import {
  Scale,
  ShieldCheck,
  Users,
  FileText,
  HeartHandshake,
  Lock,
  BookOpen,
  MapPin,
  CheckCircle2,
  ArrowRight,
  Phone,
  MessageCircle,
  Calendar,
  Briefcase,
  Clock,
  Building2,
  Banknote,
  Landmark,
  Ship,
  HeartPulse,
  Globe,
  Lightbulb,
  Receipt,
  Leaf,
  Award,
} from 'lucide-react';
import { site, telHref, whatsappHref } from '@/lib/site';
import { Section, SectionHeader, Container } from '@/components/marketing/section';
import { CTAGroup, ContactStrip } from '@/components/marketing/cta-buttons';
import { Card } from '@/components/ui/card';
import { TestimonialsSection } from '@/components/marketing/testimonials-section';
import { areasGenerales } from '@/data/areas-juridicas';

export const metadata: Metadata = {
  title: `${site.name} — Bufete multidisciplinario en ${site.address.city}, ${site.address.department}`,
  description: site.description,
  alternates: { canonical: '/' },
};

const ICON_MAP: Record<string, typeof Scale> = {
  users: Users,
  briefcase: Briefcase,
  'file-text': FileText,
  'building-2': Building2,
  banknote: Banknote,
  landmark: Landmark,
  ship: Ship,
  'heart-pulse': HeartPulse,
  globe: Globe,
  lightbulb: Lightbulb,
  receipt: Receipt,
  leaf: Leaf,
  scale: Scale,
  gavel: Scale,
  shield: ShieldCheck,
};

const HIGHLIGHTED_AREAS = ['derecho-penal', 'derecho-de-familia', 'derecho-laboral', 'derecho-civil-y-notarial'];
const AREA_COLORS: Record<string, string> = {
  primary: 'bg-primary/10 text-primary border-primary/20',
  accent: 'bg-accent/15 text-accent-dark border-accent/25',
  success: 'bg-success/10 text-success border-success/20',
  warning: 'bg-warning/10 text-warning border-warning/20',
  muted: 'bg-border-light/50 text-text-secondary border-border-light',
  danger: 'bg-danger/10 text-danger border-danger/20',
};

function AreaIcon({ icono }: { icono: string }) {
  const Icon = ICON_MAP[icono] ?? Scale;
  return <Icon size={20} />;
}

const REAL_QUESTIONS = [
  { q: '¿Me pueden detener sin orden judicial?', badge: 'Penal' },
  { q: '¿Cuánto me corresponde si me despiden sin justa causa?', badge: 'Laboral' },
  { q: '¿Cómo tramito mi divorcio en Honduras?', badge: 'Familia' },
  { q: '¿Me puede embargar el banco si no pago?', badge: 'Bancario' },
  { q: '¿Necesito licencia ambiental para mi negocio?', badge: 'Ambiental' },
  { q: '¿Cuánto tarda el registro de una marca?', badge: 'Propiedad Intelectual' },
];

const PROCESS = [
  { step: 1, title: 'Consulta inicial', desc: 'Evaluamos su caso de forma confidencial y le explicamos las opciones reales con honestidad.' },
  { step: 2, title: 'Estrategia legal', desc: 'Analizamos pruebas, normativa aplicable y diseñamos la estrategia jurídica óptima para su caso.' },
  { step: 3, title: 'Gestión y litigio', desc: 'Tramitamos su asunto con diligencia. Actuamos en sede administrativa, judicial o notarial según corresponda.' },
  { step: 4, title: 'Cierre y seguimiento', desc: 'Le entregamos un informe claro del resultado y, si procede, los recursos disponibles.' },
];

const WHY = [
  { icon: Award, title: '13 áreas del derecho', desc: 'Cubrimos las principales ramas jurídicas bajo un mismo techo. Su caso encuentra el especialista adecuado.' },
  { icon: Lock, title: 'Confidencialidad estricta', desc: 'Toda comunicación está protegida por el secreto profesional desde el primer contacto.' },
  { icon: Clock, title: 'Atención 60 horas semanales', desc: 'Lunes a sábado de 7:00 a 20:00. Le respondemos el mismo día hábil.' },
  { icon: MapPin, title: 'Presencia local en Nacaome', desc: 'Conocemos el sistema de justicia del departamento de Valle y los juzgados de la zona sur.' },
  { icon: BookOpen, title: 'Códigos y reformas al día', desc: 'Trabajamos con la legislación vigente y sus reformas. Sin atajos, sin información desactualizada.' },
  { icon: Scale, title: 'Enfoque ético y prudente', desc: 'Nunca prometemos resultados. Le decimos lo que procede y lo que no, con honestidad.' },
  { icon: ShieldCheck, title: 'Defensa penal especializada', desc: 'Contamos con experiencia en derecho penal, desde asistencias a detenidos hasta recursos de casación.' },
  { icon: HeartHandshake, title: 'Lenguaje claro', desc: 'Le explicamos el proceso en términos comprensibles, sin tecnicismos innecesarios.' },
];

const FAQ = [
  {
    q: '¿Atienden casos urgentes fuera del horario?',
    a: 'Atendemos de lunes a sábado de 7:00 a 20:00. Para emergencias con persona detenida, contáctenos por WhatsApp y le orientaremos de inmediato durante el horario de atención.',
  },
  {
    q: '¿Cuánto cuesta una consulta jurídica?',
    a: 'Cada caso requiere análisis individual. Le informamos el alcance de los honorarios tras la consulta inicial, de forma clara y por escrito. Ofrecemos consulta confidencial sin compromiso.',
  },
  {
    q: '¿Puedo cambiar de abogado durante el proceso?',
    a: 'Sí. Usted puede revocar el poder a su abogado y designar a otro en cualquier momento. Le orientamos sobre los pasos a seguir.',
  },
  {
    q: '¿Trabajan con personas de otros departamentos?',
    a: 'Sí. Atendemos casos en todo el territorio nacional. Coordinamos las audiencias, diligencias y traslados según corresponda.',
  },
];

export default function HomePage() {
  const heroLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `${site.name} — Inicio`,
    url: site.url,
    inLanguage: 'es-HN',
  };
  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  return (
    <>
      {/* HERO */}
      <section className="relative bg-primary text-text-inverse overflow-hidden">
        <div className="absolute inset-0 opacity-8 pointer-events-none" aria-hidden="true">
          <div className="absolute -top-24 -right-24 w-[32rem] h-[32rem] rounded-full bg-accent/20 blur-[120px]" />
          <div className="absolute -bottom-24 -left-24 w-[28rem] h-[28rem] rounded-full bg-accent-dark/15 blur-[100px]" />
        </div>
        <Container size="lg" className="relative py-14 md:py-20 lg:py-24">
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            <div className="lg:col-span-7">
              <div className="flex flex-wrap items-center gap-2 mb-5">
                <span className="inline-flex items-center gap-1.5 bg-primary-light/50 border border-primary-light/30 rounded-full px-3 py-1">
                  <span className="w-2 h-2 rounded-full bg-success" aria-hidden="true" />
                  <span className="text-[11px] font-semibold tracking-wider uppercase text-text-inverse/85">Atendiendo ahora</span>
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-accent/15 border border-accent/20">
                  <span className="text-[11px] font-bold tracking-wider text-accent">13 áreas del derecho</span>
                </span>
              </div>
              <h1 className="font-serif font-extrabold text-3xl sm:text-4xl lg:text-5xl xl:text-6xl leading-[1.08] text-text-inverse">
                <span className="block">13 áreas del derecho,</span>
                <span className="block text-accent mt-1">un solo bufete</span>
              </h1>
              <p className="mt-5 text-base md:text-lg text-text-inverse/85 leading-relaxed max-w-2xl">
                En {site.address.city}, {site.address.department}. Defensa penal especializada y asesoría
                integral en familia, laboral, civil, mercantil, tributario y más. Atención personal con
                rigor técnico y confidencialidad.
              </p>
              <div className="flex flex-wrap gap-x-6 gap-y-2 mt-6">
                <span className="inline-flex items-center gap-1.5 text-[13px] text-text-inverse/80">
                  <CheckCircle2 size={14} className="text-accent" /> Consulta confidencial
                </span>
                <span className="inline-flex items-center gap-1.5 text-[13px] text-text-inverse/80">
                  <CheckCircle2 size={14} className="text-accent" /> Atención lun-sáb
                </span>
                <span className="inline-flex items-center gap-1.5 text-[13px] text-text-inverse/80">
                  <CheckCircle2 size={14} className="text-accent" /> Especialistas multidisciplinarios
                </span>
              </div>
              <CTAGroup variant="inverse" className="mt-7" />
            </div>
            <div className="lg:col-span-5">
              <Card padding="md" className="bg-surface text-text border-accent/30 border-2 shadow-2xl">
                <div className="flex items-center gap-2 mb-3">
                  <Phone size={16} className="text-primary" />
                  <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Contacto directo</p>
                </div>
                <a href={telHref()} className="block text-2xl md:text-3xl font-extrabold text-primary tabular-nums leading-tight hover:text-primary-light transition-colors">
                  {site.phoneDisplay}
                </a>
                <p className="text-[13px] text-text-secondary mt-1">{site.hours}</p>
                <div className="border-t border-border-light my-4" />
                <a
                  href={whatsappHref('Hola, necesito una consulta jurídica.')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-md bg-success/10 hover:bg-success/15 transition-colors"
                >
                  <div className="w-9 h-9 rounded-md bg-success flex items-center justify-center flex-shrink-0">
                    <MessageCircle size={16} className="text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-bold text-success">WhatsApp directo</p>
                    <p className="text-[11px] text-text-secondary">Respuesta durante horario de atención</p>
                  </div>
                </a>
                <Link
                  href="/solicitar-consulta"
                  className="mt-3 flex items-center gap-3 p-3 rounded-md bg-aggravation/10 hover:bg-aggravation/15 transition-colors"
                >
                  <div className="w-9 h-9 rounded-md bg-aggravation flex items-center justify-center flex-shrink-0">
                    <Calendar size={16} className="text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-bold text-aggravation">Formulario confidencial</p>
                    <p className="text-[11px] text-text-secondary">Le respondemos en horario hábil</p>
                  </div>
                </Link>
                <div className="border-t border-border-light my-4" />
                <div className="flex items-start gap-2 text-[12px] text-text-secondary">
                  <MapPin size={14} className="text-accent-dark flex-shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{site.address.line1}, {site.address.line2}</span>
                </div>
              </Card>
            </div>
          </div>
        </Container>
      </section>

      {/* STATS MARQUEE */}
      <div className="bg-primary-dark border-y border-primary-light/20 overflow-hidden">
        <div className="flex animate-scroll-x py-3 md:py-4">
          {[...Array(2)].map((_, group) => (
            <div key={group} className="flex items-center gap-10 md:gap-16 shrink-0 px-5 md:px-8">
              <div className="flex items-center gap-2 shrink-0">
                <Award size={16} className="text-accent shrink-0" />
                <span className="text-[13px] md:text-sm text-text-inverse/80 whitespace-nowrap tabular-nums">
                  <strong className="text-accent">+15</strong> años de ejercicio
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <CheckCircle2 size={16} className="text-accent shrink-0" />
                <span className="text-[13px] md:text-sm text-text-inverse/80 whitespace-nowrap tabular-nums">
                  <strong className="text-accent">+500</strong> casos atendidos
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Scale size={16} className="text-accent shrink-0" />
                <span className="text-[13px] md:text-sm text-text-inverse/80 whitespace-nowrap tabular-nums">
                  <strong className="text-accent">13</strong> áreas de práctica
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Clock size={16} className="text-accent shrink-0" />
                <span className="text-[13px] md:text-sm text-text-inverse/80 whitespace-nowrap tabular-nums">
                  <strong className="text-accent">60h</strong> /semana de atención
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* REAL QUESTIONS */}
      <Section spacing="md" ariaLabel="Preguntas reales">
        <SectionHeader
          eyebrow="¿Tiene un problema legal y no sabe cómo actuar?"
          title="Las preguntas que nos hacen a diario"
          subtitle="Respondemos con honestidad, sin importar el área del derecho. Si su pregunta no aparece aquí, escríbanos."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {REAL_QUESTIONS.map((item, i) => (
            <Card key={i} padding="sm" className="h-full hover:border-accent/50 transition-colors">
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-full bg-primary text-text-inverse flex items-center justify-center text-[12px] font-bold flex-shrink-0">
                  {i + 1}
                </div>
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold text-text leading-snug">{item.q}</p>
                  <span className="inline-block mt-1.5 text-[10px] font-bold uppercase tracking-wider text-accent-dark">
                    {item.badge}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link href="/preguntas-frecuentes" className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-primary hover:text-accent-dark transition-colors">
            Ver todas las preguntas frecuentes <ArrowRight size={14} />
          </Link>
        </div>
      </Section>

      {/* ÁREAS DESTACADAS */}
      <Section background="muted" spacing="md" ariaLabel="Áreas destacadas">
        <SectionHeader
          eyebrow="Especialidades principales"
          title="Cuatro áreas con presencia constante"
          subtitle="Derecho penal, familia, laboral y civil son nuestras áreas de mayor demanda. Cada una con equipo y experiencia dedicados."
        />
        <div className="grid md:grid-cols-2 gap-4">
          {areasGenerales
            .filter((a) => HIGHLIGHTED_AREAS.includes(a.slug))
            .map((area) => {
              const colorClass = AREA_COLORS[area.color] ?? AREA_COLORS.primary;
              const areaSlug = area.slug === 'derecho-penal' ? '/derecho-penal' : `/areas-juridicas/${area.slug}`;
              return (
                <Link key={area.slug} href={areaSlug} className="group block focus-visible:outline-none rounded-md">
                  <Card padding="md" className="h-full group-hover:border-accent group-hover:shadow-md transition-all">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-lg border flex items-center justify-center shrink-0 ${colorClass}`}>
                        <AreaIcon icono={area.icono} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-[15px] text-text leading-tight">{area.titulo}</h3>
                        <p className="text-[13px] text-text-secondary mt-1.5 leading-relaxed">{area.resumen}</p>
                        <span className="inline-flex items-center gap-1 mt-2 text-[12px] font-semibold text-accent-dark group-hover:text-primary transition-colors">
                          Ver servicios <ArrowRight size={12} />
                        </span>
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
        </div>
      </Section>

      {/* 13 ÁREAS BENTO GRID */}
      <Section spacing="md" ariaLabel="Todas las áreas jurídicas">
        <SectionHeader
          eyebrow="Cobertura integral"
          title="Las 13 áreas del derecho que manejamos"
          subtitle="Del derecho penal a la conciliación y arbitraje. Todas las ramas jurídicas que su caso pueda requerir, en un solo bufete."
        />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {areasGenerales.map((area) => {
            const colorClass = AREA_COLORS[area.color] ?? AREA_COLORS.primary;
            const areaSlug = area.slug === 'derecho-penal' ? '/derecho-penal' : `/areas-juridicas/${area.slug}`;
            return (
              <Link key={area.slug} href={areaSlug} className="group block focus-visible:outline-none">
                <Card padding="sm" className="h-full group-hover:border-accent/60 group-hover:shadow-sm transition-all text-center">
                  <div className={`w-10 h-10 rounded-lg border mx-auto flex items-center justify-center ${colorClass} group-hover:scale-105 transition-transform`}>
                    <AreaIcon icono={area.icono} />
                  </div>
                  <h3 className="mt-2 text-[12px] font-bold text-text leading-tight">{area.titulo}</h3>
                </Card>
              </Link>
            );
          })}
        </div>
        <div className="mt-8 text-center">
          <Link href="/areas-juridicas" className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-primary hover:text-accent-dark transition-colors">
            Explorar todas las áreas <ArrowRight size={14} />
          </Link>
        </div>
      </Section>

      {/* TESTIMONIOS */}
      <TestimonialsSection
        title="Lo que dicen quienes confían en nosotros"
        subtitle="Casos reales, resultados honestos. Publicamos con autorización y anonimizamos por confidencialidad."
        columns={3}
        items={[
          {
            name: 'Caso anonimizado · Defensa penal',
            rating: 5,
            body: 'Mi familia y yo estábamos pasando por una situación muy difícil. El equipo nos orientó desde el primer día con claridad y profesionalismo. Logramos una resolución favorable que no esperábamos.',
            date: '2025',
            source: 'CASO ANONIMIZADO',
          },
          {
            name: 'Caso anonimizado · Derecho laboral',
            rating: 5,
            body: 'Me despidieron sin previo aviso después de 8 años en la empresa. Los abogados calcularon cada prestación y lograron que me pagaran lo que me correspondía. Muy agradecido.',
            date: '2025',
            source: 'CASO ANONIMIZADO',
          },
          {
            name: 'Caso anonimizado · Derecho de familia',
            rating: 5,
            body: 'Un proceso de divorcio complicado con hijos de por medio. La abogada fue muy sensible pero firme. Se logró un acuerdo que protege a mis hijos. Recomiendo totalmente.',
            date: '2024',
            source: 'CASO ANONIMIZADO',
          },
        ]}
      />

      {/* PROCESS */}
      <Section spacing="md" ariaLabel="Proceso de atención">
        <SectionHeader
          eyebrow="Cómo trabajamos"
          title="Cuatro pasos, sin importar el área"
          subtitle="Un método claro y trazable para cada caso, desde la consulta inicial hasta el cierre."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {PROCESS.map((p) => (
            <Card key={p.step} padding="md" className="h-full">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-primary text-text-inverse flex items-center justify-center text-[13px] font-extrabold flex-shrink-0">
                  {p.step}
                </div>
                <h3 className="font-bold text-[14px] text-text leading-tight">{p.title}</h3>
              </div>
              <p className="text-[13px] text-text-secondary leading-relaxed">{p.desc}</p>
            </Card>
          ))}
        </div>
      </Section>

      {/* WHY US */}
      <Section background="primary" spacing="md" ariaLabel="Por qué elegirnos">
        <div className="text-text-inverse">
          <SectionHeader
            eyebrow="Por qué elegirnos"
            title="Ocho razones que hacen la diferencia"
            subtitle="Nuestra práctica se sostiene sobre principios técnicos, no sobre promesas."
            invert
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {WHY.map((w) => (
            <div key={w.title} className="rounded-md border border-primary-light/40 bg-primary-light/20 p-4 backdrop-blur-sm">
              <w.icon size={22} className="text-accent mb-2" aria-hidden="true" />
              <h3 className="font-bold text-[14px] text-text-inverse leading-tight">{w.title}</h3>
              <p className="text-[12px] text-text-inverse/80 leading-relaxed mt-1.5">{w.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* CONTACT STRIP */}
      <Section spacing="md" ariaLabel="Canales de contacto">
        <SectionHeader
          eyebrow="Contáctenos"
          title="Cuatro canales, una sola atención"
          subtitle="Elija el que prefiera. Le respondemos en horario hábil y con la confidencialidad que su caso requiere."
        />
        <ContactStrip />
      </Section>

      {/* UBICACIÓN */}
      <Section background="muted" spacing="md" ariaLabel="Ubicación">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          <div>
            <SectionHeader
              eyebrow="Dónde estamos"
              title="Nacaome, Valle — Honduras"
              subtitle="Visítenos con cita previa. Estaremos encantados de recibirle."
            />
            <Card padding="md">
              <ul className="space-y-3 text-[14px]">
                <li className="flex items-start gap-3">
                  <MapPin size={18} className="text-accent-dark flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-text">{site.address.line1}</p>
                    <p className="text-text-secondary">{site.address.line2}</p>
                    <p className="text-text-secondary">{site.address.city}, {site.address.department}, {site.address.country}</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Phone size={18} className="text-accent-dark flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-text">Teléfono</p>
                    <a href={telHref()} className="text-primary hover:underline tabular-nums">{site.phoneDisplay}</a>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Clock size={18} className="text-accent-dark flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-text">Horario</p>
                    <p className="text-text-secondary">{site.hours}</p>
                  </div>
                </li>
              </ul>
              <Link href="/como-llegar" className="inline-flex items-center gap-1.5 mt-4 text-[13px] font-semibold text-primary hover:text-accent-dark">
                Ver indicaciones para llegar <ArrowRight size={14} />
              </Link>
            </Card>
          </div>
          <div>
            <Card padding="none" className="overflow-hidden aspect-[4/3] bg-surface-alt flex items-center justify-center">
              <div className="text-center p-6">
                <MapPin size={36} className="text-accent-dark mx-auto mb-3" aria-hidden="true" />
                <p className="font-bold text-text">Mapa interactivo</p>
                <p className="text-[12px] text-text-secondary mt-1.5 max-w-xs mx-auto leading-relaxed">
                  Próximamente: mapa embebido con coordenadas exactas del bufete.
                </p>
                <Link href="/como-llegar" className="inline-flex items-center gap-1.5 mt-3 text-[12px] font-semibold text-primary">
                  Cómo llegar <ArrowRight size={12} />
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </Section>

      {/* FAQ */}
      <Section spacing="md" ariaLabel="Preguntas frecuentes">
        <div className="grid lg:grid-cols-3 gap-8">
          <div>
            <SectionHeader
              eyebrow="FAQ"
              title="Respuestas a sus dudas"
              subtitle="Las preguntas que más recibimos. Si tiene una diferente, escríbanos."
            />
            <Link href="/preguntas-frecuentes" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary hover:text-accent-dark">
              Ver todas las preguntas <ArrowRight size={14} />
            </Link>
          </div>
          <div className="lg:col-span-2 space-y-3">
            {FAQ.map((f, i) => (
              <details
                key={i}
                className="group rounded-md border border-border-light bg-surface open:border-accent/40"
              >
                <summary className="cursor-pointer list-none p-4 flex items-center justify-between gap-3">
                  <h3 className="font-semibold text-[14px] text-text leading-snug">{f.q}</h3>
                  <span className="w-6 h-6 rounded-full bg-surface-alt group-open:bg-accent/15 flex items-center justify-center flex-shrink-0 transition-colors">
                    <ArrowRight size={12} className="text-text-secondary group-open:rotate-90 transition-transform" />
                  </span>
                </summary>
                <div className="px-4 pb-4 -mt-1 text-[13px] text-text-secondary leading-relaxed">{f.a}</div>
              </details>
            ))}
          </div>
        </div>
      </Section>

      {/* CTA FINAL */}
      <Section background="primary" spacing="md" ariaLabel="Solicitar consulta">
        <div className="text-center max-w-2xl mx-auto text-text-inverse">
          <h2 className="font-serif font-extrabold text-2xl md:text-3xl lg:text-4xl leading-tight">
            ¿Listo para hablar con un abogado?
          </h2>
          <p className="mt-4 text-text-inverse/85 text-[15px] md:text-base leading-relaxed">
            La primera consulta es confidencial. Le escuchamos, evaluamos su caso y le explicamos con honestidad las opciones reales, sin importar el área del derecho que necesite.
          </p>
          <CTAGroup variant="inverse" className="mt-7 justify-center" />
        </div>
      </Section>

      {/* Schema.org JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(heroLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
    </>
  );
}
