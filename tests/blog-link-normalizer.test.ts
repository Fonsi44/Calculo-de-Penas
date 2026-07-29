import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { normalizeBlogLinksForRender } from '@/lib/blog-link-normalizer';

function digest(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

describe('normalizeBlogLinksForRender', () => {
  it('conserva enlaces internos, HTTPS, mailto, tel y anchors válidos', () => {
    const html = [
      '<a href="/servicios-juridicos">Interno</a>',
      '<a href="https://www.poderjudicial.gob.hn/">Externo</a>',
      '<a href="mailto:contacto@pinedayasociadoshn.com">Correo</a>',
      '<a href="tel:+50495363724">Teléfono</a>',
      '<a href="#requisitos">Requisitos</a>',
    ].join('');
    expect(normalizeBlogLinksForRender(html)).toEqual({ html, issues: [] });
  });

  it('neutraliza javascript, href vacío y anchor desnudo conservando el texto', () => {
    const input = [
      '<p>Texto jurídico <strong>intacto</strong>.</p>',
      '<a class="x" href="javascript:alert(1)">Peligroso</a>',
      '<a href="">Vacío</a>',
      '<a href="#">Sin destino</a>',
    ].join('');
    const result = normalizeBlogLinksForRender(input);
    expect(result.html).toBe(
      '<p>Texto jurídico <strong>intacto</strong>.</p>PeligrosoVacíoSin destino',
    );
    expect(result.issues.map((finding) => finding.classification)).toEqual([
      'dangerous_scheme',
      'empty_href',
      'bare_anchor',
    ]);
    expect(result.issues.map((finding) => finding.blocking)).toEqual([true, true, false]);
  });

  it('convierte dominios de ejemplo a destinos internos y neutraliza placeholders explícitos', () => {
    const result = normalizeBlogLinksForRender(
      '<a href="https://ejemplo.com/ruta-ejemplo">Texto legal</a><a href="URL_AQUI">Otro</a>',
    );
    expect(result.html).toBe('<a href="/ruta-ejemplo">Texto legal</a>Otro');
    expect(result.issues.map((finding) => finding.classification)).toEqual([
      'example_domain',
      'explicit_placeholder',
    ]);
  });

  it('normaliza una ruta relativa sin alterar el resto del elemento', () => {
    const result = normalizeBlogLinksForRender(
      '<a class="context-link" href="solicitar-consulta">Consulta</a>',
    );
    expect(result.html).toBe(
      '<a class="context-link" href="/solicitar-consulta">Consulta</a>',
    );
    expect(result.issues[0]).toMatchObject({
      classification: 'relative_internal_path',
      proposedTarget: '/solicitar-consulta',
      blocking: false,
    });
  });

  it('reporta rutas antiguas sin inventar un destino', () => {
    const result = normalizeBlogLinksForRender(
      '<a href="/articulos/defensa-penal">Defensa penal</a>',
    );
    expect(result.html).toContain('href="/articulos/defensa-penal"');
    expect(result.issues[0]).toMatchObject({
      classification: 'legacy_articles_path',
      resolution: 'body_change_requires_review',
      blocking: true,
    });
  });

  it('normaliza orígenes de redirect cuando existe un destino canónico conocido', () => {
    const result = normalizeBlogLinksForRender(
      '<a href="/blog/practica-legal/abogados-en-choluteca">Choluteca</a>',
      { '/blog/practica-legal/abogados-en-choluteca': '/abogados-en-choluteca' },
    );
    expect(result.html).toContain('href="/abogados-en-choluteca"');
    expect(result.issues[0]).toMatchObject({
      classification: 'internal_redirect_origin',
      proposedTarget: '/abogados-en-choluteca',
    });
  });

  it('es idempotente', () => {
    const once = normalizeBlogLinksForRender(
      '<a href="solicitar-consulta">Consulta</a><a href="https://example.com">Referencia</a>',
    );
    const twice = normalizeBlogLinksForRender(once.html);
    expect(twice.html).toBe(once.html);
    expect(twice.issues).toEqual([]);
  });

  it('no altera cuerpos seguros ni el valor firmado que se usa para el hash', () => {
    const historicalBody = '<h2>Derechos</h2><p>Contenido jurídico sin enlaces problemáticos.</p>';
    const originalHash = digest(historicalBody);
    const result = normalizeBlogLinksForRender(historicalBody);
    expect(result.html).toBe(historicalBody);
    expect(digest(historicalBody)).toBe(originalHash);
    expect(result.issues).toEqual([]);
  });

  it('separa la copia de render del cuerpo persistido y de su hash editorial', () => {
    const persistedBody = '<p>Norma</p><a href="javascript:void(0)">Referencia</a>';
    const persistedHash = digest(persistedBody);
    const result = normalizeBlogLinksForRender(persistedBody);
    expect(result.html).toBe('<p>Norma</p>Referencia');
    expect(persistedBody).toContain('javascript:void(0)');
    expect(digest(persistedBody)).toBe(persistedHash);
    expect(result.issues[0].signatureRisk).toBe('none_render_only');
  });
});
