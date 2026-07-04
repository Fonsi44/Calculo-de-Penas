'use client';

/**
 * Eventos anónimos del chat asistente.
 *
 * Reglas (AGENTS.md §3, minimización de datos):
 *   - NUNCA se envía el contenido completo de la conversación.
 *   - Solo metadatos estructurados (acción + flags/categorías cortas).
 *   - Se reutiliza `trackEvent` de lib/analytics.ts (gtag).
 */

import { trackEvent } from '@/lib/analytics';

export function trackChatOpened() {
  trackEvent('chat_opened');
}

export function trackChatClosed() {
  trackEvent('chat_closed');
}

export function trackChatMessageSent() {
  trackEvent('chat_message_sent');
}

export function trackChatFallbackUsed(source: 'fallback_no_config' | 'fallback_provider_error') {
  trackEvent('chat_fallback_used', { source });
}

export function trackChatWhatsAppClicked() {
  trackEvent('chat_whatsapp_clicked');
}

export function trackChatContactClicked(channel: 'whatsapp' | 'phone' | 'consulta' | 'email') {
  trackEvent('chat_contact_clicked', { channel });
}

/** El tema sugerido es una categoría corta y fija, no contenido libre. */
export function trackChatServiceSuggested(
  area: 'penal' | 'familia' | 'laboral' | 'civil' | 'mercantil' | 'migrantes' | 'general' | 'urgencia',
) {
  trackEvent('chat_service_suggested', { area });
}
