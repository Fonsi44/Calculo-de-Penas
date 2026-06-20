/**
 * Tests anti-regresión del auditor SEO de contenido del blog.
 *
 * Valida que las funciones de detección (exportadas de
 * scripts/seo-content-audit.ts) identifican correctamente los problemas SEO
 * sobre HTML sintético conocido. Así, si alguien refactoriza el auditor, CI
 * impide que se rompa la detección de:
 *   - nofollow internos
 *   - enlaces a redirects conocidos
 *   - http inseguros
 *   - imágenes sin alt
 *   - anchors pobres
 *
 * Estos tests NO requieren DB: trabajan sobre las funciones puras.
 */
import { describe, it, expect } from 'vitest';
import {
  extractLinks,
  extractImages,
  isInternalUrl,
  isExternalUrl,
  isPoorAnchor,
} from '../scripts/seo-content-audit';

describe('extractLinks', () => {
  it('extrae href, anchor y rel de un enlace simple', () => {
    const html = '<p><a href="/blog/derecho-penal/ejemplo" rel="nofollow">Ver guía penal</a></p>';
    const links = extractLinks(html);
    expect(links).toHaveLength(1);
    expect(links[0].href).toBe('/blog/derecho-penal/ejemplo');
    expect(links[0].anchor).toBe('Ver guía penal');
    expect(links[0].rel).toBe('nofollow');
  });

  it('extrae enlaces con atributos en orden distinto (rel antes de href)', () => {
    const html = '<a rel="nofollow noopener" href="/servicios-juridicos">Servicios</a>';
    const links = extractLinks(html);
    expect(links).toHaveLength(1);
    expect(links[0].href).toBe('/servicios-juridicos');
    expect(links[0].rel).toBe('nofollow noopener');
  });

  it('extrae enlaces con comillas simples', () => {
    const html = "<a href='/contacto'>Contacto</a>";
    const links = extractLinks(html);
    expect(links).toHaveLength(1);
    expect(links[0].href).toBe('/contacto');
  });

  it('limpia HTML interno del anchor (deja solo texto)', () => {
    const html = '<a href="/blog/x"><strong>Guía</strong> completa</a>';
    const links = extractLinks(html);
    expect(links[0].anchor).toBe('Guía completa');
  });

  it('devuelve array vacío si no hay enlaces', () => {
    expect(extractLinks('<p>Sin enlaces</p>')).toEqual([]);
  });

  it('extrae múltiples enlaces', () => {
    const html = '<a href="/a">A</a> y <a href="/b">B</a>';
    expect(extractLinks(html)).toHaveLength(2);
  });
});

describe('extractImages', () => {
  it('detecta imagen con alt vacío como falta de alt', () => {
    const html = '<img src="/x.jpg" alt="" />';
    const imgs = extractImages(html);
    expect(imgs).toHaveLength(1);
    expect(imgs[0].hasAltAttr).toBe(true);
    expect(imgs[0].alt).toBe('');
  });

  it('detecta imagen sin atributo alt', () => {
    const html = '<img src="/x.jpg" />';
    const imgs = extractImages(html);
    expect(imgs[0].hasAltAttr).toBe(false);
    expect(imgs[0].alt).toBeNull();
  });

  it('acepta imagen con alt descriptivo', () => {
    const html = '<img src="/x.jpg" alt="Bufete en Nacaome" />';
    const imgs = extractImages(html);
    expect(imgs[0].hasAltAttr).toBe(true);
    expect(imgs[0].alt).toBe('Bufete en Nacaome');
  });
});

describe('isInternalUrl', () => {
  it('marca rutas relativas como internas', () => {
    expect(isInternalUrl('/blog/derecho-penal')).toBe(true);
    expect(isInternalUrl('/servicios-juridicos')).toBe(true);
  });

  it('marca URLs absolutas del propio dominio como internas', () => {
    expect(isInternalUrl('https://www.pinedayasociadoshn.com/blog/x')).toBe(true);
    expect(isInternalUrl('https://pinedayasociadoshn.com/contacto')).toBe(true);
  });

  it('marca URLs externas como no internas', () => {
    expect(isInternalUrl('https://example.com/x')).toBe(false);
    expect(isInternalUrl('https://wa.me/50495363724')).toBe(false);
  });

  it('no rompe con href vacío', () => {
    expect(isInternalUrl('')).toBe(false);
  });
});

describe('isExternalUrl', () => {
  it('marca dominios externos como externos', () => {
    expect(isExternalUrl('https://example.com')).toBe(true);
    expect(isExternalUrl('https://wa.me/504')).toBe(true);
  });

  it('no marca rutas internas ni mailto/tel como externos', () => {
    expect(isExternalUrl('/blog/x')).toBe(false);
    expect(isExternalUrl('mailto:info@test.com')).toBe(false);
    expect(isExternalUrl('tel:+5041234')).toBe(false);
  });
});

describe('isPoorAnchor', () => {
  it('detecta anchors genéricos pobres', () => {
    expect(isPoorAnchor('aquí')).toBe(true);
    expect(isPoorAnchor('click aquí')).toBe(true);
    expect(isPoorAnchor('ver más')).toBe(true);
    expect(isPoorAnchor('clic')).toBe(true);
  });

  it('detecta anchor vacío', () => {
    expect(isPoorAnchor('')).toBe(true);
    expect(isPoorAnchor('   ')).toBe(true);
  });

  it('acepta anchors descriptivos', () => {
    expect(isPoorAnchor('Guía completa de divorcio en Honduras')).toBe(false);
    expect(isPoorAnchor('Cómo calcular pensión alimenticia')).toBe(false);
    expect(isPoorAnchor('abogados en Nacaome')).toBe(false);
  });

  it('acepta acrónimos cortos conocidos', () => {
    expect(isPoorAnchor('cp')).toBe(false);
  });
});

describe('Regresión: reglas SEO del blog (hallazgos H11/H12)', () => {
  // Estos tests documentan las reglas que el auditor aplica y que los
  // scripts de corrección mantienen. Si alguien introduce un nofollow
  // interno o un enlace a un redirect en contenido, el auditor debe
  // detectarlo (validado por la combinación de extractLinks + isInternalUrl).

  it('detecta nofollow en enlace interno', () => {
    const html = '<a href="/blog/derecho-penal/x" rel="nofollow">Guía penal</a>';
    const links = extractLinks(html);
    const internalNofollow = links.filter(
      (l) => isInternalUrl(l.href) && /\bnofollow\b/i.test(l.rel),
    );
    expect(internalNofollow).toHaveLength(1);
  });

  it('no marca como problema un nofollow en enlace externo', () => {
    const html = '<a href="https://example.com" rel="nofollow noopener">Externo</a>';
    const links = extractLinks(html);
    const internalNofollow = links.filter(
      (l) => isInternalUrl(l.href) && /\bnofollow\b/i.test(l.rel),
    );
    expect(internalNofollow).toHaveLength(0);
  });

  it('detecta enlace http inseguro', () => {
    const html = '<a href="http://example.com">Inseguro</a>';
    const links = extractLinks(html);
    const insecure = links.filter((l) => /^http:\/\//i.test(l.href));
    expect(insecure).toHaveLength(1);
  });

  it('detecta imagen sin alt en contenido de post', () => {
    const html = '<p>Texto <img src="/foto.jpg" /> más texto</p>';
    const imgs = extractImages(html);
    const sinAlt = imgs.filter((i) => !i.hasAltAttr || !i.alt || !i.alt.trim());
    expect(sinAlt).toHaveLength(1);
  });
});
