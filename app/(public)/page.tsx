import Link from 'next/link';
import type { Metadata } from 'next';
import {
  Scale,
  ShieldCheck,
  Gavel,
  Users,
  FileText,
  HeartHandshake,
  Lock,
  BookOpen,
  MapPin,
  CheckCircle2,
  ArrowRight,
  AlertTriangle,
  Phone,
  MessageCircle,
  Calendar,
  Briefcase,
  Clock,
} from 'lucide-react';
import { site, telHref, whatsappHref } from '@/lib/site';
import { Section, SectionHeader, Container } from '@/components/marketing/section';
import { CTAGroup, UrgencyCallout, ContactStrip } from '@/components/marketing/cta-buttons';
import { Card } from '@/components/ui/card';

export const metadata: Metadata = {
  title: `${site.name} — Abogados penalistas en ${site.address.city}, ${site.address.department}`,
  description: site.description,
  alternates: { canonical: '/' },
};

const REAL_QUESTIONS = [
  '¿Me pueden detener sin orden judicial?',
  '¿Qué hago si un familiar fue arrestado?',
  '¿Cuánto tarda un proceso penal en Honduras?',
  '¿Puedo salir libre bajo fianza?',
  '¿Aceptan un caso de flagrancia?',
  '¿Qué pasa si no tengo cómo pagar un abogado?',
  '¿Cómo demostrar mi inocencia si me acusan?',
];

const AREAS = [
  { icon: ShieldCheck, title: 'Defensa Penal', desc: 'Asumimos su defensa desde la primera actuación procesal hasta la sentencia firme.', href: '/derecho-penal' },
  { icon: Gavel, title: 'Audiencias y Juicio Oral', desc: 'Representación técnica en audiencias iniciales, preliminares, de sobreseimiento y juicio oral.', href: '/derecho-penal' },
  { icon: Users, title: 'Asistencia a Detenidos', desc: 'Asistencia letrada inmediata en sede policial o ante el Ministerio Público.', href: '/derecho-penal/atencion-casos-penales-litigiosos' },
  { icon: FileText, title: 'Recursos y Apelaciones', desc: 'Interposición de recursos de apelación, casación, revisión y amparo.', href: '/derecho-penal/recursos-y-defensa-avanzada' },
  { icon: HeartHandshake, title: 'Atención a Víctimas', desc: 'Acompañamiento jurídico a víctimas de delitos durante el proceso penal.', href: '/derecho-penal' },
  { icon: BookOpen, title: 'Asesoría Preventiva', desc: 'Consultoría penal preventiva para empresas, instituciones y personas.', href: '/derecho-penal' },
];

const PROCESS = [
  { step: 1, title: 'Consulta inicial', desc: 'Evaluamos su caso de forma confidencial y le explicamos las opciones reales con honestidad.' },
  { step: 2, title: 'Estrategia de defensa', desc: 'Analizamos pruebas, normativa aplicable y diseñamos una línea de defensa técnica.' },
  { step: 3, title: 'Actuaciones urgentes', desc: 'Interponemos las acciones inmediatas: hábeas corpus, medidas cautelares, recursos.' },
  { step: 4, title: 'Acompañamiento procesal', desc: 'Le representamos en cada audiencia y actuamos con diligencia durante todo el proceso.' },
  { step: 5, title: 'Cierre y seguimiento', desc: 'Le entregamos un informe claro del resultado y, si procede, los recursos disponibles.' },
];

const WHY = [
  { icon: Scale, title: 'Especialización penal', desc: 'Derecho Penal y Procesal Penal como eje exclusivo de nuestra práctica.' },
  { icon: Lock, title: 'Confidencialidad estricta', desc: 'Su información está protegida por el secreto profesional desde el primer contacto.' },
  { icon: Clock, title: 'Atención 60 horas semanales', desc: 'Lunes a sábado de 7:00 a 20:00. Le respondemos el mismo día hábil.' },
  { icon: MapPin, title: 'Presencia local en Nacaome', desc: 'Conocemos el sistema de justicia del departamento de Valle.' },
  { icon: BookOpen, title: 'Código Penal al día', desc: 'Trabajamos con el Decreto 130-2017 y sus reformas vigentes (119-2019, 46-2020, 93-2021, 59-2024).' },
  { icon: Briefcase, title: 'Tecnológico y trazable', desc: 'Documentamos cada actuación. Generamos PDF con firma y fecha para su expediente.' },
  { icon: CheckCircle2, title: 'Lenguaje claro', desc: 'Le explicamos el proceso en términos comprensibles, sin tecnicismos innecesarios.' },
  { icon: AlertTriangle, title: 'Honestidad prudente', desc: 'Nunca prometemos resultados. Le decimos lo que procede y lo que no.' },
];

const FAQ = [
  {
    q: '¿Atienden casos urgentes fuera del horario?',
    a: 'Atendemos de lunes a sábado de 7:00 a 20:00. Para emergencias con persona detenida, contáctenos por WhatsApp y le orientaremos de inmediato durante el horario de atención.',
  },
  {
    q: '¿Cuánto cuesta una defensa penal?',
    a: 'Cada caso requiere análisis individual. Le informamos el alcance de los honorarios tras la consulta inicial, de forma clara y por escrito.',
  },
  {
    q: '¿Puedo cambiar de abogado durante el proceso?',
    a: 'Sí. Usted puede revocar el poder a su abogado y designar a otro en cualquier momento. Le orientamos sobre los pasos a seguir.',
  },
  {
    q: '¿Trabajan con personas de otros departamentos?',
    a: 'Sí. Asumimos defensas en todo el territorio nacional. Coordinamos las audiencias y los traslados según corresponda.',
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
        <div className="absolute inset-0 opacity-10 pointer-events-none" aria-hidden="true">
          <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-accent blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-96 h-96 rounded-full bg-accent-dark blur-3xl" />
        </div>
        <Container size="lg" className="relative py-16 md:py-24 lg:py-28">
          <div className="grid lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 bg-primary-light/50 border border-primary-light rounded-full px-3 py-1 mb-5">
                <span className="w-2 h-2 rounded-full bg-success" aria-hidden="true" />
                <span className="text-[12px] font-semibold tracking-wider uppercase text-text-inverse/90">Atendemos ahora · {site.hoursShort}</span>
              </div>
              <h1 className="font-serif font-extrabold text-3xl sm:text-4xl lg:text-5xl xl:text-6xl leading-[1.1] text-text-inverse">
                Abogados penalistas en {site.address.city}, {site.address.department}
                <span className="block text-accent mt-2">Defensa penal seria y confidencial</span>
              </h1>
              <p className="mt-5 text-base md:text-lg text-text-inverse/85 leading-relaxed max-w-2xl">
                Defendemos sus derechos con rigor técnico y prudencia. Aplicamos el Código Penal de Honduras (Decreto 130-2017) y sus reformas vigentes, con atención personal en Nacaome y todo el sur de Honduras.
              </p>
              <CTAGroup variant="inverse" className="mt-7" />
              <ul className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-text-inverse/80">
                <li className="inline-flex items-center gap-1.5"><CheckCircle2 size={14} className="text-accent" /> Consulta inicial confidencial</li>
                <li className="inline-flex items-center gap-1.5"><CheckCircle2 size={14} className="text-accent" /> Atención lunes a sábado</li>
                <li className="inline-flex items-center gap-1.5"><CheckCircle2 size={14} className="text-accent" /> Defensa técnica especializada</li>
              </ul>
            </div>
            <div className="lg:col-span-5">
              <Card padding="md" className="bg-surface text-text border-accent/30 border-2 shadow-2xl">
                <div className="flex items-center gap-2 mb-3">
                  <Phone size={16} className="text-primary" />
                  <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Hablar ahora</p>
                </div>
                <a href={telHref()} className="block text-2xl md:text-3xl font-extrabold text-primary tabular-nums leading-tight hover:text-primary-light transition-colors">
                  {site.phoneDisplay}
                </a>
                <p className="text-[13px] text-text-secondary mt-1">{site.hours}</p>
                <div className="border-t border-border-light my-4" />
                <a
                  href={whatsappHref('Hola, necesito orientación sobre un caso penal.')}
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

      {/* URGENCY CALLOUT */}
      <Section background="muted" spacing="sm">
        <UrgencyCallout />
      </Section>

      {/* REAL QUESTIONS */}
      <Section spacing="md" ariaLabel="Preguntas reales">
        <SectionHeader
          eyebrow="¿Tiene un problema penal y no sabe cómo actuar?"
          title="Las preguntas que nos hacen a diario"
          subtitle="Respondemos con honestidad, sin promesas de resultados. Si su pregunta no aparece aquí, escríbanos por WhatsApp o solicite una consulta."
        />
        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {REAL_QUESTIONS.map((q, i) => (
            <li key={i}>
              <Card padding="sm" className="h-full hover:border-accent/50 transition-colors">
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-primary text-text-inverse flex items-center justify-center text-[12px] font-bold flex-shrink-0">
                    {i + 1}
                  </div>
                  <p className="text-[14px] font-semibold text-text leading-snug pt-0.5">{q}</p>
                </div>
              </Card>
            </li>
          ))}
        </ul>
        <div className="mt-8 text-center">
          <Link href="/preguntas-frecuentes" className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-primary hover:text-accent-dark transition-colors">
            Ver todas las preguntas frecuentes <ArrowRight size={14} />
          </Link>
        </div>
      </Section>

      {/* SERVICES */}
      <Section background="muted" spacing="md" ariaLabel="Áreas de práctica">
        <SectionHeader
          eyebrow="Áreas Jurídicas"
          title="Defensa penal integral"
          subtitle="Cada caso requiere análisis individual. Le orientamos sobre la vía procesal adecuada y los plazos que aplican."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {AREAS.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="group block focus-visible:outline-none rounded-md"
            >
              <Card padding="md" className="h-full group-hover:border-accent group-hover:shadow-md transition-all">
                <div className="w-11 h-11 rounded-md bg-primary/10 text-primary flex items-center justify-center mb-3">
                  <a.icon size={20} aria-hidden="true" />
                </div>
                <h3 className="font-bold text-[15px] text-text leading-tight">{a.title}</h3>
                <p className="text-[13px] text-text-secondary mt-2 leading-relaxed">{a.desc}</p>
                <span className="inline-flex items-center gap-1 mt-3 text-[12px] font-semibold text-accent-dark group-hover:text-primary transition-colors">
                  Conocer más <ArrowRight size={12} />
                </span>
              </Card>
            </Link>
          ))}
        </div>
      </Section>

      {/* PROCESS */}
      <Section spacing="md" ariaLabel="Proceso de atención">
        <SectionHeader
          eyebrow="Cómo trabajamos"
          title="Cinco pasos, una sola defensa"
          subtitle="Le acompañamos con diligencia y trazabilidad en cada etapa del proceso penal."
        />
        <ol className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {PROCESS.map((p) => (
            <li key={p.step} className="relative">
              <Card padding="md" className="h-full">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-primary text-text-inverse flex items-center justify-center text-[13px] font-extrabold flex-shrink-0">
                    {p.step}
                  </div>
                  <h3 className="font-bold text-[14px] text-text leading-tight">{p.title}</h3>
                </div>
                <p className="text-[13px] text-text-secondary leading-relaxed">{p.desc}</p>
              </Card>
            </li>
          ))}
        </ol>
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
            ¿Listo para hablar con un abogado penalista?
          </h2>
          <p className="mt-4 text-text-inverse/85 text-[15px] md:text-base leading-relaxed">
            La primera consulta es confidencial. Le escuchamos, evaluamos su caso y le explicamos con honestidad las opciones reales.
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
