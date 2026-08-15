import { describe, expect, it } from 'vitest';
import { CONTRATO_COMPRAVENTA_NACAOME_REVISION_ARTICLE } from '@/data/blog/articles/contrato-compraventa-nacaome-revision';
import { CUSTODIA_VISITAS_JUZGADO_VALLE_ARTICLE } from '@/data/blog/articles/custodia-visitas-juzgado-valle';
import { DEFENSA_PENAL_CHOLUTECA_DESDE_NACAOME_ARTICLE } from '@/data/blog/articles/defensa-penal-choluteca-desde-nacaome';
import { DESPIDO_VALLE_DOCUMENTOS_EVALUACION_ARTICLE } from '@/data/blog/articles/despido-valle-documentos-evaluacion';
import { PENSION_ALIMENTICIA_NACAOME_DOCUMENTOS_ARTICLE } from '@/data/blog/articles/pension-alimenticia-nacaome-documentos';
import { PREPARAR_VISITA_OFICINA_NACAOME_ARTICLE } from '@/data/blog/articles/preparar-visita-oficina-nacaome';
import { PRESTACIONES_PUERTO_SAN_LORENZO_ARTICLE } from '@/data/blog/articles/prestaciones-puerto-san-lorenzo';
import { TRAMITE_ADUANERO_GUASAULE_ABOGADO_ARTICLE } from '@/data/blog/articles/tramite-aduanero-guasaule-abogado';
import { scanProhibitedClaims } from '@/lib/marketing-policy';

const CASES = [
  {
    article: PENSION_ALIMENTICIA_NACAOME_DOCUMENTOS_ARTICLE,
    spoke: '/servicios-juridicos/derecho-de-familia',
    lawyer: '/equipo/thania-marlene-paz',
    cites: [/art\.\s*207 CF/i, /art\.\s*219 CF/i, /art\.\s*220 CF/i, /art\.\s*225 CF/i],
  },
  {
    article: CUSTODIA_VISITAS_JUZGADO_VALLE_ARTICLE,
    spoke: '/servicios-juridicos/derecho-de-familia',
    lawyer: '/equipo/thania-marlene-paz',
    cites: [] as RegExp[],
  },
  {
    article: DESPIDO_VALLE_DOCUMENTOS_EVALUACION_ARTICLE,
    spoke: '/servicios-juridicos/derecho-laboral',
    lawyer: '/equipo/emil-barahona',
    cites: [/art\.\s*116 CT/i, /art\.\s*117 CT/i],
  },
  {
    article: PRESTACIONES_PUERTO_SAN_LORENZO_ARTICLE,
    spoke: '/servicios-juridicos/derecho-laboral',
    lawyer: '/equipo/emil-barahona',
    cites: [/art\.\s*116 CT/i],
  },
  {
    article: DEFENSA_PENAL_CHOLUTECA_DESDE_NACAOME_ARTICLE,
    spoke: '/derecho-penal',
    lawyer: '/equipo/danilo-pineda-maradiaga',
    cites: [/art\.\s*82/i, /art\.\s*84/i, /art\.\s*71/i],
  },
  {
    article: TRAMITE_ADUANERO_GUASAULE_ABOGADO_ARTICLE,
    spoke: '/servicios-juridicos/derecho-aduanero-y-comercio-exterior',
    lawyer: undefined,
    cites: [] as RegExp[],
  },
  {
    article: CONTRATO_COMPRAVENTA_NACAOME_REVISION_ARTICLE,
    spoke: '/servicios-juridicos/derecho-civil-y-notarial',
    lawyer: '/equipo/thania-marlene-paz',
    cites: [/art\.\s*713 CC/i],
  },
  {
    article: PREPARAR_VISITA_OFICINA_NACAOME_ARTICLE,
    spoke: '/abogados-en-nacaome',
    lawyer: undefined,
    cites: [/GGJ7\+239/],
  },
] as const;

function wordCount(html: string): number {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().split(' ').length;
}

describe.each(CASES)('Sprint 3 editorial — $article.slug', ({ article, spoke, lawyer, cites }) => {
  it('cumple el contrato de backlog, ética y extensión', () => {
    expect(article.canonicalPath).toBe(`/blog/${article.category}/${article.slug}`);
    expect(article.author).toBe('Pineda y Asociados');
    expect(article.body.slice(0, 900)).toContain(`href="${spoke}"`);
    if (lawyer) expect(article.body).toContain(`href="${lawyer}"`);
    expect(article.body).toContain('href="/solicitar-consulta#formulario"');
    expect(article.body).toMatch(/lunes a sábado, de 7:00 a 20:00/);
    for (const cite of cites) expect(article.body).toMatch(cite);

    const words = wordCount(article.body);
    expect(words).toBeGreaterThanOrEqual(600);
    expect(words).toBeLessThanOrEqual(1200);
    expect(article.body).not.toMatch(/<h1[\s>]/i);
    expect(article.body).not.toMatch(/24\/7/);
    expect(article.body).not.toMatch(/le garantizamos|el mejor|sin compromiso|consulta gratuita/i);
    expect(article.body).not.toMatch(/testimonio|cliente satisfecho|nos recomendó/i);
    expect(scanProhibitedClaims(`${article.title} ${article.description} ${article.body}`)).toEqual([]);
  });
});
