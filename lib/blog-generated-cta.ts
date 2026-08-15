export const MID_POST_CTA_SLUGS: ReadonlySet<string> = new Set([
  'defensa-penal-honduras',
  'abogado-penalista-sur-honduras',
  'despido-laboral-honduras-guia-completa',
  'divorcio-honduras-guia-completa',
  'pension-alimenticia-honduras-guia-completa',
  'abogados-en-choluteca',
  'danos-perjuicios-indemnizacion-honduras',
  'prescripcion-deudas-plazos-honduras',
  'pension-alimenticia-porcentaje-honduras-2026',
  'estafas-fraudes-tipos-penales-honduras',
  'poder-notarial-honduras-tipos-requisitos',
  'custodia-hijos-honduras-juez',
  'pension-alimenticia-honduras-como-solicitarla',
  'que-hacer-si-me-detienen-en-honduras',
  'detencion-familiar-nacaome-primeras-horas',
  'audiencia-inicial-juzgados-valle',
  'pension-alimenticia-nacaome-documentos',
  'custodia-visitas-juzgado-valle',
  'despido-valle-documentos-evaluacion',
  'prestaciones-puerto-san-lorenzo',
  'defensa-penal-choluteca-desde-nacaome',
  'tramite-aduanero-guasaule-abogado',
  'contrato-compraventa-nacaome-revision',
  'preparar-visita-oficina-nacaome',
  'medidas-sustitutivas-prision-preventiva-honduras',
  'derechos-detenido-honduras-guia-constitucional',
  'calcular-prestaciones-laborales-honduras',
  'despido-injustificado-honduras-derechos-trabajador',
  'acoso-laboral-mobbing-honduras',
  'delitos-mas-comunes-honduras',
  'violencia-domestica-ruta-legal-honduras',
  'audiencia-inicial-proceso-penal-honduras',
  'compraventa-inmuebles-aspectos-legales-honduras',
  'contratos-arrendamiento-derechos-obligaciones-honduras',
  'derechos-laborales-basicos-honduras',
  'derechos-trabajadora-embarazada-honduras',
  'testamentos-sucesiones-herencia-honduras',
  'calcular-liquidacion-laboral-honduras',
  'abogado-penalista-choluteca',
  'divorcio-choluteca',
  'abogado-civil-choluteca',
  'cuando-necesito-abogado-penalista-honduras',
  'empleador-no-paga-salario-honduras',
  'clausulas-abusivas-contratos-como-detectar-honduras',
  'usucapion-prescripcion-adquisitiva-honduras',
]);

export const GENERATED_LEGAL_CTA_COPY = {
  eyebrow: 'Consulta legal',
  title: '¿Necesita orientación sobre este tema?',
  body: 'Podemos revisar su situación concreta, explicarle las opciones disponibles y, si procede, preparar un presupuesto por escrito. La evaluación inicial es confidencial. No se garantizan resultados.',
  anchor: 'Solicitar una evaluación inicial confidencial',
} as const;

export function injectMidArticleCta(body: string, slug: string): string {
  if (slug === 'abogados-en-nacaome') {
    const informationalLink = `
<aside class="my-7 rounded-lg border border-accent/30 bg-surface-alt p-4">
  <p class="text-sm text-text-secondary leading-relaxed">Si después de comparar especialidad, comunicación y presupuesto necesita valorar su situación concreta, puede <a href="/" class="font-semibold text-primary hover:text-accent-dark">consultar con un abogado en Nacaome</a> y conocer el despacho, sus áreas y sus profesionales responsables.</p>
</aside>`;
    return body.includes('consultar con un abogado en Nacaome')
      ? body
      : `${body}${informationalLink}`;
  }

  if (!MID_POST_CTA_SLUGS.has(slug)) return body;
  if (body.includes('/solicitar-consulta')) return body;

  const paragraphEndPositions = [...body.matchAll(/<\/p>/gi)]
    .map((match) => match.index + match[0].length);
  const targetIndex = paragraphEndPositions.length >= 3
    ? Math.max(1, Math.floor(paragraphEndPositions.length * 0.65) - 1)
    : -1;
  const ctaHtml = `
<aside class="my-7 rounded-lg border border-accent/30 bg-surface-alt p-4">
  <p class="text-xxs font-bold uppercase tracking-wider text-accent-dark mb-1">${GENERATED_LEGAL_CTA_COPY.eyebrow}</p>
  <p class="text-sm font-semibold text-text mb-1">${GENERATED_LEGAL_CTA_COPY.title}</p>
  <p class="text-sm text-text-secondary leading-relaxed mb-2">${GENERATED_LEGAL_CTA_COPY.body}</p>
  <a href="/solicitar-consulta#formulario" data-event-name="seo_blog_cta_click" data-cta-location="blog_inline" data-cta-topic="${slug}" class="text-sm font-semibold text-primary hover:text-accent-dark">${GENERATED_LEGAL_CTA_COPY.anchor}</a>
</aside>`;

  if (targetIndex < 0) return `${body}${ctaHtml}`;
  const insertionPoint = paragraphEndPositions[targetIndex];
  return `${body.slice(0, insertionPoint)}${ctaHtml}${body.slice(insertionPoint)}`;
}
