/**
 * Helpers para el editor de blog:
 * - extracción automática de tags
 * - estimación de tiempo de lectura
 * - imagen de portada por categoría
 */

/** Palabras clave legales indexadas por categoría y genéricas */
const CATEGORY_TAGS: Record<string, string[]> = {
  'derecho-penal': ['defensa penal', 'código penal', 'homicidio', 'delito', 'condena', 'prisión', 'medidas cautelares', 'tribunal', 'sentencia penal', 'ministerio público'],
  'proceso-penal': ['audiencia inicial', 'etapa intermedia', 'juicio oral', 'sobreseimiento', 'recursos penales', 'prisión preventiva', 'imputado', 'juez penal'],
  'derecho-de-familia': ['divorcio', 'custodia', 'pensión alimenticia', 'sucesiones', 'unión de hecho', 'adopción', 'herencia', 'régimen de visitas'],
  'derecho-laboral': ['despido', 'prestaciones', 'cesantía', 'aguinaldo', 'vacaciones', 'horas extra', 'riesgos profesionales', 'contrato laboral'],
  'derecho-civil': ['contrato', 'inmueble', 'propiedad', 'deuda', 'prescripción', 'usucapión', 'testamento', 'obligaciones'],
  'derecho-mercantil': ['sociedad anónima', 'registro mercantil', 'marca', 'patente', 'competencia', 'comerciante', 'título valor'],
  'extranjeria-migracion': ['residencia', 'visa', 'naturalización', 'migración', 'extranjería', 'pasaporte', 'permiso de trabajo'],
  'hondurenos-en-espana': ['Honduras', 'España', 'extranjería', 'documentos', 'legalización', 'consulado', 'nacionalidad española'],
  'derecho-notarial': ['notario', 'escritura pública', 'protocolización', 'poder', 'testimonio', 'acta notarial'],
  'tributario': ['SAR', 'impuesto', 'ISR', 'ISV', 'fiscalización', 'contribuyente', 'declaración', 'renta'],
  'noticias-legales': ['reforma legal', 'actualidad jurídica', 'legislación', 'decreto', 'gaceta', 'nueva ley'],
  'practica-legal': ['abogado', 'consulta legal', 'bufete', 'honorarios', 'procedimiento', 'consejos legales'],
  'derechos-ciudadanos': ['derechos humanos', 'garantías constitucionales', 'amparo', 'petición', 'libertad', 'constitución'],
  'derecho-bancario': ['ejecución hipotecaria', 'tarjeta de crédito', 'deuda bancaria', 'CNBS', 'consumidor financiero'],
  'derecho-administrativo': ['contratación pública', 'expropiación', 'sanción administrativa', 'contencioso', 'Estado'],
  'derecho-aduanero': ['importación', 'exportación', 'aduana', 'arancel', 'selectividad', 'tránsito aduanero'],
  'regulacion-sanitaria': ['registro sanitario', 'ARSA', 'medicamento', 'clínica', 'responsabilidad médica', 'farmacéutico'],
  'propiedad-intelectual': ['marca registrada', 'derechos de autor', 'patente', 'competencia desleal', 'propiedad industrial'],
  'derecho-ambiental': ['licencia ambiental', 'impacto ambiental', 'delitos ecológicos', 'MiAmbiente', 'derechos indígenas'],
  'conciliacion-arbitraje': ['arbitraje', 'mediación', 'conciliación', 'laudo arbitral', 'CCIC', 'resolución de conflictos'],
};

const GENERIC_LEGAL_TERMS = [
  'abogado', 'Honduras', 'ley', 'derecho', 'legal', 'código', 'jurídico',
  'procedimiento', 'demanda', 'juez', 'tribunal', 'sentencia', 'recurso',
  'Pineda y Asociados', 'consulta legal', 'bufete',
];

/** Extrae tags relevantes del contenido basándose en la categoría + frecuencia de palabras */
export function extractTags(title: string, description: string, body: string, category: string): string[] {
  const categoryTags = CATEGORY_TAGS[category] ?? [];
  const text = `${title} ${description} ${stripHtml(body)}`.toLowerCase();

  const matched: string[] = [];

  for (const tag of categoryTags) {
    if (text.includes(tag.toLowerCase())) {
      matched.push(tag);
    }
  }

  for (const term of GENERIC_LEGAL_TERMS) {
    if (text.includes(term.toLowerCase())) {
      matched.push(term);
    }
  }

  const unique = [...new Set(matched)];
  return unique.slice(0, 8);
}

/** Estima el tiempo de lectura basado en conteo de palabras (200 wpm) */
export function estimateReadingTime(body: string): string {
  const text = stripHtml(body);
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 200));
  return `${minutes} min`;
}

/** Asigna una imagen de portada según la categoría */
export function getCoverImage(category: string): string {
  const imageMap: Record<string, string> = {
    'derecho-penal': '/images/blog/defensa-penal.webp',
    'proceso-penal': '/images/blog/diferencia-denuncia-querella-acusacion-honduras.webp',
    'derecho-de-familia': '/images/blog/problemas-familiares.webp',
    'derecho-laboral': '/images/blog/despido-laboral.webp',
    'derecho-civil': '/images/blog/poder-legal-honduras-cuando-se-necesita.webp',
    'derecho-mercantil': '/images/blog/servicios-empresariales.webp',
    'extranjeria-migracion': '/images/blog/permiso-trabajo-extranjeros-honduras.webp',
    'hondurenos-en-espana': '/images/blog/hondurenos-en-espana-guia-legal-completa.webp',
    'derecho-notarial': '/images/blog/tramites-notariales-frecuentes-honduras.webp',
    'tributario': '/images/blog/sar-notifica-fiscalizacion-que-hacer-honduras.webp',
    'noticias-legales': '/images/blog/actualizacion-legislativa-mensual-honduras.webp',
    'practica-legal': '/images/blog/costos-honorarios-abogados-como-funcionan-honduras.webp',
    'derechos-ciudadanos': '/images/blog/derechos-del-detenido-guia-constitucional-honduras.webp',
    'derecho-bancario': '/images/blog/tarjetas-credito-intereses-cargos-defensa-honduras.webp',
    'derecho-administrativo': '/images/blog/sanciones-administrativas-como-defenderse-honduras.webp',
    'derecho-aduanero': '/images/blog/importar-mercancias-guia-legal-aduanera-honduras.webp',
    'regulacion-sanitaria': '/images/blog/registro-sanitario-alimentos-arsa-paso-a-paso-honduras.webp',
    'propiedad-intelectual': '/images/blog/registrar-marca-paso-a-paso-honduras.webp',
    'derecho-ambiental': '/images/blog/licencia-ambiental-categorias-plazos-honduras.webp',
    'conciliacion-arbitraje': '/images/blog/mediacion-vs-juicio-que-conviene-mas-honduras.webp',
  };
  return imageMap[category] ?? '/images/blog/pineda-asociados-bufete-multidisciplinario-honduras.webp';
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, '');
}
