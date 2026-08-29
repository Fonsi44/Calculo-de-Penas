/**
 * Motor de respuestas local basado en reglas (sin LLM externo).
 *
 * PROPÓSITO: orientar, preparar la consulta y derivar al despacho.
 * No sustituye asesoría jurídica ni responde contenido legal sustantivo.
 */

import { site } from '../site';
import { PUBLIC_SERVICE_CATALOG } from '../public-service-catalog';
import { detectUrgency } from './guardrails';
import type { Intencion } from './intents';
import { isSubstantiveLegalQuestion } from './legal-question-route';
import type { ChatPageContext } from './page-context';
import {
  buildChatSessionMemory,
  resolveAreaWithMemory,
  resolveIntencionWithMemory,
} from './session-memory';
import {
  sugerirAreaLegal,
  generarMensajeWhatsApp,
  CHECKLISTS_DOCUMENTALES,
  type AreaLegal,
} from './preconsulta';
import type { ChatHistoryTurn } from './response-meta';

export type { Intencion } from './intents';

export interface RulesEngineOptions {
  history?: ChatHistoryTurn[];
  pageContext?: ChatPageContext;
}

export interface RulesEngineResult {
  reply: string;
  source: 'rules';
  urgent: boolean;
  area: AreaLegal | null;
  intencion: Intencion;
  whatsappDraft?: string | null;
}

function respuestaPorIntencion(
  intencion: Intencion,
  area: AreaLegal | null,
  urgent: boolean,
  mensajeUsuario: string,
  pageContext: ChatPageContext,
): { reply: string; whatsappDraft?: string | null } {
  if (urgent) {
    return {
      reply:
        'Entiendo la urgencia. Lo más rápido es hablar con el despacho ahora:\n\n' +
        `• WhatsApp: ${site.whatsappDisplay}\n` +
        `• Teléfono: ${site.phoneDisplay}\n\n` +
        'Un abogado puede orientarle de inmediato; el chat no sustituye esa atención.',
    };
  }

  switch (intencion) {
    case 'saludo':
      return {
        reply:
          pageContext === 'migrantes'
            ? 'Hola. Le ayudo a encaminar su consulta desde el extranjero y a preparar un mensaje para el despacho. ¿Por dónde empezamos?'
            : 'Hola. Soy el asistente del despacho (automatizado, no abogado). Le ayudo a orientar su consulta y preparar el contacto con un abogado.',
      };

    case 'servicios':
      return {
        reply:
          `Contamos con ${PUBLIC_SERVICE_CATALOG.length} áreas de práctica publicadas.\n\n` +
          'Puede ver el catálogo en **Servicios jurídicos** del menú. Si me cuenta brevemente su situación, le sugiero el área más probable.',
      };

    case 'ubicacion':
      return {
        reply:
          `Estamos en Nacaome, Valle:\n${site.address.line1}, ${site.address.line2}.\n\n` +
          'En **Cómo llegar** tiene mapa e indicaciones. Atendemos con cita previa.',
      };

    case 'horario':
      return {
        reply: `Horario: ${site.hours}.\n\nRecomendamos cita previa para dedicarle tiempo con confidencialidad.`,
      };

    case 'contacto':
      return {
        reply:
          'Puede contactarnos así:\n\n' +
          `• WhatsApp: ${site.whatsappDisplay}\n` +
          `• Teléfono: ${site.phoneDisplay}\n` +
          `• Correo: ${site.email}\n\n` +
          'También puede usar el formulario **Solicitar consulta**. ¿Quiere que le prepare un mensaje para WhatsApp?',
      };

    case 'preparar_consulta':
      return {
        reply:
          'Le guío en 3 pasos para dejar un resumen útil al despacho (área, ubicación y qué necesita).\n\n' +
          'Pulse **Preparar consulta** o escríbalo: no incluye dictamen legal; un abogado revisará su caso.',
      };

    case 'identificar_area': {
      const areaSugerida = area ?? sugerirAreaLegal(mensajeUsuario);
      if (areaSugerida) {
        return {
          reply:
            `Por lo que comenta, podría tratarse de **${nombreAreaHumano(areaSugerida)}**.\n\n` +
            'Es solo una pista inicial: un abogado debe revisar su caso concreto. ¿Quiere preparar un resumen para WhatsApp?',
        };
      }
      return {
        reply:
          '¿Su asunto es más bien **penal**, **familia**, **laboral**, **civil**, **mercantil** o **migratorio**? ' +
          'Descríbalo en una frase y le oriento.',
      };
    }

    case 'checklist': {
      const areaSugerida = area ?? sugerirAreaLegal(mensajeUsuario);
      if (areaSugerida && areaSugerida !== 'general' && CHECKLISTS_DOCUMENTALES[areaSugerida]) {
        const items = CHECKLISTS_DOCUMENTALES[areaSugerida];
        return {
          reply:
            `Checklist orientativo (${nombreAreaHumano(areaSugerida)}):\n\n` +
            items.map((it) => `• ${it}`).join('\n') +
            '\n\nEl despacho confirmará qué documentos aplican a su caso.',
        };
      }
      return {
        reply:
          'Puedo mostrarle un checklist orientativo. ¿Es un asunto **penal**, **familiar**, **laboral**, **civil** o **mercantil**?',
      };
    }

    case 'whatsapp': {
      const areaSugerida = area ?? sugerirAreaLegal(mensajeUsuario);
      const msg = generarMensajeWhatsApp({
        area: areaSugerida ? nombreAreaHumano(areaSugerida) : null,
        ciudad: site.address.city,
      });
      return {
        reply:
          `Mensaje sugerido para WhatsApp (${site.whatsappDisplay}):\n\n` +
          `"${msg}"\n\n` +
          'Revíselo antes de enviarlo. Puede copiarlo con el botón debajo.',
        whatsappDraft: msg,
      };
    }

    case 'formulario':
      return {
        reply:
          'En **Solicitar consulta** puede dejar sus datos y un resumen breve.\n\n' +
          'Si quiere, antes le ayudo a estructurar ese resumen para que sea más claro para el despacho.',
      };

    case 'privacidad':
      return {
        reply:
          'Su conversación **no se guarda en base de datos**: solo permanece en este navegador mientras la pestaña siga abierta.\n\n' +
          'No comparta datos especialmente sensibles aquí. Política completa en el pie de página.',
      };

    case 'migrantes':
      return {
        reply:
          'Atendemos a hondureños en España en poderes, familia internacional, sucesiones, nacionalidad y más.\n\n' +
          `WhatsApp: ${site.whatsappDisplay}. También tiene la sección **Hondureños en España** en el menú.`,
      };

    case 'caso_urgente':
      return {
        reply:
          'Si hay detención, violencia, audiencia próxima o plazo que vence:\n\n' +
          `• WhatsApp: ${site.whatsappDisplay}\n` +
          `• Teléfono: ${site.phoneDisplay}\n\n` +
          'Contacte ahora; un abogado puede actuar de inmediato.',
      };

    case 'consulta_juridica': {
      const areaHint = area ? ` Parece relacionado con **${nombreAreaHumano(area)}**.` : '';
      return {
        reply:
          `Entiendo su pregunta.${areaHint}\n\n` +
          'No puedo darle una respuesta jurídica aquí: cada caso depende de hechos concretos. ' +
          'Lo mejor es que un abogado del despacho lo revise.\n\n' +
          '¿Quiere que le prepare un mensaje para WhatsApp o iniciar la guía de consulta?',
      };
    }

    case 'no_entendido':
    default:
      if (area && area !== 'general') {
        return {
          reply:
            `Podría tratarse de **${nombreAreaHumano(area)}**, pero prefiero no adivinar.\n\n` +
            'Un abogado puede orientarle con precisión. ¿Le preparo un resumen para WhatsApp o el formulario?',
        };
      }
      return {
        reply:
          'Para no orientarle mal, lo mejor es que un abogado del despacho revise su situación.\n\n' +
          'Puedo ayudarle a **preparar consulta**, **identificar el área** o redactar un mensaje para WhatsApp.',
      };
  }
}

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

export function procesarMensajeLocal(
  mensaje: string,
  options: RulesEngineOptions = {},
): RulesEngineResult {
  const text = mensaje ?? '';
  const history = options.history ?? [];
  const pageContext = options.pageContext ?? 'general';
  const memory = buildChatSessionMemory(history);

  const urgent = detectUrgency(text);
  const area = resolveAreaWithMemory(text, memory);

  let intencion = resolveIntencionWithMemory(text, memory);
  if (intencion === 'no_entendido' && isSubstantiveLegalQuestion(text)) {
    intencion = 'consulta_juridica';
  }

  const { reply, whatsappDraft } = respuestaPorIntencion(
    intencion,
    area,
    urgent,
    text,
    pageContext,
  );

  return {
    reply,
    source: 'rules',
    urgent,
    area,
    intencion,
    whatsappDraft: whatsappDraft ?? null,
  };
}
