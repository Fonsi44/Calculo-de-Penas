import Link from 'next/link';
import type { Metadata } from 'next';
import {
  Scale,
  ShieldCheck,
  HeartHandshake,
  BookOpen,
  MapPin,
  CheckCircle2,
  ArrowRight,
  Phone,
  MessageCircle,
  Calendar,
  Briefcase,
  Clock,
  Gavel,
  Handshake,
  Building,
  BriefcaseBusiness,
  Users,
  Landmark,
} from 'lucide-react';
import { site, telHref, whatsappHref } from '@/lib/site';
import { Section, SectionHeader, Container } from '@/components/marketing/section';
import { CTAGroup, ContactStrip } from '@/components/marketing/cta-buttons';
import { Card } from '@/components/ui/card';
import { TestimonialsSection } from '@/components/marketing/testimonials-section';
import { MapEmbed } from '@/components/marketing/map-embed';
import { areasGenerales } from '@/data/areas-juridicas';
import { TrustBar } from '@/components/marketing/trust-bar';
import { HeroOfficeBadge } from '@/components/marketing/live-widgets';
import { ProcessStepper } from '@/components/marketing/process-stepper';
import { ServiceCard } from '@/components/marketing/service-card';
import type { PlaceholderTone } from '@/components/marketing/placeholder-photo';

export const metadata: Metadata = {
  title: `${site.name} — Bufete multidisciplinario en ${site.address.city}, ${site.address.department}`,
  description: site.description,
  alternates: { canonical: '/' },
};

const HIGHLIGHTED_AREAS = ['derecho-penal', 'derecho-de-familia', 'derecho-laboral', 'derecho-civil-y-notarial'];

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
  { icon: MapPin, title: 'Presencia local en Nacaome', desc: 'Conocemos el sistema de justicia del departamento de Valle y los juzgados de la zona sur.' },
  { icon: Scale, title: 'Enfoque ético y prudente', desc: 'Nunca prometemos resultados. Le decimos lo que procede y lo que no, con honestidad.' },
  { icon: ShieldCheck, title: 'Defensa penal especializada', desc: 'Experiencia en derecho penal, desde asistencias a detenidos hasta recursos de casación.' },
  { icon: HeartHandshake, title: 'Lenguaje claro', desc: 'Le explicamos el proceso en términos comprensibles, sin tecnicismos innecesarios.' },
  { icon: BookOpen, title: 'Metodología documentada', desc: 'Cada actuación queda registrada y trazable. Trabajamos con procesos internos auditables.' },
];

const FAQ = [
  {
    q: '¿Atienden casos urgentes fuera del horario?',
    a: 'Atendemos de lunes a sábado de 7:00 a 20:00. Para emergencias con persona detenida, contáctenos por WhatsApp y le orientaremos de inmediato durante el horario de atención.',
  },
  {
    q: '¿Qué documentos necesito para la primera consulta?',
    a: 'Identificación oficial, documentos relacionados con su caso (contratos, notificaciones, actas) y cualquier prueba que considere relevante. Nosotros le orientaremos sobre lo que hace falta.',
  },
  {
    q: '¿Qué debo hacer si recibo una citación judicial?',
    a: 'No la ignore. Contacte a un abogado de inmediato. Una citación tiene plazos que corren y, si no se atiende, puede generar sanciones o perjudicar su defensa.',
  },
  {
    q: '¿Ofrecen asesoría preventiva para empresas?',
    a: 'Sí. Asesoramos en cumplimiento normativo, contratos, gobierno corporativo y prevención de contingencias laborales, tributarias y mercantiles antes de que surja el conflicto.',
  },
  {
    q: '¿Pueden llevar mi caso penal y mi caso laboral a la vez?',
    a: 'Sí. De hecho, esa coordinación es una de las ventajas de un bufete multidisciplinar. Analizamos su situación de manera global para evitar que una decisión en un frente afecte a otro.',
  },
  {
    q: '¿Qué pasa si mi problema involucra varias áreas del derecho?',
    a: 'Convocamos al especialista de cada área implicada, definimos una estrategia común y unificamos el expediente. Usted recibe una sola línea de comunicación, no varias.',
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
        {/* Capas de fondo no fotográficas: grid sutil + halos dorados radiales. */}
        <div className="absolute inset-0 pointer-events-none bg-grid opacity-50" aria-hidden="true" />
        <div className="absolute inset-0 opacity-95 pointer-events-none" aria-hidden="true">
          <div className="absolute -top-24 -right-24 w-[32rem] h-[32rem] rounded-full bg-accent/20 blur-[120px]" />
          <div className="absolute -bottom-24 -left-24 w-[28rem] h-[28rem] rounded-full bg-accent-dark/15 blur-[100px]" />
        </div>
        <div
          className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-accent/20 to-transparent pointer-events-none"
          aria-hidden="true"
        />
        <Container size="lg" className="relative py-14 md:py-20 lg:py-24">
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            <div className="lg:col-span-7">
              <div className="flex flex-wrap items-center gap-2 mb-5">
                <HeroOfficeBadge />
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary-light/40 border border-primary-light/30 text-text-inverse/85">
                  <span className="text-xxs font-bold tracking-wider">Asesoría integral</span>
                </span>
              </div>
              <h1 className="font-serif font-extrabold text-3xl sm:text-4xl lg:text-5xl xl:text-6xl leading-tighter text-text-inverse text-balance">
                <span className="block">Defensa penal y asesoría jurídica</span>
                <span className="block text-gradient-accent mt-1">en Nacaome y todo Honduras</span>
              </h1>
              <p className="mt-5 text-base md:text-lg text-text-inverse/85 leading-relaxed max-w-2xl text-pretty">
                Defensa penal especializada y representación jurídica integral para personas y empresas.
                Presencia activa en los juzgados de {site.address.city}, Valle y todo Honduras,
                con comunicación clara y un equipo coordinado en cada área del derecho.
              </p>
              <div className="flex flex-wrap gap-x-6 gap-y-2 mt-6">
                <span className="inline-flex items-center gap-1.5 text-sm text-text-inverse/80">
                  <CheckCircle2 size={14} className="text-accent" /> Primera consulta sin compromiso
                </span>
                <span className="inline-flex items-center gap-1.5 text-sm text-text-inverse/80">
                  <CheckCircle2 size={14} className="text-accent" /> Atención directa del abogado
                </span>
              </div>
              <CTAGroup variant="inverse" className="mt-7" />
            </div>
            <div className="lg:col-span-5">
              <div className="halo-accent rounded-md">
                <Card padding="md" className="bg-surface text-text border-accent/30 border-2 shadow-2xl card-premium">
                  <div className="flex items-center gap-2 mb-3">
                    <Phone size={16} className="text-primary" />
                    <p className="text-xxs font-bold uppercase tracking-wider text-text-muted">Contacto directo</p>
                  </div>
                  <a href={telHref()} className="block text-2xl md:text-3xl font-extrabold text-primary tabular-nums leading-tight hover:text-primary-light transition-colors">
                    {site.phoneDisplay}
                  </a>
                  <p className="text-sm text-text-secondary mt-1">{site.hours}</p>
                  <div className="divider-accent my-4" />
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
                      <p className="text-sm font-bold text-success">WhatsApp directo</p>
                      <p className="text-xxs text-text-secondary">Respuesta durante horario de atención</p>
                    </div>
                  </a>
                  <Link
                    href="/solicitar-consulta"
                    className="mt-3 flex items-center gap-3 p-3 rounded-md bg-primary/8 hover:bg-primary/12 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-md bg-primary flex items-center justify-center flex-shrink-0">
                      <Calendar size={16} className="text-text-inverse" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-primary">Formulario confidencial</p>
                      <p className="text-xxs text-text-secondary">Le respondemos en horario hábil</p>
                    </div>
                  </Link>
                  <div className="divider-accent my-4" />
                  <div className="flex items-start gap-2 text-xs text-text-secondary">
                    <MapPin size={14} className="text-accent-dark flex-shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{site.address.line1}, {site.address.line2}</span>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* TRUST BAR — sellos de autoridad */}
      <TrustBar background="dark" />

      {/* REAL QUESTIONS */}
      <Section spacing="md" ariaLabel="Preguntas reales">
        <SectionHeader
          eyebrow="¿Tiene un problema legal y no sabe cómo actuar?"
          title="Las preguntas que nos hacen a diario"
          subtitle="Respondemos con honestidad, sin importar el área del derecho. Si su pregunta no aparece aquí, escríbanos."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {REAL_QUESTIONS.map((item, i) => (
            <Link
              key={i}
              href="/preguntas-frecuentes"
              className="group block focus-visible:outline-none"
            >
              <Card padding="sm" className="h-full card-premium">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-md bg-primary text-text-inverse flex items-center justify-center text-xs font-extrabold flex-shrink-0 group-hover:bg-accent-dark group-hover:text-primary transition-colors">
                    {i + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-text leading-snug text-balance">{item.q}</p>
                    <span className="inline-flex items-center gap-1 mt-1.5 text-xxs font-bold uppercase tracking-wider text-accent-dark">
                      <span className="w-1 h-1 rounded-full bg-accent" aria-hidden="true" />
                      {item.badge}
                    </span>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link href="/preguntas-frecuentes" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-accent-dark transition-colors">
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
              const areaSlug = area.slug === 'derecho-penal' ? '/derecho-penal' : `/areas-juridicas/${area.slug}`;
              return (
                <ServiceCard
                  key={area.slug}
                  href={areaSlug}
                  slug={area.slug}
                  title={area.titulo}
                  description={area.resumen}
                  category="services"
                  tone={area.color as PlaceholderTone}
                  aspect="3/2"
                />
              );
            })}
        </div>
      </Section>

      {/* 13 ÁREAS — GRID CON IMAGEN */}
      <Section spacing="md" ariaLabel="Todas las áreas jurídicas">
        <SectionHeader
          eyebrow="Cobertura integral"
          title="Nuestras áreas de práctica"
          subtitle="Del derecho penal a la conciliación y arbitraje. Todas las ramas jurídicas que su caso pueda requerir bajo una misma dirección letrada."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {areasGenerales.map((area) => (
            <ServiceCard
              key={area.slug}
              href={`/areas-juridicas/${area.slug}`}
              slug={area.slug}
              title={area.titulo}
              description={area.resumen}
              category="services"
              tone={area.color as PlaceholderTone}
            />
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link href="/areas-juridicas" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-accent-dark transition-colors">
            Explorar todas las áreas <ArrowRight size={14} />
          </Link>
        </div>
      </Section>

      {/* TESTIMONIOS */}
      <TestimonialsSection
        title="Lo que dicen quienes confían en nosotros"
        subtitle="Casos reales, resultados verificables. Publicamos con autorización y anonimizamos por confidencialidad."
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
        <ProcessStepper steps={PROCESS} withConnector />
      </Section>

      {/* WHY US */}
      <Section background="primary" spacing="md" ariaLabel="Por qué elegirnos">
        <div className="text-text-inverse">
          <SectionHeader
            eyebrow="Por qué elegirnos"
            title="Cinco razones que marcan la diferencia"
            subtitle="Nuestra práctica se sostiene sobre principios técnicos, no sobre promesas."
            invert
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {WHY.map((w) => (
            <div
              key={w.title}
              className="rounded-md border border-primary-light/40 bg-primary-light/20 p-5 backdrop-blur-sm card-premium"
            >
              <div className="w-12 h-12 rounded-lg bg-accent/15 text-accent flex items-center justify-center flex-shrink-0">
                <w.icon size={22} aria-hidden="true" />
              </div>
              <div className="mt-2.5">
                <h3 className="font-bold text-sm leading-tight text-text-inverse text-balance">
                  {w.title}
                </h3>
                <p className="text-xs leading-relaxed text-text-inverse/80 mt-1.5 text-pretty">
                  {w.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* POR QUÉ MULTIDISCIPLINAR */}
      <Section spacing="md" ariaLabel="Por qué un bufete multidisciplinar">
        <div className="grid lg:grid-cols-12 gap-6 lg:gap-10 items-start">
          <div className="lg:col-span-5">
            <p className="text-xxs font-bold uppercase tracking-widest text-accent-dark mb-3">
              Visión integral
            </p>
            <h2 className="font-serif font-extrabold text-2xl md:text-3xl text-text leading-tight text-balance">
              Un mismo problema jurídico puede tocar varias ramas del derecho a la vez
            </h2>
            <p className="mt-4 text-sm text-text-secondary leading-relaxed text-pretty">
              Atender su asunto con un equipo multidisciplinar evita que tenga que contratar abogados
              distintos para cada frente. Coordinamos estrategia, plazos y piezas procesales desde un
              solo bufete, con comunicación directa y un expediente unificado.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/8 text-primary text-xxs font-bold uppercase tracking-wider">
                <Handshake size={12} /> Estrategia unificada
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/8 text-primary text-xxs font-bold uppercase tracking-wider">
                <BriefcaseBusiness size={12} /> Un solo expediente
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/8 text-primary text-xxs font-bold uppercase tracking-wider">
                <Users size={12} /> Equipo coordinado
              </span>
            </div>
          </div>
          <div className="lg:col-span-7 grid sm:grid-cols-2 gap-3">
            {[
              {
                icon: Gavel,
                title: 'Penal + familia + civil',
                desc: 'Una acusación penal con hijos, bienes y familia de por medio exige coordinación inmediata entre las áreas para protegerle en todos los frentes.',
              },
              {
                icon: Briefcase,
                title: 'Laboral + mercantil',
                desc: 'Despidos en empresas con contratos mercantiles, sociedades o deudas cruzadas requieren análisis simultáneo del derecho del trabajo y el societario.',
              },
              {
                icon: Building,
                title: 'Civil + tributario + bancario',
                desc: 'Embargos, cobros judiciales, contratos y obligaciones tributarias se cruzan en la práctica. Una defensa conjunta es más rápida y más barata.',
              },
              {
                icon: Landmark,
                title: 'Notarial + registral',
                desc: 'Compras, donaciones, sociedades y traspasos requieren acompañamiento notarial, registral y, a veces, fiscal. Lo resolvemos internamente.',
              },
            ].map((it) => (
              <Card key={it.title} padding="md" className="h-full card-premium">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-md bg-accent/15 text-accent-dark flex items-center justify-center flex-shrink-0 border border-accent/30">
                    <it.icon size={18} aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm text-text leading-tight text-balance">{it.title}</h3>
                    <p className="text-xs text-text-secondary leading-relaxed mt-1.5 text-pretty">
                      {it.desc}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
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
              <ul className="space-y-3 text-sm">
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
              <Link href="/como-llegar" className="inline-flex items-center gap-1.5 mt-4 text-sm font-semibold text-primary hover:text-accent-dark">
                Ver indicaciones para llegar <ArrowRight size={14} />
              </Link>
            </Card>
          </div>
          <div>
            <Card padding="none" className="overflow-hidden aspect-[4/3] bg-surface-alt">
              <MapEmbed
                latitude={site.geo.latitude}
                longitude={site.geo.longitude}
                label={site.name}
                fullAddress={site.address.full}
                zoom={15}
                className="w-full h-full"
              />
            </Card>
            <Link href="/como-llegar" className="inline-flex items-center gap-1.5 mt-2 text-xs font-semibold text-primary hover:text-accent-dark">
              Cómo llegar y ver indicaciones <ArrowRight size={12} />
            </Link>
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
            <Link href="/preguntas-frecuentes" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-accent-dark">
              Ver todas las preguntas <ArrowRight size={14} />
            </Link>
          </div>
          <div className="lg:col-span-2 space-y-3">
            {FAQ.map((f, i) => (
              <details
                key={i}
                className="group rounded-md border border-border-light bg-surface faq-anim open:border-accent/40"
              >
                <summary className="cursor-pointer list-none p-4 flex items-center justify-between gap-3">
                  <h3 className="font-semibold text-sm text-text leading-snug text-balance">{f.q}</h3>
                  <span className="w-6 h-6 rounded-full bg-surface-alt group-open:bg-accent/15 flex items-center justify-center flex-shrink-0 transition-colors">
                    <ArrowRight size={12} className="text-text-secondary group-open:rotate-90 transition-transform" />
                  </span>
                </summary>
                <div className="faq-content px-4 pb-4 -mt-1 text-sm text-text-secondary leading-relaxed text-pretty">
                  {f.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </Section>

      {/* CTA FINAL */}
      <Section background="primary" spacing="md" ariaLabel="Solicitar consulta">
        <div className="text-center max-w-2xl mx-auto text-text-inverse">
          <h2 className="font-serif font-extrabold text-2xl md:text-3xl lg:text-4xl leading-tight">
            Cuéntenos su caso. Le orientamos sin compromiso.
          </h2>
          <p className="mt-4 text-text-inverse/85 text-sm md:text-base leading-relaxed">
            La primera consulta es confidencial. Le escuchamos, evaluamos su caso y le explicamos con claridad las opciones reales, sin importar el área del derecho que necesite.
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
