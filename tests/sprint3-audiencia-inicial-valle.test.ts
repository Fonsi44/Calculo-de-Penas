import { describe, expect, it } from 'vitest';
import { AUDIENCIA_INICIAL_JUZGADOS_VALLE_ARTICLE as article } from '@/data/blog/articles/audiencia-inicial-juzgados-valle';
import { EDITORIAL_ARTICLES } from '@/data/blog/articles';
import { scanProhibitedClaims } from '@/lib/marketing-policy';

function wordCount(html: string): number {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().split(' ').length;
}

describe('Sprint 3 — audiencia inicial en Juzgados de Letras de Valle', () => {
  it('es un post de proceso-penal con slug del backlog, sin URL de cargo nueva', () => {
    expect(article.category).toBe('proceso-penal');
    expect(article.slug).toBe('audiencia-inicial-juzgados-valle');
    expect(article.canonicalPath).toBe('/blog/proceso-penal/audiencia-inicial-juzgados-valle');
    expect(article.author).toBe('Pineda y Asociados');
    expect(EDITORIAL_ARTICLES.some((item) => item.slug === article.slug)).toBe(true);
  });

  it('enlaza temprano al hub penal y no clona la guía nacional', () => {
    const head = article.body.slice(0, 800);
    expect(head).toContain('href="/derecho-penal"');
    expect(article.body).toContain('href="/blog/derecho-penal/audiencia-inicial-proceso-penal-honduras"');
    expect(article.body).toContain('href="/abogados-en-nacaome"');
    expect(article.body).toContain('href="/solicitar-consulta#formulario"');
    expect(article.body).toContain('href="/equipo/danilo-pineda-maradiaga"');
  });

  it('cita solo CPP verificado y refleja el sistema acusatorio vigente', () => {
    expect(article.body).toMatch(/art\.\s*264 CPP/i);
    expect(article.body).toMatch(/art\.\s*294 CPP/i);
    expect(article.body).toMatch(/art\.\s*285 CPP/i);
    expect(article.body).toMatch(/art\.\s*101 CPP/i);
    expect(article.body).toMatch(/art\.\s*289 CPP/i);
    expect(article.body).toMatch(/art\.\s*447 CPP/i);
    expect(article.body).toMatch(/acusatorio/i);
    expect(article.body).not.toMatch(/inquisitiv/i);
    expect(article.body).not.toMatch(/art\.\s*296 CPP/i);
    expect(article.body).toMatch(/dependen del caso/i);
    expect(article.body).toMatch(/lunes a sábado, de 7:00 a 20:00/);
  });

  it('tiene extensión de guía (600–1200 palabras) y un solo nivel de título en el body', () => {
    const words = wordCount(article.body);
    expect(words).toBeGreaterThanOrEqual(600);
    expect(words).toBeLessThanOrEqual(1200);
    expect(article.body).not.toMatch(/<h1[\s>]/i);
  });

  it('no introduce 24/7 operativo, promesas ni claims comerciales prohibidos', () => {
    expect(article.body).not.toMatch(/24\/7/);
    expect(article.body).not.toMatch(/le garantizamos|el mejor|sin compromiso|consulta gratuita/i);
    expect(article.body).not.toMatch(/testimonio|cliente satisfecho|nos recomendó/i);
    expect(scanProhibitedClaims(`${article.title} ${article.description} ${article.body}`)).toEqual([]);
  });
});
