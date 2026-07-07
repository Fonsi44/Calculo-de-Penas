/**
 * Módulo de preconsulta legal para el chat asistente.
 *
 * Proporciona utilidades HEURÍSTICAS (no bloqueantes) para enriquecer la UX
 * del chat sin sustituir el razonamiento del LLM:
 *   - Detección de área legal probable por keywords (para quick reply CTAs).
 *   - Checklists documentales orientativos por área.
 *   - Plantilla de mensaje para WhatsApp/correo.
 *
 * PRINCIPIO LEGAL: ninguna de estas funciones emite un dictamen. La
 * clasificación es siempre provisional ("podría tratarse de…") y los
 * checklists son orientativos, no vinculantes. El LLM y el system prompt
 * son la fuente de la respuesta conversacional; este módulo solo aporta
 * utilidades de presentación.
 *
 * No se exporta al cliente salvo las constantes de checklists (puras).
 */

/**
 * Áreas legales reconocidas por el asistente de preconsulta.
 * Deben coincidir con las áreas de data/areas-juridicas.ts.
 */
export type AreaLegal =
  | 'penal'
  | 'familia'
  | 'laboral'
  | 'civil'
  | 'mercantil'
  | 'migratorio'
  | 'administrativo'
  | 'tributario'
  | 'bancario'
  | 'propiedad_intelectual'
  | 'ambiental'
  | 'conciliacion_arbitraje'
  | 'general';

/**
 * Keywords heurísticas para sugerir un área legal probable.
 * La primera coincidencia gana (orden por especificidad).
 * NO es un clasificador jurídico: es una sugerencia de navegación.
 */
const AREA_KEYWORDS: Array<{ area: AreaLegal; palabras: string[] }> = [
  {
    area: 'penal',
    palabras: ['detenci', 'detuvieron', 'denuncia', 'audiencia', 'citaci', 'delito', 'crimen', 'prisi', 'pena', 'acusaci', 'fiscal', 'juez penal', 'allanamiento', 'robo', 'homicidio', 'estafa', 'fraude', 'lesiones', 'violencia'],
  },
  {
    area: 'familia',
    palabras: ['divorcio', 'divorciarme', 'divorciarse', 'divorciar', 'custodia', 'pensión alimenticia', 'pension alimenticia', 'alimentos', 'guarda', 'régimen de visitas', 'regimen de visitas', 'adopción', 'adopcion', 'unión de hecho', 'union de hecho', 'separación', 'separacion', 'matrimonio', 'violencia intrafamiliar', 'violencia doméstica'],
  },
  {
    area: 'laboral',
    palabras: ['derecho laboral', 'laboral', 'despido', 'despidieron', 'prestaciones', 'liquidación', 'liquidacion', 'salario', 'sueldo', 'acoso laboral', 'mobbing', 'contrato de trabajo', 'jornada', 'horas extra', 'vacaciones', 'reinvidicación laboral', 'sindicato'],
  },
  {
    area: 'civil',
    palabras: ['contrato civil', 'compraventa', 'herencia', 'testamento', 'sucesión', 'sucesion', 'poder notarial', 'escritura', 'usucapión', 'usucapion', 'arrendamiento', 'alquiler', 'daños y perjuicios', 'danos y perjuicios', 'responsabilidad civil'],
  },
  {
    area: 'mercantil',
    palabras: ['sociedad', 'sociedades', 'constituir empresa', 'fusión', 'fusion', 'contrato mercantil', 'franquicia', 'marca registrada', 'comercial', 'corporativo', 'compliance'],
  },
  {
    area: 'migratorio',
    palabras: ['visa', 'residencia', 'naturalización', 'naturalizacion', 'nacionalidad', 'hondureño en españa', 'hondureno en espana', 'migrante', 'migración', 'migracion', 'refugio', 'asilo', 'reagrupación', 'reagrupacion', 'pasaporte'],
  },
  {
    area: 'administrativo',
    palabras: ['recursos administrativo', 'amparo', 'servicio civil', 'empleado público', 'empleado publico', 'licitación', 'licitacion', 'sanción administrativa', 'sancion administrativa', 'estado'],
  },
  {
    area: 'tributario',
    palabras: ['impuesto', 'ISR', 'ISV', 'factura electrónica', 'factura electronica', 'declaración', 'declaracion', 'SAR', 'fiscal', 'tributo', 'IVA'],
  },
  {
    area: 'bancario',
    palabras: ['banco', 'préstamo', 'prestamo', 'hipoteca', 'ejecución hipotecaria', 'ejecucion hipotecaria', 'tarjeta de crédito', 'tarjeta de credito', 'central de riesgo', 'reestructura', 'deuda bancaria', 'CNBS'],
  },
  {
    area: 'propiedad_intelectual',
    palabras: ['marca', 'patente', 'derechos de autor', 'propiedad intelectual', 'competencia desleal', 'registro de marca', 'infracción', 'infraccion'],
  },
  {
    area: 'ambiental',
    palabras: ['licencia ambiental', 'impacto ambiental', 'MiAmbiente', 'regulación ambiental', 'regulacion ambiental', 'permiso ambiental'],
  },
  {
    area: 'conciliacion_arbitraje',
    palabras: ['conciliación', 'conciliacion', 'arbitraje', 'mediación', 'mediacion', 'centro de conciliación', 'centro de conciliacion', 'CCIC'],
  },
];

/**
 * Sugiere un área legal probable basándose en keywords del mensaje.
 * Devuelve null si no hay coincidencia clara (área general).
 * NUNCA usar como afirmación: siempre como "podría tratarse de…".
 */
export function sugerirAreaLegal(mensaje: string): AreaLegal | null {
  const text = (mensaje ?? '').toLowerCase();
  for (const { area, palabras } of AREA_KEYWORDS) {
    if (palabras.some((p) => text.includes(p.toLowerCase()))) {
      return area;
    }
  }
  return null;
}

/**
 * Checklists documentales ORIENTATIVOS por área.
 * El despacho indicará la documentación específica tras la primera revisión.
 * Estas listas son generales, no constituyen asesoría jurídica.
 */
export const CHECKLISTS_DOCUMENTALES: Record<Exclude<AreaLegal, 'general'>, string[]> = {
  penal: [
    'Citación, denuncia o acta policial',
    'Fecha y hora de la audiencia',
    'Juzgado o fiscalía que conoce del caso',
    'Nombre del abogado defensor anterior (si lo hubo)',
    'Documentos de identidad',
  ],
  familia: [
    'Partidas de nacimiento de los hijos (si aplica)',
    'Documentos de identidad',
    'Resoluciones o actas previas (si las hay)',
    'Comprobantes de gastos (alimentos, educación, salud)',
    'Certificado de matrimonio o unión de hecho (si aplica)',
  ],
  laboral: [
    'Contrato de trabajo',
    'Recibos de salario',
    'Carta de despido (si la hay)',
    'Mensajes o correos relevantes',
    'Fechas de ingreso y salida del empleo',
  ],
  civil: [
    'Contrato o escritura relevante',
    'Recibos de pago',
    'Poderes notariales (si aplican)',
    'Documentos registrales',
    'Identificación de las partes',
  ],
  mercantil: [
    'Escritura de constitución de la sociedad',
    'Registro tributario (RTN)',
    'Contratos comerciales relevantes',
    'Estados financieros (si aplican)',
    'Documentos del registro mercantil',
  ],
  migratorio: [
    'Pasaporte y documentos de identidad vigentes',
    'Visa o permiso de residencia actual (si aplica)',
    'Documentos de soporte (laborales, familiares, económicos)',
    'Antecedentes penales (si se solicitan)',
    'Comprobantes de domicilio',
  ],
  administrativo: [
    'Resolución administrativa recurrida',
    'Notificaciones recibidas',
    'Documentos de identidad',
    'Historial del expediente administrativo',
  ],
  tributario: [
    'RTN y declaraciones presentadas',
    'Notificaciones del SAR',
    'Facturas y libros contables',
    'Estados financieros',
  ],
  bancario: [
    'Contrato de préstamo o tarjeta',
    'Estados de cuenta',
    'Notificaciones del banco o central de riesgo',
    'Comprobantes de pago',
  ],
  propiedad_intelectual: [
    'Registro de marca o patente (si existe)',
    'Evidencia del uso o infracción',
    'Documentos de titularidad',
  ],
  ambiental: [
    'Licencia ambiental actual (si aplica)',
    'Estudio de impacto ambiental',
    'Permisos sectoriales',
    'Notificaciones de MiAmbiente',
  ],
  conciliacion_arbitraje: [
    'Contrato principal del conflicto',
    'Correspondencia entre las partes',
    'Documentos de soporte de la pretensión',
    'Identificación de las partes',
  ],
};

/**
 * Genera un mensaje preliminar para WhatsApp/correo basado en datos que el
 * usuario haya aportado voluntariamente. El mensaje es prudente, no incluye
 * conclusiones legales y deja marcadores [ ] donde falte información.
 *
 * @param datos Datos opcionales aportados por el usuario.
 * @returns Texto listo para copiar/pegar en WhatsApp. El usuario debe revisarlo.
 */
export function generarMensajeWhatsApp(datos: {
  area?: string | null;
  ciudad?: string | null;
  descripcion?: string | null;
  fecha?: string | null;
  documentos?: string | null;
}): string {
  const area = datos.area?.trim() || 'un asunto legal';
  const ciudad = datos.ciudad?.trim() || 'Nacaome';
  const descripcion = datos.descripcion?.trim() || '[describa brevemente su situación]';
  const fecha = datos.fecha?.trim() || '[fecha si la hubiera]';
  const documentos = datos.documentos?.trim() || '[documentos que tiene]';

  return (
    `Hola, quiero consultar ${area} en ${ciudad}. ` +
    `Resumen: ${descripcion}. ` +
    (datos.fecha ? `Fecha relevante: ${fecha}. ` : '') +
    `Documentos disponibles: ${documentos}. ` +
    `¿Podrían indicarme si pueden revisar mi caso?`
  );
}
