/**
 * Bloque de respuesta directa optimizado para AEO/GEO.
 *
 * Renderiza una sección semántica con:
 *  - eyebrow (categoría, opcional)
 *  - question como <h2> (titular claro que los motores de IA pueden citar)
 *  - answer como párrafo directo (1-3 frases con la respuesta literal)
 *
 * Estilo sobrio: fondo warm, borde izquierdo dorado, máximo 2xl. Snippet-friendly.
 * Pensado para que ChatGPT, Gemini, Claude, Copilot y Perplexity extraigan la
 * respuesta tal cual. Sin dependencias cliente: es Server Component.
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
  /** Contenido adicional opcional (lista, callout). */
  children?: React.ReactNode;
}) {
  return (
    <section className="not-prose my-8 max-w-2xl">
      <div className="rounded-lg border-l-4 border-l-accent bg-accent/5 p-5">
        {eyebrow && (
          <p className="text-xxs font-semibold uppercase tracking-[0.18em] text-accent-dark">
            {eyebrow}
          </p>
        )}
        <h2 className="mt-1 font-serif text-xl text-primary">{question}</h2>
        <p className="mt-2 text-sm md:text-base text-text-secondary leading-relaxed">
          {answer}
        </p>
        {children && <div className="mt-3">{children}</div>}
      </div>
    </section>
  );
}
