import { describe, expect, it } from 'vitest';
import { DETENCION_FAMILIAR_NACAOME_ARTICLE as article } from '@/data/blog/articles/detencion-familiar-nacaome-primeras-horas';
import { scanProhibitedClaims } from '@/lib/marketing-policy';

function wordCount(html: string): number {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().split(' ').length;
}

describe('Sprint 3 — detención familiar en Nacaome', () => {
  it('es un post de derecho-penal con slug del backlog, sin URL de cargo nueva', () => {
    expect(article.category).toBe('derecho-penal');
    expect(article.slug).toBe('detencion-familiar-nacaome-primeras-horas');
    expect(article.canonicalPath).toBe(
      '/blog/derecho-penal/detencion-familiar-nacaome-primeras-horas',
    );
    expect(article.author).toBe('Pineda y Asociados');
  });

  it('enlaza temprano al hub penal y a logística local', () => {
    const head = article.body.slice(0, 700);
    expect(head).toContain('href="/derecho-penal"');
    expect(article.body).toContain('href="/abogados-en-nacaome"');
    expect(article.body).toContain('href="/solicitar-consulta#formulario"');
    expect(article.body).toContain('href="/equipo/danilo-pineda-maradiaga"');
  });

  it('cubre qué no firmar, derecho a abogado, plazos constitucionales e intermedios, y cuándo llamar', () => {
    expect(article.body).toMatch(/no firme/i);
    expect(article.body).toMatch(/art\.\s*82/i);
    expect(article.body).toMatch(/art\.\s*84/i);
    expect(article.body).toMatch(/art\.\s*71/i);
    expect(article.body).toMatch(/art\.\s*175 CPP/i);
    expect(article.body).toMatch(/art\.\s*282 CPP/i);
    expect(article.body).toMatch(/art\.\s*285 CPP/i);
    expect(article.body).toMatch(/numeral 8/i);
    expect(article.body).toMatch(/veinticuatro horas/i);
    expect(article.body).toMatch(/seis \(6\) horas/i);
    expect(article.body).toMatch(/lunes a sábado, de 7:00 a 20:00/);
    expect(article.body).toMatch(/WhatsApp/);
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
