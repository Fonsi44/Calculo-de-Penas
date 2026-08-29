/**
 * Chips contextuales tras cada respuesta del motor de reglas.
 */

import type { ChatPageContext } from './page-context';
import type { RulesEngineResult } from './rules-engine';
import type { ChatLink, ChatSuggestion } from './response-meta';

const BASE_CONTACT: ChatSuggestion[] = [
  { id: 'wa', label: 'Enviar WhatsApp', message: 'Enviar WhatsApp' },
  { id: 'prep', label: 'Preparar consulta', message: 'Preparar consulta' },
];

function uniqueSuggestions(items: ChatSuggestion[], max = 4): ChatSuggestion[] {
  const seen = new Set<string>();
  const out: ChatSuggestion[] = [];
  for (const item of items) {
    if (seen.has(item.label)) continue;
    seen.add(item.label);
    out.push(item);
    if (out.length >= max) break;
  }
  return out;
}

export function buildChatSuggestions(
  result: RulesEngineResult,
  pageContext: ChatPageContext,
): ChatSuggestion[] {
  const { intencion, urgent, area } = result;

  if (urgent) {
    return uniqueSuggestions([
      { id: 'urgent-wa', label: 'WhatsApp ahora', message: 'Enviar WhatsApp' },
      { id: 'urgent-call', label: 'Llamar', message: 'Quiero llamar al despacho' },
    ]);
  }

  switch (intencion) {
    case 'saludo':
      return uniqueSuggestions([
        { id: 'area', label: 'Identificar área', message: 'Identificar área legal' },
        { id: 'prep', label: 'Preparar consulta', message: 'Preparar consulta' },
        ...BASE_CONTACT,
      ]);
    case 'servicios':
      return uniqueSuggestions([
        { id: 'area', label: '¿Qué área es mi caso?', message: 'Identificar área legal' },
        { id: 'prep', label: 'Preparar consulta', message: 'Preparar consulta' },
        { id: 'wa', label: 'Enviar WhatsApp', message: 'Enviar WhatsApp' },
      ]);
    case 'ubicacion':
      return uniqueSuggestions([
        { id: 'contact', label: 'Cómo contactar', message: 'Cómo puedo contactarlos' },
        { id: 'prep', label: 'Preparar consulta', message: 'Preparar consulta' },
      ]);
    case 'horario':
      return uniqueSuggestions([
        { id: 'contact', label: 'Solicitar cita', message: 'Ir al formulario' },
        { id: 'wa', label: 'WhatsApp', message: 'Enviar WhatsApp' },
      ]);
    case 'contacto':
    case 'formulario':
      return uniqueSuggestions([
        { id: 'prep', label: 'Preparar consulta', message: 'Preparar consulta' },
        { id: 'wa', label: 'Mensaje WhatsApp', message: 'Enviar WhatsApp' },
      ]);
    case 'preparar_consulta':
      return uniqueSuggestions([
        { id: 'prep-start', label: 'Empezar guía', message: 'Preparar consulta' },
        { id: 'checklist', label: 'Checklist documentos', message: 'Checklist de documentos' },
        { id: 'wa', label: 'WhatsApp', message: 'Enviar WhatsApp' },
      ]);
    case 'identificar_area':
      return uniqueSuggestions([
        { id: 'prep', label: 'Preparar consulta', message: 'Preparar consulta' },
        { id: 'checklist', label: 'Documentos', message: 'Checklist de documentos' },
        { id: 'wa', label: 'WhatsApp', message: 'Enviar WhatsApp' },
      ]);
    case 'checklist':
      return uniqueSuggestions([
        { id: 'prep', label: 'Preparar consulta', message: 'Preparar consulta' },
        { id: 'wa', label: 'Enviar WhatsApp', message: 'Enviar WhatsApp' },
        ...(area
          ? [{ id: 'area-contact', label: 'Contactar despacho', message: 'Cómo puedo contactarlos' }]
          : []),
      ]);
    case 'whatsapp':
      return uniqueSuggestions([
        { id: 'prep', label: 'Mejorar resumen', message: 'Preparar consulta' },
        { id: 'form', label: 'Formulario', message: 'Ir al formulario' },
      ]);
    case 'migrantes':
      return uniqueSuggestions([
        { id: 'mig', label: 'Hondureños en España', message: 'Soy hondureño en España' },
        { id: 'prep', label: 'Preparar consulta', message: 'Preparar consulta' },
        { id: 'wa', label: 'WhatsApp', message: 'Enviar WhatsApp' },
      ]);
    case 'caso_urgente':
      return uniqueSuggestions([
        { id: 'wa', label: 'WhatsApp urgente', message: 'Enviar WhatsApp' },
        { id: 'call', label: 'Llamar', message: 'Quiero llamar al despacho' },
      ]);
    case 'privacidad':
      return uniqueSuggestions([
        { id: 'contact', label: 'Contactar', message: 'Cómo puedo contactarlos' },
        { id: 'prep', label: 'Preparar consulta', message: 'Preparar consulta' },
      ]);
    case 'consulta_juridica':
    case 'no_entendido':
    default:
      if (pageContext === 'migrantes') {
        return uniqueSuggestions([
          { id: 'mig', label: 'Desde España', message: 'Soy hondureño en España' },
          ...BASE_CONTACT,
        ]);
      }
      return uniqueSuggestions([
        { id: 'area', label: 'Identificar área', message: 'Identificar área legal' },
        ...BASE_CONTACT,
        { id: 'form', label: 'Formulario', message: 'Ir al formulario' },
      ]);
  }
}

export function buildChatLinks(result: RulesEngineResult): ChatLink[] {
  const links: ChatLink[] = [];
  switch (result.intencion) {
    case 'servicios':
      links.push({ label: 'Servicios jurídicos', href: '/servicios-juridicos' });
      break;
    case 'ubicacion':
      links.push({ label: 'Cómo llegar', href: '/como-llegar' });
      break;
    case 'formulario':
    case 'contacto':
      links.push({ label: 'Solicitar consulta', href: '/solicitar-consulta' });
      break;
    case 'migrantes':
      links.push({ label: 'Hondureños en España', href: '/hondurenos-en-espana' });
      break;
    case 'privacidad':
      links.push({ label: 'Política de privacidad', href: '/politica-privacidad' });
      break;
    default:
      if (result.area === 'penal') {
        links.push({ label: 'Derecho penal', href: '/derecho-penal' });
      }
      break;
  }
  if (result.intencion === 'no_entendido' || result.intencion === 'consulta_juridica') {
    links.push({ label: 'Preguntas frecuentes', href: '/preguntas-frecuentes' });
  }
  return links;
}

/** Extrae borrador WhatsApp entre comillas de la respuesta del motor. */
export function extractWhatsappDraftFromReply(reply: string): string | null {
  const match = reply.match(/"([^"]{20,})"/);
  return match?.[1]?.trim() ?? null;
}
