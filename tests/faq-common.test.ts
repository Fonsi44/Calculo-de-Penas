/**
 * Tests de la utilidad común de FAQ (visible + schema desde la misma fuente).
 */
import { describe, expect, it } from 'vitest';
import {
  prepareFaqPairs,
  faqPageSchemaFromPairs,
  assertFaqPairsPolicySafe,
} from '@/lib/faq-common';

describe('prepareFaqPairs', () => {
  it('deduplica preguntas repetidas en una misma URL', () => {
    const pairs = prepareFaqPairs([
      { pregunta: '¿Dónde están ubicados?', respuesta: 'En Nacaome.' },
      { pregunta: '¿Dónde están ubicados?', respuesta: 'Duplicada.' },
      { pregunta: '¿Cómo se fijan los honorarios?', respuesta: 'Por escrito.' },
    ]);
    expect(pairs).toHaveLength(2);
    expect(pairs[1].respuesta).toBe('Por escrito.');
  });

  it('descarta preguntas o respuestas vacías', () => {
    const pairs = prepareFaqPairs([
      { pregunta: '', respuesta: 'Respuesta.' },
      { pregunta: '¿Pregunta?', respuesta: '  ' },
      { pregunta: '¿Válida?', respuesta: 'Sí.' },
    ]);
    expect(pairs).toHaveLength(1);
    expect(pairs[0].pregunta).toBe('¿Válida?');
  });
});

describe('faqPageSchemaFromPairs', () => {
  it('genera schema solo con las parejas visibles', () => {
    const schema = faqPageSchemaFromPairs([
      { pregunta: '¿A?', respuesta: 'R1.' },
      { pregunta: '¿A?', respuesta: 'R2.' },
      { pregunta: '', respuesta: 'R3.' },
    ], 'https://www.pinedayasociadoshn.com/test');
    expect(schema).not.toBeNull();
    const mainEntity = (schema as { mainEntity: Array<{ name: string; acceptedAnswer: { text: string } }> }).mainEntity;
    expect(mainEntity).toHaveLength(1);
    expect(mainEntity[0].name).toBe('¿A?');
    expect(mainEntity[0].acceptedAnswer.text).toBe('R1.');
  });

  it('devuelve null cuando no hay parejas (no emite schema de contenido oculto)', () => {
    expect(faqPageSchemaFromPairs([], 'https://example.com')).toBeNull();
  });
});

describe('assertFaqPairsPolicySafe', () => {
  it('lanza si una FAQ contiene un claim comercial no autorizado', () => {
    expect(() => assertFaqPairsPolicySafe([
      { pregunta: '¿La primera consulta es gratuita?', respuesta: 'Sí.' },
    ])).toThrow(/marketing-policy|no autorizado/);
  });

  it('acepta FAQ neutrales', () => {
    expect(() => assertFaqPairsPolicySafe([
      { pregunta: '¿Cómo funciona la evaluación inicial?', respuesta: 'Es confidencial.' },
    ])).not.toThrow();
  });
});
