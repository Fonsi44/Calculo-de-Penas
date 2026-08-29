/**
 * Flujo guiado «Preparar consulta» (cliente, sin asesoría jurídica).
 */

import { generarMensajeWhatsApp } from './preconsulta';
import type { ChatLink, ChatSuggestion } from './response-meta';

export type ConsultationFlowState = {
  step: 1 | 2 | 3;
  area?: string;
  location?: string;
};

export const CONSULTATION_FLOW_CHIP = 'Preparar consulta';

export const CONSULTATION_AREA_CHIPS = [
  'Penal',
  'Familia',
  'Laboral',
  'Civil',
  'Mercantil',
  'Migratorio',
  'Otro',
] as const;

export const CONSULTATION_LOCATION_CHIPS = ['Honduras', 'España', 'Otro país'] as const;

export function isConsultationFlowStart(message: string): boolean {
  const t = message.trim().toLowerCase();
  return (
    t === CONSULTATION_FLOW_CHIP.toLowerCase() ||
    t === 'preparar mi consulta' ||
    t === 'quiero preparar mi consulta'
  );
}

export function startConsultationFlow(): {
  flow: ConsultationFlowState;
  reply: string;
  suggestions: ChatSuggestion[];
} {
  return {
    flow: { step: 1 },
    reply:
      '**Paso 1 de 3 — Área**\n\n' +
      'Perfecto. Para orientar al despacho, ¿qué tipo de asunto es? Elija una opción o escríbala con sus palabras.',
    suggestions: CONSULTATION_AREA_CHIPS.map((label) => ({
      id: `flow-area-${label}`,
      label,
      message: label,
    })),
  };
}

function normalizeArea(input: string): string {
  const t = input.trim().toLowerCase();
  const map: Record<string, string> = {
    penal: 'derecho penal',
    familia: 'derecho de familia',
    laboral: 'derecho laboral',
    civil: 'derecho civil',
    mercantil: 'derecho mercantil',
    migratorio: 'derecho migratorio',
    otro: 'consulta general',
  };
  return map[t] ?? input.trim();
}

function normalizeLocation(input: string): string {
  const t = input.trim().toLowerCase();
  if (t.includes('espa')) return 'España';
  if (t.includes('hondur')) return 'Honduras';
  if (t.includes('otro')) return 'otro país';
  return input.trim();
}

export type ConsultationFlowResult =
  | {
      kind: 'continue';
      flow: ConsultationFlowState;
      reply: string;
      suggestions: ChatSuggestion[];
      links?: ChatLink[];
    }
  | {
      kind: 'complete';
      flow: null;
      reply: string;
      whatsappDraft: string;
      suggestions: ChatSuggestion[];
      links: ChatLink[];
    };

export function advanceConsultationFlow(
  flow: ConsultationFlowState,
  userInput: string,
): ConsultationFlowResult {
  const text = userInput.trim();
  if (!text) {
    return {
      kind: 'continue',
      flow,
      reply: 'Escriba una respuesta breve o elija una de las opciones.',
      suggestions: flow.step === 1
        ? CONSULTATION_AREA_CHIPS.map((label) => ({ id: `flow-area-${label}`, label, message: label }))
        : CONSULTATION_LOCATION_CHIPS.map((label) => ({ id: `flow-loc-${label}`, label, message: label })),
    };
  }

  if (flow.step === 1) {
    return {
      kind: 'continue',
      flow: { step: 2, area: normalizeArea(text) },
      reply:
        '**Paso 2 de 3 — Ubicación**\n\n' +
        '¿Desde dónde nos consulta? Esto ayuda al despacho a orientar el primer contacto.',
      suggestions: CONSULTATION_LOCATION_CHIPS.map((label) => ({
        id: `flow-loc-${label}`,
        label,
        message: label,
      })),
    };
  }

  if (flow.step === 2) {
    return {
      kind: 'continue',
      flow: { step: 3, area: flow.area, location: normalizeLocation(text) },
      reply:
        '**Paso 3 de 3 — Resumen**\n\n' +
        'Describa en 2–4 frases qué necesita (fechas clave si las hay). ' +
        'No incluya datos innecesarios ni conclusiones legales: un abogado revisará su caso.',
      suggestions: [],
      links: [{ label: 'Solicitar consulta', href: '/solicitar-consulta' }],
    };
  }

  const whatsappDraft = generarMensajeWhatsApp({
    area: flow.area ?? 'un asunto legal',
    ciudad: flow.location ?? 'Honduras',
    descripcion: text,
  });

  return {
    kind: 'complete',
    flow: null,
    reply:
      '**Resumen listo**\n\n' +
      'He preparado un mensaje para WhatsApp. Revíselo, adáptelo si hace falta y envíelo al despacho. ' +
      'Un abogado le indicará los siguientes pasos tras la evaluación inicial confidencial.',
    whatsappDraft,
    suggestions: [
      { id: 'flow-form', label: 'Ir al formulario', message: 'Ir al formulario' },
    ],
    links: [
      { label: 'Solicitar consulta', href: '/solicitar-consulta' },
      { label: 'Preguntas frecuentes', href: '/preguntas-frecuentes' },
    ],
  };
}

export function isActiveConsultationFlow(
  flow: ConsultationFlowState | null | undefined,
): flow is ConsultationFlowState {
  return Boolean(flow && flow.step >= 1 && flow.step <= 3);
}
