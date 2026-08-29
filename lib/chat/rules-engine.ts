/**
 * Motor de respuestas local basado en reglas (sin LLM externo).
 *
 * PROPÓSITO: proporcionar un asistente de preconsulta funcional sin
 * depender de DeepSeek ni ningún proveedor de IA. Reduce riesgos de
 * privacidad (no transmite mensajes a terceros), de alucinación y de
 * dependencia operativa.
 *
 * ARQUITECTURA: detección de intención por keywords → plantilla de
 * respuesta prudente. Combina el clasificador de área legal y el
 * detector de urgencia de preconsulta.ts/guardrails.ts.
 *
 * LÍMITES LEGALES: igual que el system prompt del LLM, las respuestas
 * nunca emiten dictámenes, no prometen resultados, usan lenguaje
 * provisional ("podría tratarse de…") y derivan a contacto humano ante
 * cualquier caso que requiera valoración profesional.
 */

import { site } from '../site';
import { PUBLIC_SERVICE_CATALOG } from '../public-service-catalog';
import { detectUrgency } from './guardrails';
import { detectIntencion, type Intencion } from './intents';
import {
  sugerirAreaLegal,
  generarMensajeWhatsApp,
  CHECKLISTS_DOCUMENTALES,
  type AreaLegal,
} from './preconsulta';

/** Intenciones reconocidas por el motor de reglas. */
export type { Intencion } from './intents';

/** Resultado del motor de reglas. */
export interface RulesEngineResult {
  reply: string;
  source: 'rules';
  urgent: boolean;
  area: AreaLegal | null;
  intencion: Intencion;
}

/**
 * Plantillas de respuesta por intención. Todas usan lenguaje prudente,
 * derivan a contacto cuando procede y nunca emiten dictámenes.
 */
function respuestaPorIntencion(
  intencion: Intencion,
  area: AreaLegal | null,
  urgent: boolean,
  mensajeUsuario: string,
): string {
  // Si hay urgencia, se prioriza independientemente de la intención detectada.
  if (urgent) {
    return (
      'Su caso parece urgente. Le recomiendo contactar ahora mismo con el despacho por WhatsApp o teléfono para recibir atención inmediata. ' +
      `WhatsApp: ${site.whatsappDisplay}. Teléfono: ${site.phoneDisplay}. ` +
      'No pierda tiempo en el chat: un abogado puede ayudarle desde ya.'
    );
  }

  switch (intencion) {
    case 'saludo':
      return (
        `Hola, soy el asistente virtual de Pineda y Asociados (sistema automatizado, no abogado). ` +
        'Le ayudo a identificar el área legal de su consulta y a preparar un resumen inicial. ' +
        '¿Quiere que le ayude a identificar el área, preparar un mensaje para WhatsApp o ver los servicios? ' +
        'Use los botones rápidos para empezar.'
      );

    case 'servicios':
      return (
        `El catálogo público presenta ${PUBLIC_SERVICE_CATALOG.length} áreas de práctica del bufete. ` +
        'Puede ver el catálogo completo en la sección "Servicios Jurídicos" del menú. ¿Quiere que le ayude a identificar ' +
        'qué área corresponde a su consulta?'
      );

    case 'ubicacion':
      return (
        `El despacho está en Nacaome, Valle (Honduras). Dirección: ${site.address.line1}, ${site.address.line2}. ` +
        'Puede ver el mapa y las indicaciones en la sección "Cómo llegar" del menú. ' +
        'Atendemos con cita previa para garantizar confidencialidad.'
      );

    case 'horario':
      return `Nuestro horario de atención es: ${site.hours}. Atendemos con cita previa para garantizar confidencialidad y dedicación a cada caso.`;

    case 'contacto':
      return (
        `Puede contactar con el despacho por: WhatsApp ${site.whatsappDisplay}, teléfono ${site.phoneDisplay}, ` +
        `o correo ${site.email}. También puede usar el formulario de consulta en la sección "Solicitar consulta". ` +
        '¿Quiere que le ayude a preparar un mensaje breve para WhatsApp?'
      );

    case 'preparar_consulta':
      return (
        'Le ayudo a preparar un resumen. Para que sea útil al despacho, conviene incluir: área probable ' +
        '(penal, familia, laboral, etc.), ciudad donde está, descripción breve de la situación, fechas importantes, ' +
        'y documentos que tiene. Cuando lo tenga claro, puede usar el botón "Enviar WhatsApp" y le generaré un mensaje listo. ' +
        'El resumen no incluye conclusiones legales; el despacho lo revisará y le indicará los siguientes pasos.'
      );

    case 'identificar_area': {
      const areaSugerida = area ?? sugerirAreaLegal(mensajeUsuario);
      if (areaSugerida) {
        return (
          `Por lo que describe, podría tratarse de un asunto de ${nombreAreaHumano(areaSugerida)}. ` +
          'Es solo una orientación inicial: conviene que un abogado revise los detalles de su caso concreto para confirmarlo. ' +
          '¿Quiere que le ayude a preparar un resumen para WhatsApp o ver el checklist de documentos orientativo?'
        );
      }
      return (
        'Para orientarle mejor, ¿su consulta está relacionada con un asunto penal, familiar, laboral, civil, mercantil, ' +
        'migratorio o algún otro área? Puede describir brevemente qué le trae aquí y le sugeriré el área probable.'
      );
    }

    case 'checklist': {
      const areaSugerida = area ?? sugerirAreaLegal(mensajeUsuario);
      if (areaSugerida && areaSugerida !== 'general' && CHECKLISTS_DOCUMENTALES[areaSugerida]) {
        const items = CHECKLISTS_DOCUMENTALES[areaSugerida];
        return (
          `Lista orientativa de documentos para ${nombreAreaHumano(areaSugerida)}:\n` +
          items.map((it) => `• ${it}`).join('\n') +
          '\n\nEsta lista es orientativa; el despacho le indicará qué documentación específica se necesita tras la primera revisión.'
        );
      }
      return (
        'Puedo ofrecerle un checklist orientativo según el área. ¿Su caso es de derecho penal, familiar, laboral, civil ' +
        'o mercantil? Dígame el área y le muestro los documentos que suelen ser útiles.'
      );
    }

    case 'whatsapp': {
      const areaSugerida = area ?? sugerirAreaLegal(mensajeUsuario);
      const msg = generarMensajeWhatsApp({
        area: areaSugerida ? nombreAreaHumano(areaSugerida) : null,
        ciudad: site.address.city,
      });
      return (
        `Puede escribir al despacho por WhatsApp (${site.whatsappDisplay}). ` +
        'Si quiere, aquí tiene un mensaje que puede copiar y adaptar antes de enviarlo:\n\n' +
        `"${msg}"\n\n` +
        'Recuerde revisarlo antes de enviarlo. No incluya datos sensibles innecesarios.'
      );
    }

    case 'formulario':
      return (
        'Puede solicitar una consulta en la sección "Solicitar consulta" del menú. ' +
        'El formulario le pedirá nombre (opcional), datos de contacto, motivo y un resumen breve. ' +
        'Antes de rellenarlo, puedo ayudarle a estructurar el resumen para que sea más útil al despacho.'
      );

    case 'privacidad':
      return (
        'Este asistente no almacena su conversación en base de datos: el historial vive solo en su navegador durante la sesión. ' +
        'Las consultas jurídicas informativas pueden procesarse mediante nuestro corpus legal verificado. ' +
        ' Puede consultar la política completa en el pie de página. ' +
        'Recomendación: no comparta datos especialmente sensibles (salud, credenciales, datos de menores) en el chat.'
      );

    case 'migrantes':
      return (
        'Atendemos a hondureños residentes en España en asuntos como: poderes desde España para trámites en Honduras, ' +
        'divorcios internacionales, custodia y sucesiones transfronterizas, nacionalidad y reagrupación familiar. ' +
        `Puede contactar por WhatsApp ${site.whatsappDisplay} o ver la sección "Hondureños en España" del menú.`
      );

    case 'caso_urgente':
      // Si llegó aquí sin flag urgent (porque el usuario escribió "urgente" sin más contexto),
      // se le ofrece el canal directo.
      return (
        'Si su caso es urgente (detención, audiencia próxima, violencia, plazo que vence), le recomiendo contactar ' +
        `ahora mismo por WhatsApp ${site.whatsappDisplay} o teléfono ${site.phoneDisplay}. ` +
        'No espere a que el chat le oriente: un abogado puede actuar desde ya.'
      );

    case 'no_entendido':
    default:
      // Si aunque no haya intención clara se detectó un área, se menciona
      // de forma prudente antes de derivar a contacto. Mejor UX que un
      // fallback genérico ciego.
      if (area && area !== 'general') {
        return (
          `Por lo que describe, podría tratarse de un asunto de ${nombreAreaHumano(area)}. ` +
          'Para evitar darle una orientación incorrecta, le recomiendo contactar directamente con el despacho. ' +
          `Puedo ayudarle a preparar un resumen breve para WhatsApp (${site.whatsappDisplay}) o el formulario de consulta. ` +
          '¿Quiere que le ayude con eso?'
        );
      }
      return (
        'Para evitar darle una orientación incorrecta, le recomiendo contactar directamente con el despacho. ' +
        `Puedo ayudarle a preparar un resumen breve para WhatsApp (${site.whatsappDisplay}) o el formulario de consulta. ` +
        '¿Quiere que le ayude con eso? También puede usar los botones rápidos para identificar el área o ver los servicios.'
      );
  }
}

/** Convierte el enum AreaLegal a un nombre humano legible en español. */
function nombreAreaHumano(area: AreaLegal): string {
  const nombres: Record<AreaLegal, string> = {
    penal: 'derecho penal',
    familia: 'derecho de familia',
    laboral: 'derecho laboral',
    civil: 'derecho civil y notarial',
    mercantil: 'derecho mercantil',
    migratorio: 'derecho migratorio',
    administrativo: 'derecho administrativo',
    tributario: 'derecho tributario',
    bancario: 'derecho bancario',
    propiedad_intelectual: 'propiedad intelectual',
    ambiental: 'derecho ambiental',
    conciliacion_arbitraje: 'conciliación y arbitraje',
    general: 'consulta general',
  };
  return nombres[area] ?? 'consulta general';
}

/**
 * Punto de entrada del motor de reglas. Recibe el mensaje del usuario y
 * devuelve una respuesta prudente, sin llamar a ningún proveedor externo.
 */
export function procesarMensajeLocal(mensaje: string): RulesEngineResult {
  const text = mensaje ?? '';
  const urgent = detectUrgency(text);
  const area = sugerirAreaLegal(text);

  // Detección de intención: primera coincidencia gana.
  const intencion = detectIntencion(text);

  const reply = respuestaPorIntencion(intencion, area, urgent, text);

  return {
    reply,
    source: 'rules',
    urgent,
    area,
    intencion,
  };
}
