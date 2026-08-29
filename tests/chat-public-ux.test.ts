import { describe, expect, it } from 'vitest';
import {
  advanceConsultationFlow,
  isConsultationFlowStart,
  startConsultationFlow,
} from '../lib/chat/consultation-flow';
import { isSubstantiveLegalQuestion } from '../lib/chat/legal-question-route';
import { buildInitialQuickReplies, resolveChatPageContext } from '../lib/chat/page-context';
import { buildChatSuggestions } from '../lib/chat/suggestions';
import { procesarMensajeLocal } from '../lib/chat/rules-engine';
import { resolveIntencionWithMemory } from '../lib/chat/session-memory';

describe('chat UX público — page context', () => {
  it('detecta contexto migrantes', () => {
    expect(resolveChatPageContext('/hondurenos-en-espana/poderes')).toBe('migrantes');
  });

  it('prioriza chips de página en quick replies', () => {
    const chips = buildInitialQuickReplies('/hondurenos-en-espana', ['Hola']);
    expect(chips[0]).toBe('Soy hondureño en España');
  });
});

describe('chat UX público — memoria de sesión', () => {
  it('interpreta afirmación tras oferta de WhatsApp', () => {
    const intencion = resolveIntencionWithMemory('sí', {
      area: null,
      lastUserIntencion: null,
      offeredConsultationPrep: false,
      offeredWhatsapp: true,
    });
    expect(intencion).toBe('whatsapp');
  });
});

describe('chat UX público — consulta jurídica sustantiva', () => {
  it('marca preguntas legales sin responder contenido', () => {
    expect(isSubstantiveLegalQuestion('¿Cuántos años de prisión tiene el hurto?')).toBe(true);
    const r = procesarMensajeLocal('¿Cuántos años de prisión tiene el hurto?');
    expect(r.intencion).toBe('consulta_juridica');
    expect(r.reply.toLowerCase()).toContain('abogado');
    expect(r.reply.toLowerCase()).not.toMatch(/\d+\s+años/);
  });
});

describe('chat UX público — flujo preparar consulta', () => {
  it('inicia y completa el flujo en tres pasos', () => {
    expect(isConsultationFlowStart('Preparar consulta')).toBe(true);
    const start = startConsultationFlow();
    expect(start.flow.step).toBe(1);

    const step2 = advanceConsultationFlow(start.flow, 'Familia');
    expect(step2.kind).toBe('continue');
    if (step2.kind !== 'continue') return;
    expect(step2.flow.step).toBe(2);

    const step3 = advanceConsultationFlow(step2.flow, 'España');
    expect(step3.kind).toBe('continue');
    if (step3.kind !== 'continue') return;

    const done = advanceConsultationFlow(step3.flow, 'Necesito orientación sobre custodia.');
    expect(done.kind).toBe('complete');
    if (done.kind !== 'complete') return;
    expect(done.whatsappDraft).toMatch(/custodia/i);
  });
});

describe('chat UX público — sugerencias', () => {
  it('ofrece chips de contacto en saludo', () => {
    const result = procesarMensajeLocal('Hola');
    const chips = buildChatSuggestions(result, 'home');
    expect(chips.some((c) => c.label.includes('WhatsApp'))).toBe(true);
    expect(chips.some((c) => c.message === 'Preparar consulta')).toBe(true);
  });
});
