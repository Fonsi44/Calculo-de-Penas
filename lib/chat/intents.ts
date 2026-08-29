/**
 * Detección de intención del chat (compartida entre motor de reglas y router).
 */

export type Intencion =
  | 'saludo'
  | 'servicios'
  | 'ubicacion'
  | 'horario'
  | 'contacto'
  | 'preparar_consulta'
  | 'caso_urgente'
  | 'identificar_area'
  | 'checklist'
  | 'whatsapp'
  | 'formulario'
  | 'privacidad'
  | 'migrantes'
  | 'no_entendido';

/** Intenciones que el router trata como consultas sobre el sitio/despacho. */
export const SITE_INTENCIONES = new Set<Intencion>([
  'saludo',
  'servicios',
  'ubicacion',
  'horario',
  'contacto',
  'preparar_consulta',
  'caso_urgente',
  'identificar_area',
  'checklist',
  'whatsapp',
  'formulario',
  'privacidad',
  'migrantes',
]);

const INTENCION_PATTERNS: Array<{ intencion: Intencion; patrones: RegExp[] }> = [
  {
    intencion: 'saludo',
    patrones: [
      /^\s*(hola|buenos\s+d[ií]as|buenas\s+tardes|buenas\s+noches|hi|hello)\b/i,
      /^\s*(saludos|qué\s+tal|que\s+tal)\b/i,
    ],
  },
  {
    intencion: 'caso_urgente',
    patrones: [
      /\burgente\b|\bemergencia\b/i,
      /caso\s+urgente/i,
      /ayuda\s+urgente/i,
    ],
  },
  {
    intencion: 'privacidad',
    patrones: [
      /\bprivacidad\b|\bdatos\s+personales\b/i,
      /qu[eé]\s+hacen\s+con\s+(mis\s+)?datos/i,
      /seguridad\s+(de\s+)?(mis\s+)?(datos|informaci[oó]n)/i,
      /\bRGPD\b|\bLOPD\b/i,
    ],
  },
  {
    intencion: 'preparar_consulta',
    patrones: [
      /preparar\s+(consulta|resumen|caso|mensaje)/i,
      /resumen\s+(de\s+)?(preconsulta|consulta|caso)/i,
      /c[oó]mo\s+(preparo|preparar|presento)/i,
      /quiero\s+(preparar|presentar|iniciar)/i,
    ],
  },
  {
    intencion: 'identificar_area',
    patrones: [
      /identificar\s+(el\s+)?(área|area|rama|tipo)/i,
      /no\s+s[eé]\s+qu[eé]\s+(necesito|tipo|área|area)/i,
      /qu[eé]\s+(área|area|rama|tipo)\s+(necesito|correspon)/i,
      /qu[eé]\s+servicio\s+necesito/i,
      /no\s+sa[bé]?\s+qu[eé]\s+(tipo|área|area)/i,
    ],
  },
  {
    intencion: 'checklist',
    patrones: [
      /checklist|lista\s+de\s+documentos|documentos\s+necesarios/i,
      /qu[eé]\s+(documentos|papeles|papeleo)\s+(llevar|necesito|tengo)/i,
      /qu[eé]\s+llevar/i,
      /documentos\s+para\s+(un\s+)?(caso|asunto)/i,
    ],
  },
  {
    intencion: 'whatsapp',
    patrones: [
      /\bwhatsapp\b|\bwa\.me\b/i,
      /hablar\s+por\s+(whatsapp|mensaje|chat)/i,
      /escribir\s+por\s+(whatsapp|mensaje)/i,
      /n[uú]mero\s+de\s+(whatsapp|tel[eé]fono|contacto)/i,
    ],
  },
  {
    intencion: 'formulario',
    patrones: [
      /\bformulario\b/i,
      /c[oó]mo\s+(solicito|pido)\s+(consulta|cita)/i,
      /d[oó]nde\s+(está|esta)\s+el\s+formulario/i,
      /enviar\s+(consulta|solicitud)/i,
    ],
  },
  {
    intencion: 'ubicacion',
    patrones: [
      /d[oó]nde\s+(está|estan|se\s+encuentran|quedan|ubicados)/i,
      /\bubicaci[oó]n\b|\bdirecci[oó]n\b/i,
      /c[oó]mo\s+(llegar|llego)/i,
      /\bnacaome\b.*\bd[oó]nde/i,
      /\bmapa\b/i,
    ],
  },
  {
    intencion: 'horario',
    patrones: [
      /\bhorario\b|\bhora\s+de\s+atenci[oó]n\b/i,
      /cu[aá]ndo\s+(atienden|abren|está|estan)/i,
      /está\s+abierto|estan\s+abiertos/i,
      /qu[eé]\s+(d[ií]as|horas)\s+atienden/i,
    ],
  },
  {
    intencion: 'contacto',
    patrones: [
      /\bcontacto\b|\bcontactar\b|\btel[eé]fono\b|\bcorreo\b|\bemail\b/i,
      /c[oó]mo\s+(contacto|comunico|llamo|contactarlos|contactarles)/i,
      /n[uú]mero\s+de\s+(tel[eé]fono|contacto)/i,
      /pasar\s+(al\s+)?despacho/i,
      /c[oó]mo\s+puedo\s+(contactarlos|comunicarme|llamarlos)/i,
    ],
  },
  {
    intencion: 'migrantes',
    patrones: [
      /hondure[ñn]o\s+en\s+espa[ñn]a/i,
      /\bespa[ñn]a\b/i,
      /\bmigrante\b|\bmigraci[oó]n\b/i,
      /\bvisa\b|\bresidencia\b|\bnaturalizaci[oó]n\b|\bnacionalidad\b/i,
      /reagrupaci[oó]n\s+familiar/i,
    ],
  },
  {
    intencion: 'servicios',
    patrones: [
      /\bservicios?\b|\báreas?\b|\bareas?\b|\brama/i,
      /qu[eé]\s+servicios?\s+(tienen|ofrecen|manejan|atienden)/i,
      /a\s+qu[eé]\s+se\s+dedican/i,
      /\babogado\s+(penalista?|de\s+familia|laboralista?|civil)/i,
      /especialidad|especialidades/i,
    ],
  },
];

/** Primera coincidencia gana; `no_entendido` si ninguna aplica. */
export function detectIntencion(message: string): Intencion {
  const text = message ?? '';
  for (const { intencion, patrones } of INTENCION_PATTERNS) {
    if (patrones.some((re) => re.test(text))) {
      return intencion;
    }
  }
  return 'no_entendido';
}
