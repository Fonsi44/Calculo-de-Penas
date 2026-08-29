import { describe, it, expect } from 'vitest';
import { formatNlmReplyToHtml } from '../lib/chat/format-nlm-reply';
import { cleanNlmAnswer } from '../lib/chat/notebooklm-prompt';

describe('formatNlmReplyToHtml', () => {
  it('convierte encabezados y listas', () => {
    const md = '### Vía A\n\n1. Paso uno\n2. Paso dos\n\n- Requisito A';
    const html = formatNlmReplyToHtml(md);
    expect(html).toContain('<h4>');
    expect(html).toContain('<ol>');
    expect(html).toContain('<ul>');
    expect(html).toContain('Paso uno');
  });

  it('resalta negritas', () => {
    const html = formatNlmReplyToHtml('Texto **importante**');
    expect(html).toContain('<strong>importante</strong>');
  });
});

describe('cleanNlmAnswer', () => {
  it('elimina referencias numéricas y ofertas de descarga', () => {
    const out = cleanNlmAnswer('Hola [1] mundo.\n📊 Si lo necesitas, descarga');
    expect(out).not.toContain('[1]');
    expect(out).not.toContain('📊');
  });

  it('elimina CTA de plantilla y emoji 👉 al final', () => {
    const raw =
      '### Pasos\n1. Solicitar certificado\n\n👉 ¿Te gustaría que elaboremos una plantilla de poder especial de representación para este trámite?';
    const out = cleanNlmAnswer(raw);
    expect(out).toContain('Solicitar certificado');
    expect(out).not.toMatch(/gustar[ií]a/i);
    expect(out).not.toContain('👉');
    expect(out).not.toContain('plantilla');
  });

  it('elimina disclaimer embebido (el widget ya lo muestra en el pie)', () => {
    const raw =
      'Guía del trámite.\n\nContenido informativo. No sustituye la asesoría legal personalizada de un abogado habilitado en Honduras.';
    const out = cleanNlmAnswer(raw);
    expect(out).toBe('Guía del trámite.');
    expect(out).not.toMatch(/no sustituye/i);
  });
});
