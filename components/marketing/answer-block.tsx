/**
 * Bloque editorial canónico para respuestas directas y texto introductorio.
 *
 * Modelo ÚNICO de texto para todas las páginas públicas que necesitan un
 * párrafo de apertura o respuesta directa (AEO/GEO). Sustituye a los
 * antiguos formatos dispersos (tarjeta con borde dorado, prose-editorial
 * suelto, geo-snippet inline) que daban sensación de capas añadidas.
 *
 * Composición tipográfica sobria y coherente:
 *  - eyebrow dorado (categoría, opcional)
 *  - question como <h2> serif (titular claro, citable por LLMs)
 *  - answer como párrafo directo (1-3 frases con la respuesta literal)
 *  - línea dorada decorativa bajo el título (sello visual común)
 *
 * Sin tarjeta, sin fondo, sin borde. Solo tipografía y respiración.
 * Pensado para que ChatGPT, Gemini, Claude, Copilot y Perplexity extraigan
 * la respuesta tal cual. Server Component, 0 JS.
 */
export function AnswerBlock({
  question,
  answer,
  eyebrow,
  children,
}: {
  question: string;
  answer: string;
  eyebrow?: string;
  /** Contenido adicional opcional (lista, callout, enlace contextual). */
  children?: React.ReactNode;
}) {
  return (
    <div className="max-w-2xl">
      {eyebrow && (
        <p className="eyebrow-rule text-accent-dark mb-2.5">{eyebrow}</p>
      )}
      <h2 className="font-serif font-extrabold text-xl md:text-2xl text-primary leading-tight text-balance">
        {question}
      </h2>
      <div
        className="mt-3 h-[3px] w-12 rounded-full bg-accent/80"
        aria-hidden="true"
      />
      <p className="mt-4 text-sm md:text-base text-text-secondary leading-relaxed text-pretty">
        {answer}
      </p>
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}

