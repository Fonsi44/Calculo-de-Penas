import { describe, it, expect } from 'vitest';
import { readdirSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { extraerClaimsForNotebooklm } from '@/scripts/lib/blog-claims-extract';
import { prepareNotebooklmClaims } from '@/scripts/lib/notebooklm-prompts';

const MODIFIED_SLUGS = [
  'detencion-familiar-nacaome-primeras-horas',
  'despido-valle-documentos-evaluacion',
  'prestaciones-puerto-san-lorenzo',
  'tramites-legales-nacaome',
  'custodia-visitas-juzgado-valle',
  'contrato-compraventa-nacaome-revision',
  'mediacion-vs-juicio-cual-elegir',
  'divorcio-honduras-guia-completa',
  'pension-alimenticia-porcentaje-honduras-2026',
  'defensa-penal-choluteca-desde-nacaome',
] as const;

/** Citas incorrectas detectadas en la auditoría NotebookLM (no deben reaparecer). */
const FORBIDDEN_PATTERNS: Array<{ slug?: string; pattern: RegExp; label: string }> = [
  { slug: 'detencion-familiar-nacaome-primeras-horas', pattern: /art\.\s*283\s*CPP/i, label: '283 CPP (debe ser 175)' },
  { slug: 'despido-valle-documentos-evaluacion', pattern: /art\.\s*39\s*CT/i, label: '39 CT (debe ser 36)' },
  { slug: 'despido-valle-documentos-evaluacion', pattern: /art\.\s*346\s*CT/i, label: '346 CT vacaciones (debe ser 345)' },
  { slug: 'prestaciones-puerto-san-lorenzo', pattern: /art\.\s*346\s*CT/i, label: '346 CT vacaciones (debe ser 345)' },
  { slug: 'tramites-legales-nacaome', pattern: /Decreto\s*116-87/i, label: 'Decreto 116-87 CC' },
  { slug: 'tramites-legales-nacaome', pattern: /Decreto\s*79-2000/i, label: 'Decreto 79-2000 CCom' },
  { pattern: /prohíbe terminantemente hacer raspaduras/i, label: 'art. 15 CN mal redactado' },
  { slug: 'mediacion-vs-juicio-cual-elegir', pattern: /arts\.\s*920\s*y\s*921\s*CPC/i, label: '920/921 CPC conciliación' },
  { slug: 'pension-alimenticia-porcentaje-honduras-2026', pattern: /art\.\s*123,\s*literal\s*a\)/i, label: '123 CT embargo salarial' },
  { slug: 'divorcio-honduras-guia-completa', pattern: /reguladas por el <strong>Código de Familia<\/strong> \(Decreto 76-84\): mutuo consentimiento, divorcio express ante notario/i, label: 'express atribuido solo a CF' },
  { slug: 'custodia-visitas-juzgado-valle', pattern: /art\.\s*68\b/i, label: 'art 68 CNA no verificable' },
];

const REQUIRED_PATTERNS: Array<{ slug: string; pattern: RegExp; label: string }> = [
  { slug: 'detencion-familiar-nacaome-primeras-horas', pattern: /art\.\s*175\s*CPP/i, label: '175 CPP' },
  { slug: 'despido-valle-documentos-evaluacion', pattern: /art\.\s*36\s*CT/i, label: '36 CT' },
  { slug: 'despido-valle-documentos-evaluacion', pattern: /art\.\s*345\s*CT/i, label: '345 CT' },
  { slug: 'prestaciones-puerto-san-lorenzo', pattern: /art\.\s*345\s*CT/i, label: '345 CT' },
  { slug: 'tramites-legales-nacaome', pattern: /Decreto\s*76-1906/i, label: 'Decreto 76-1906' },
  { slug: 'tramites-legales-nacaome', pattern: /Decreto\s*73-50/i, label: 'Decreto 73-50' },
  { slug: 'custodia-visitas-juzgado-valle', pattern: /198-B y 198-C CF/i, label: '198-B/C CF' },
  { slug: 'contrato-compraventa-nacaome-revision', pattern: /salvado obligatorio/i, label: 'encabezado art. 15 CN' },
  { slug: 'mediacion-vs-juicio-cual-elegir', pattern: /arts\.\s*448\s*y\s*591\s*CPC/i, label: '448/591 CPC' },
  { slug: 'pension-alimenticia-porcentaje-honduras-2026', pattern: /art\.\s*371/i, label: '371 CT embargo' },
  { slug: 'divorcio-honduras-guia-completa', pattern: /Código del Notariado<\/strong> \(Decreto 353-2005\), art\. 59/i, label: 'notariado art 59 intro' },
  { slug: 'defensa-penal-choluteca-desde-nacaome', pattern: /art\.\s*82 de la Constitución/i, label: '82 CN explícito' },
];

interface EditorialPost {
  slug: string;
  title: string;
  body: string;
}

async function loadEditorialPosts(): Promise<EditorialPost[]> {
  const dir = path.join(process.cwd(), 'data/blog/articles');
  const files = readdirSync(dir).filter((f) => f.endsWith('.ts') && f !== 'index.ts');
  const posts: EditorialPost[] = [];
  for (const file of files) {
    const mod = (await import(pathToFileURL(path.join(dir, file)).href)) as Record<
      string,
      unknown
    >;
    for (const value of Object.values(mod)) {
      if (!value || typeof value !== 'object') continue;
      const item = value as Record<string, unknown>;
      if (typeof item.slug !== 'string' || typeof item.body !== 'string') continue;
      posts.push({
        slug: item.slug,
        title: String(item.title ?? item.slug),
        body: item.body,
      });
    }
  }
  return posts;
}

describe('blog notebooklm editorial gate', () => {
  const postsPromise = loadEditorialPosts();

  it('carga los artículos corregidos', async () => {
    const posts = await postsPromise;
    for (const slug of MODIFIED_SLUGS) {
      expect(posts.some((p) => p.slug === slug), `falta ${slug}`).toBe(true);
    }
  });

  it('no contiene citas prohibidas tras la corrección editorial', async () => {
    const posts = await postsPromise;
    for (const rule of FORBIDDEN_PATTERNS) {
      const targets = rule.slug
        ? posts.filter((p) => p.slug === rule.slug)
        : posts.filter((p) => MODIFIED_SLUGS.includes(p.slug as (typeof MODIFIED_SLUGS)[number]));
      for (const post of targets) {
        expect(post.body, `${post.slug}: ${rule.label}`).not.toMatch(rule.pattern);
      }
    }
  });

  it('contiene las citas corregidas esperadas', async () => {
    const posts = await postsPromise;
    for (const rule of REQUIRED_PATTERNS) {
      const post = posts.find((p) => p.slug === rule.slug);
      expect(post, rule.slug).toBeDefined();
      expect(post!.body, `${rule.slug}: ${rule.label}`).toMatch(rule.pattern);
    }
  });

  it('cada artículo corregido tiene un solo h1 implícito (título en metadata) y body con h2', async () => {
    const posts = await postsPromise;
    for (const slug of MODIFIED_SLUGS) {
      const post = posts.find((p) => p.slug === slug)!;
      expect(post.body.match(/<h1\b/gi) ?? []).toHaveLength(0);
      expect(post.body.match(/<h2\b/gi)?.length ?? 0).toBeGreaterThan(0);
    }
  });

  it('no extrae «daños» ni «inhabilitación» como claims aislados', async () => {
    const posts = await postsPromise;
    for (const slug of MODIFIED_SLUGS) {
      const post = posts.find((p) => p.slug === slug)!;
      const claims = prepareNotebooklmClaims(post.body, extraerClaimsForNotebooklm(post.body));
      expect(
        claims.some((c) => c.textoOriginal.toLowerCase() === 'daños'),
        slug,
      ).toBe(false);
      expect(
        claims.some((c) => c.textoOriginal.toLowerCase() === 'inhabilitación'),
        slug,
      ).toBe(false);
    }
  });

  it('tramites: art. 81 se normaliza a CPC', async () => {
    const posts = await postsPromise;
    const post = posts.find((p) => p.slug === 'tramites-legales-nacaome')!;
    const claims = prepareNotebooklmClaims(post.body, extraerClaimsForNotebooklm(post.body));
    const art81 = claims.find((c) => /81/.test(c.textoOriginal));
    expect(art81?.textoOriginal).toMatch(/CPC/i);
    expect(art81?.textoOriginal).not.toMatch(/\bCP$/i);
  });
});
