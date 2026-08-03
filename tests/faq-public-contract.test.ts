import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  preparePublicFaqQuestions,
  type FaqQuestion,
} from '@/lib/faq-db';
import {
  publicFaqPlainText,
  sanitizePublicFaqHtml,
} from '@/lib/faq-public-sanitizer';
import { faqPageSchema } from '@/lib/schemas/legal-page';

const homeSource = readFileSync('app/(public)/page.tsx', 'utf8');
const faqPageSource = readFileSync('app/(public)/preguntas-frecuentes/page.tsx', 'utf8');
const servicePageSource = readFileSync(
  'app/(public)/servicios-juridicos/[slug]/page.tsx',
  'utf8',
);

describe('contrato FAQ público', () => {
  it('la Home no conserva FAQ oculto ni emite FAQPage', () => {
    expect(homeSource).not.toContain('FAQ_HOME_LEGACY');
    expect(homeSource).not.toContain("'@type': 'FAQPage'");
    expect(homeSource).not.toContain('faqLd');
  });

  it('la metadata y el Hero reflejan el alcance corporativo', () => {
    expect(faqPageSource).toContain('Preguntas frecuentes sobre consultas y honorarios');
    expect(faqPageSource).toContain('Información del bufete');
    expect(faqPageSource).toContain('Antes de su primera consulta');
    expect(faqPageSource).not.toContain('Todas las ramas legales');
    expect(faqPageSource).not.toContain('defensa penal, familia, laboral, civil, mercantil y más');
  });

  it('UI, contador y schema usan la misma colección corporativa', () => {
    expect(faqPageSource.match(/getCorporateFaqsForPublicPage/g)).toHaveLength(3);
    expect(faqPageSource).toContain('flatFaqsForSchema.length > 0');
    expect(faqPageSource).toContain('respuesta: p.respuestaTexto');
    expect(faqPageSource).toContain('dangerouslySetInnerHTML={{ __html: p.respuesta }}');
  });

  it('las páginas de servicios delegan FAQ visible y schema solo en HubFaq', () => {
    expect(servicePageSource).toContain('<HubFaq');
    expect(servicePageSource).not.toContain('faqs: area.faqs');
  });

  it('descarta preguntas vacías y duplicadas con orden estable', () => {
    const input: FaqQuestion[] = [
      { pregunta: ' ¿Pregunta? ', respuesta: '<p>Respuesta</p>' },
      { pregunta: '¿Pregunta?', respuesta: '<p>Duplicada</p>' },
      { pregunta: '', respuesta: '<p>Vacía</p>' },
      { pregunta: 'Sin respuesta', respuesta: ' ' },
    ];
    expect(preparePublicFaqQuestions(input)).toEqual([
      {
        id: 'faq-pregunta',
        pregunta: '¿Pregunta?',
        respuesta: '<p>Respuesta</p>',
        respuestaTexto: 'Respuesta',
      },
    ]);
  });

  it('elimina HTML activo y atributos arbitrarios', () => {
    const dirty =
      '<script>alert(1)</script><style>body{}</style><p id="x" onclick="x()">Texto</p>'
      + '<iframe src="https://evil.test"></iframe><img src="/x.png">';
    expect(sanitizePublicFaqHtml(dirty)).toBe('<p>Texto</p>');
  });

  it('bloquea esquemas inseguros y URLs protocol-relative', () => {
    const dirty =
      '<a href="javascript:alert(1)">A</a>'
      + '<a href="data:text/html,x">B</a>'
      + '<a href="//evil.test">C</a>';
    expect(sanitizePublicFaqHtml(dirty)).toBe('<a>A</a><a>B</a><a>C</a>');
  });

  it('conserva el HTML permitido y endurece target blank', () => {
    const safe =
      '<p><strong>Seguro</strong><br><a href="https://example.com" target="_blank">Enlace</a></p>';
    expect(sanitizePublicFaqHtml(safe)).toBe(
      '<p><strong>Seguro</strong><br /><a href="https://example.com" target="_blank" rel="noopener noreferrer">Enlace</a></p>',
    );
  });

  it('la sanitización es idempotente', () => {
    const once = sanitizePublicFaqHtml(
      '<p><em>Texto</em> <a href="/consulta" target="_blank">consulta</a></p>',
    );
    expect(sanitizePublicFaqHtml(once)).toBe(once);
  });

  it('el schema usa texto plano, el mismo orden y el mismo conteo', () => {
    const questions = preparePublicFaqQuestions([
      { pregunta: 'Primera', respuesta: '<p>Uno &amp; dos</p>' },
      { pregunta: 'Segunda', respuesta: '<ul><li>Tres</li></ul>' },
    ]);
    const schema = faqPageSchema(
      questions.map((question) => ({
        pregunta: question.pregunta,
        respuesta: question.respuestaTexto,
      })),
      'https://www.pinedayasociadoshn.com/preguntas-frecuentes',
    );
    const entities = schema.mainEntity;
    expect(entities.map((entity) => entity.name)).toEqual(['Primera', 'Segunda']);
    expect(entities.map((entity) => entity.acceptedAnswer.text)).toEqual([
      'Uno & dos',
      'Tres',
    ]);
  });

  it('la pregunta gratuita contiene las garantías comerciales confirmadas', () => {
    const dbQuestions = preparePublicFaqQuestions([
      {
        pregunta: '¿La primera consulta es gratuita?',
        respuesta:
          'Sí. La primera consulta es gratuita, confidencial y sin compromiso. '
          + 'Cualquier servicio posterior se presupuesta por escrito y no se garantizan resultados.',
      },
    ]);
    const text = publicFaqPlainText(dbQuestions[0].respuesta).toLowerCase();
    expect(text).toContain('gratuita');
    expect(text).toContain('confidencial');
    expect(text).toContain('sin compromiso');
    expect(text).toContain('presupuesta por escrito');
    expect(text).toContain('no se garantizan resultados');
  });
});
