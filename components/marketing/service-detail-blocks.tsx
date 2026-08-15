/**
 * Bloques editoriales para páginas de servicios jurídicos prioritarios (FASE 3).
 *
 * Componentes presentacionales que consumen los campos opcionales de
 * `AreaDetailFields` (en `data/areas-juridicas.ts`). Cada uno se renderiza de
 * forma independiente y solo aparece si la página le pasa datos, evitando
 * bloques vacíos o plantillas rígidas (instrucción FASE 3 §4).
 *
 * Reglas (AGENTS.md R4, R5, R16):
 *  - No inventan datos jurídicos ni afirman como verificadas cifras pendientes
 *    (P01-P15). El contenido proviene exclusivamente del data file.
 *  - Reutilizan el design system (`Section`, `Card`, `SectionHeader`, design
 *    tokens canónicos: `rounded-lg`, `w-11 h-11`, dorado solo acento).
 *  - Sin animaciones obligatorias; respetan `prefers-reduced-motion`.
 *  - Iconos decorativos con `aria-hidden`.
 *  - El bloque de fuentes muestra "Fuentes generales" + aviso orientativo;
 *    nunca "Revisado por" sin revisión humana real (FASE 1 §13).
 */

import { ReactNode } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  FileText,
  Info,
  Send,
  ShieldAlert,
  Scale,
} from 'lucide-react';
import { Section, SectionHeader, Container } from '@/components/marketing/section';
import { ProcessStepper } from '@/components/marketing/process-stepper';
import { InstitutionsBlock as CanonicalInstitutionsBlock } from '@/components/marketing/institutions-block';
import { Card } from '@/components/ui/card';
import type {
  BloqueSeparacion,
  FuenteGeneral,
  PasoProceso,
} from '@/data/areas-juridicas';

/* -------------------------------------------------------------------------- */
/* RespuestaDirecta — respuesta citable ~50-100 palabras post-H1 (§5)         */
/* -------------------------------------------------------------------------- */

/**
 * Respuesta directa orientada a AEO/GEO. Debe ser comprensible fuera del
 * contexto de la página y potencialmente citable por buscadores y asistentes.
 *
 * FASE 5: composición tipográfica alineada con `AnswerBlock` (mismo eyebrow
 * `eyebrow-rule text-accent-dark`, misma línea dorada decorativa de 12×3px,
 * mismo ancho legible `max-w-2xl`). La diferencia semántica con AnswerBlock
 * es que aquí NO hay pregunta como <h2>: el H1 lo aporta el hero de la
 * página de servicio, y la respuesta directa es un párrafo post-H1, no una
 * pregunta formada. Forzar una h2 aquí inventaría contenido (R4/R17).
 */
export function RespuestaDirecta({
  texto,
  eyebrow = 'Respuesta directa',
  children,
}: {
  texto: string;
  eyebrow?: string;
  children?: ReactNode;
}) {
  return (
    <Section background="warm" spacing="md">
      <Container size="lg">
        <div className="max-w-2xl">
          <p className="eyebrow-rule text-accent-dark mb-2.5">{eyebrow}</p>
          <div
            className="mb-4 h-[3px] w-12 rounded-full bg-accent/80"
            aria-hidden="true"
          />
          <p className="text-base md:text-lg text-text leading-relaxed text-pretty">
            {texto}
          </p>
          {children ? (
            <div className="mt-4 text-sm text-text-secondary leading-relaxed">
              {children}
            </div>
          ) : null}
        </div>
      </Container>
    </Section>
  );
}

/* -------------------------------------------------------------------------- */
/* SituacionesHabituales — lista de problemas que atiende el área (§4.3)      */
/* -------------------------------------------------------------------------- */

export function SituacionesHabituales({
  items,
  title = 'Situaciones en las que podemos ayudarle',
  eyebrow = 'Cuándo acudir',
}: {
  items: string[];
  title?: string;
  eyebrow?: string;
}) {
  if (!items.length) return null;
  return (
    <Section spacing="md">
      <SectionHeader eyebrow={eyebrow} title={title} align="left" />
      <ul className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 max-w-4xl">
        {items.map((item) => (
          <li
            key={item}
            className="flex items-start gap-2.5 text-sm md:text-base text-text-secondary leading-relaxed"
          >
            <CheckCircle2
              size={18}
              className="text-success flex-shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </Section>
  );
}

/* -------------------------------------------------------------------------- */
/* SeparacionAudiencias — bloques por tipo de cliente o figura (§8/§9)        */
/* -------------------------------------------------------------------------- */

/**
 * Separa visualmente audiencias (trabajador/empleador en laboral, o
 * asesoría-litigación/notarial/registral en civil). Cada bloque es una columna
 * con título y lista de ítems. No impone un número fijo de columnas.
 */
export function SeparacionAudiencias({
  bloques,
  eyebrow = 'Según su situación',
  title,
  subtitle,
}: {
  bloques: BloqueSeparacion[];
  eyebrow?: string;
  title?: string;
  subtitle?: string;
}) {
  if (!bloques.length) return null;
  const cols = `grid grid-cols-1 ${
    bloques.length >= 3 ? 'lg:grid-cols-3' : bloques.length === 2 ? 'md:grid-cols-2' : ''
  } gap-5`;
  return (
    <Section background="muted" spacing="md">
      <SectionHeader
        eyebrow={eyebrow}
        title={title ?? 'Cómo le atendemos según su caso'}
        subtitle={subtitle}
        align="left"
      />
      <div className={`mt-4 ${cols}`}>
        {bloques.map((bloque) => (
          <Card key={bloque.titulo} padding="md" className="h-full">
            <h3 className="font-serif font-bold text-lg text-primary leading-snug mb-3">
              {bloque.titulo}
            </h3>
            <ul className="space-y-2">
              {bloque.items.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2 text-sm text-text-secondary leading-relaxed"
                >
                  <Scale
                    size={14}
                    className="text-accent-dark flex-shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </Section>
  );
}

/* -------------------------------------------------------------------------- */
/* DocumentChecklist — documentos iniciales orientativos (§4.5/§10)           */
/* -------------------------------------------------------------------------- */

export function DocumentChecklist({
  items,
  nota,
  title = 'Documentos útiles para una primera revisión',
  eyebrow = 'Prepárese',
}: {
  items: string[];
  nota?: string;
  title?: string;
  eyebrow?: string;
}) {
  if (!items.length) return null;
  return (
    <Section spacing="md" id="documentos-iniciales">
      <SectionHeader
        eyebrow={eyebrow}
        title={title}
        subtitle="Lista orientativa: la documentación exacta depende del asunto."
        align="left"
      />
      <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-5xl">
        {items.map((item) => (
          <li key={item}>
            <Card padding="sm" className="h-full flex items-start gap-3">
              <span className="w-9 h-9 rounded-lg border border-accent/30 bg-accent/10 flex items-center justify-center flex-shrink-0">
                <FileText size={16} className="text-accent-dark" aria-hidden="true" />
              </span>
              <span className="text-sm text-text-secondary leading-snug pt-1">{item}</span>
            </Card>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs text-text-muted leading-relaxed max-w-3xl">
        {nota ??
          'La documentación exacta depende del asunto. No envíe documentos originales ni información especialmente sensible antes de que el despacho le indique un medio adecuado.'}
      </p>
    </Section>
  );
}

/* -------------------------------------------------------------------------- */
/* ProcessList — proceso general del área (§4.6/§11)                          */
/* -------------------------------------------------------------------------- */

/**
 * Proceso en pasos numerados. Etapas prudentes y generales, sin plazos
 * cerrados ni cifras pendientes. La nota aclara que el envío del formulario
 * no supone aceptación del asunto.
 */
export function ProcessList({
  pasos,
  intro,
  nota,
  eyebrow = 'Cómo trabajamos',
  title = 'Recorrido habitual del asunto',
}: {
  pasos: PasoProceso[];
  intro?: string;
  nota?: string;
  eyebrow?: string;
  title?: string;
}) {
  if (!pasos.length) return null;
  // Mapeo de PasoProceso (data) → ProcessStep (UI) preservando orden y contenido.
  // El render interno delega en <ProcessStepper variant='timeline'> (Hito 7.3).
  const steps = pasos.map((paso, i) => ({
    step: i + 1,
    title: paso.titulo,
    desc: paso.descripcion,
  }));
  return (
    <Section background="default" spacing="md" id="proceso">
      <SectionHeader eyebrow={eyebrow} title={title} subtitle={intro} align="left" />
      <div className="mt-6">
        <ProcessStepper steps={steps} variant="timeline" />
      </div>
      <p className="mt-4 text-xs text-text-muted leading-relaxed max-w-3xl">
        {nota ??
          'El envío del formulario de consulta no supone aceptación formal del asunto. La estrategia y los honorarios se confirman por escrito tras la revisión preliminar.'}
      </p>
    </Section>
  );
}

/* -------------------------------------------------------------------------- */
/* InstitutionsBlock — autoridades/instituciones (texto general) (§4.7)       */
/* -------------------------------------------------------------------------- */

/**
 * Lista de autoridades posiblemente involucradas. Texto general, sin atribuir
 * a una institución la responsabilidad exclusiva de un trámite que requiere
 * varias (instrucción FASE 3 §9).
 *
 * Hito 7.4 (FASE 5): delega el render en el componente canónico
 * `<InstitutionsBlock>` de `institutions-block.tsx`. Conserva la API pública
 * (`items: string[]`) para no romper las páginas que la usan, y mapea los
 * strings al tipo `InstitutionItem`.
 */
export function InstitutionsBlock({
  items,
  eyebrow = 'Autoridades e instituciones',
  title = 'Ante quién puede actuar el despacho',
  subtitle,
}: {
  items: string[];
  eyebrow?: string;
  title?: string;
  subtitle?: string;
}) {
  if (!items.length) return null;
  return (
    <CanonicalInstitutionsBlock
      items={items.map((name) => ({ name }))}
      eyebrow={eyebrow}
      title={title}
      subtitle={subtitle}
      variant="chips"
    />
  );
}

/* -------------------------------------------------------------------------- */
/* FactorsThatVary — factores que pueden variar según el caso (§4.8)          */
/* -------------------------------------------------------------------------- */

export function FactorsThatVary({
  items,
  eyebrow = 'Factores que pueden variar',
  title = 'Qué puede influir en su caso',
}: {
  items: string[];
  eyebrow?: string;
  title?: string;
}) {
  if (!items.length) return null;
  return (
    <Section background="muted" spacing="sm">
      <SectionHeader eyebrow={eyebrow} title={title} align="left" />
      <ul className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 max-w-4xl">
        {items.map((item) => (
          <li
            key={item}
            className="flex items-start gap-2.5 text-sm text-text-secondary leading-relaxed bg-surface rounded-md border border-border-light p-3"
          >
            <Info size={16} className="text-accent-dark flex-shrink-0 mt-0.5" aria-hidden="true" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </Section>
  );
}

/* -------------------------------------------------------------------------- */
/* CommonMistakes — errores frecuentes que conviene evitar (§4.9)             */
/* -------------------------------------------------------------------------- */

export function CommonMistakes({
  items,
  eyebrow = 'Errores frecuentes',
  title = 'Qué conviene evitar',
}: {
  items: string[];
  eyebrow?: string;
  title?: string;
}) {
  if (!items.length) return null;
  return (
    <Section spacing="md">
      <SectionHeader eyebrow={eyebrow} title={title} align="left" />
      <ul className="mt-4 space-y-2.5 max-w-3xl">
        {items.map((item) => (
          <li
            key={item}
            className="flex items-start gap-2.5 text-sm md:text-base text-text-secondary leading-relaxed"
          >
            <AlertTriangle
              size={18}
              className="text-aggravation flex-shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </Section>
  );
}

/* -------------------------------------------------------------------------- */
/* SourcesAndDisclaimer — fuentes generales + aviso orientativo (§13)         */
/* -------------------------------------------------------------------------- */

/**
 * Bloque de transparencia sobre las fuentes consultadas y el carácter
 * orientativo de la información. NO muestra "Revisado por": las páginas
 * prioritarias permanecen en estado `pending`/`needs_update` hasta que un
 * abogado del despacho las revise y firme (FASE 1 §13, R4).
 *
 * Las fuentes se muestran como "Fuentes generales" (no como verificación de
 * cada afirmación). El aviso deja claro que la información es orientativa y no
 * sustituye el análisis individual del caso.
 */
export function SourcesAndDisclaimer({
  fuentes,
  eyebrow = 'Fuentes y consideraciones',
  title = 'Fuentes generales y aviso',
}: {
  fuentes?: FuenteGeneral[];
  eyebrow?: string;
  title?: string;
}) {
  return (
    <Section background="muted" spacing="sm">
      <SectionHeader eyebrow={eyebrow} title={title} align="left" />
      <div className="mt-4 max-w-3xl space-y-4">
        {fuentes && fuentes.length > 0 ? (
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-text-muted mb-2">
              Fuentes generales consultadas
            </p>
            <ul className="space-y-1.5">
              {fuentes.map((fuente) => (
                <li
                  key={fuente.titulo}
                  className="text-sm text-text-secondary leading-relaxed"
                >
                  <span className="font-medium text-text">{fuente.titulo}</span>
                  <span className="text-text-muted"> · {fuente.institucion}</span>
                  {fuente.url ? (
                    <>
                      {' · '}
                      <a
                        href={fuente.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent-dark hover:text-primary underline font-medium"
                      >
                        Consultar
                      </a>
                    </>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        <div className="rounded-md border border-border-light bg-surface p-4">
          <p className="flex items-start gap-2 text-xs text-text-secondary leading-relaxed">
            <ShieldAlert size={16} className="text-accent-dark flex-shrink-0 mt-0.5" aria-hidden="true" />
            <span>
              La información de esta página es <strong>orientativa</strong> y se
              ofrece para ayudarle a entender el alcance del servicio. No
              sustituye el análisis individual de su caso ni constituye asesoría
              legal formal hasta que el despacho revise la documentación
              aplicable y confirme la estrategia por escrito.
            </span>
          </p>
        </div>
      </div>
    </Section>
  );
}

/* -------------------------------------------------------------------------- */
/* ContextualCta — CTA específico por servicio con ?motivo= (§15)             */
/* -------------------------------------------------------------------------- */

/**
 * CTA contextual del área. Dirige a `/solicitar-consulta?motivo={slug}#formulario`
 * con un slug de la whitelist definida en el formulario. El href ya debe venir
 * construido desde el data file; este componente solo lo renderiza.
 *
 * El disparo analítico se delega en el listener global (analytics-listeners)
 * que detecta clics en `/solicitar-consulta`. No se envía PII: el `motivo` es
 * una categoría, no contenido del usuario.
 */
export function ContextualCta({
  href,
  label,
  secondaryHref,
  secondaryLabel,
  eyebrow,
  title = '¿Quiere que revisemos su caso?',
}: {
  href: string;
  label: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  eyebrow?: string;
  title?: string;
}) {
  return (
    <Section spacing="md">
      <Container size="md">
        <div className="rounded-lg border border-accent/30 bg-accent/5 p-6 md:p-8 text-center">
          {eyebrow ? (
            <p className="eyebrow-rule text-accent-dark mb-2">{eyebrow}</p>
          ) : null}
          <h2 className="font-serif font-extrabold text-2xl md:text-3xl text-primary leading-tight text-balance">
            {title}
          </h2>
          <div className="mt-5 flex flex-wrap gap-3 justify-center">
            <Link
              href={href}
              className="focus-ring cta-primary-refined inline-flex items-center gap-2 h-12 px-6 rounded-md bg-primary text-white text-sm font-bold hover:bg-primary-light transition-colors"
            >
              <Send size={16} /> {label}
            </Link>
            {secondaryHref && secondaryLabel ? (
              <Link
                href={secondaryHref}
                className="focus-ring inline-flex items-center gap-2 h-12 px-6 rounded-md border border-border-light bg-surface text-text text-sm font-bold hover:border-accent/40 transition-colors"
              >
                {secondaryLabel} <ArrowRight size={14} />
              </Link>
            ) : null}
          </div>
        </div>
      </Container>
    </Section>
  );
}

/* -------------------------------------------------------------------------- */
/* AreaTrustBlock — por qué confiar en esta área (sin testimonios ficticios)  */
/* -------------------------------------------------------------------------- */

export function AreaTrustBlock({
  title,
  points,
  eyebrow = 'Por qué confiar en esta área',
}: {
  title: string;
  points: readonly { title: string; body: string }[];
  eyebrow?: string;
}) {
  if (!points.length) return null;
  return (
    <Section background="warm" spacing="md" ariaLabel={eyebrow}>
      <SectionHeader eyebrow={eyebrow} title={title} />
      <div className="grid gap-4 md:grid-cols-3">
        {points.map((point) => (
          <article key={point.title} className="rounded-lg border border-border-light bg-surface p-5 h-full">
            <div className="w-11 h-11 rounded-lg bg-primary/8 text-primary flex items-center justify-center border border-primary/15">
              <ShieldAlert size={20} aria-hidden="true" />
            </div>
            <h3 className="mt-3 font-serif text-lg font-extrabold text-primary">{point.title}</h3>
            <p className="mt-2 text-sm text-text-secondary leading-relaxed">{point.body}</p>
          </article>
        ))}
      </div>
    </Section>
  );
}

/* -------------------------------------------------------------------------- */
/* ViewServiceTracker — dispara view_service al montar (§19)                  */
/* -------------------------------------------------------------------------- */

/**
 * Wrapper cliente mínimo que dispara `trackViewService` al montar, sin PII.
 * Se incluye una sola vez por página de servicio prioritario. El servicio es
 * un slug/identificador (no contenido del usuario).
 *
 * Se excluye automáticamente de preview e intranet vía `isAnalyticsExcludedPath`
 * en el helper `trackViewService` (lib/analytics.ts).
 */
export { ViewServiceTracker } from './view-service-tracker';
