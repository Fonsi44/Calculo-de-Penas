import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import {
  Calendar, Clock, User, ArrowLeft, ArrowRight, BadgeCheck,
} from 'lucide-react';
import Link from 'next/link';
import { Section, Container } from '@/components/marketing/section';
import { Breadcrumbs } from '@/components/marketing/breadcrumbs';
import { getAllPosts, getPostBySlug, formatDate, getCategoryName } from '@/lib/blog';
import { blogPostSchema } from '@/lib/schemas/blog';
import { site } from '@/lib/site';
import { buildBlogMetaDescription, buildBlogMetaTitle } from '@/lib/seo';
import { BlogTOC } from '@/components/blog/blog-toc';
import { injectHeadingIds } from '@/lib/blog-toc';
import { ShareButtons } from '@/components/blog/share-buttons';
import { RelatedService } from '@/components/blog/related-service';
import { BlogCtaBar } from '@/components/blog/blog-cta-bar';
import { LegalDisclaimer } from '@/components/marketing/legal-disclaimer';
import { CANONICAL_REVIEWERS } from '@/lib/legal-review';
import { extractFAQSchema, faqPageSchema } from '@/lib/faq-schema';
import { BlogSidebar } from '@/components/blog/blog-sidebar';
import {
  injectContextLinks,
  detectMentionedCities,
  normalizeBlogInternalLinks,
} from '@/lib/blog-context-linker';
import { RelatedCities, RelatedCategories } from '@/components/marketing/related-links';
import {
  toCardData,
  deriveCategoryCounts,
  derivePopularPosts,
  deriveRecentPosts,
  deriveArchiveMonths,
  deriveAllTags,
} from '@/lib/blog-hub';

export const revalidate = 3600;

type Props = { params: Promise<{ categoria: string; slug: string }> };

const MID_POST_CTA_COPY: Record<string, { title: string; body: string; anchor: string }> = {
  'defensa-penal-honduras': {
    title: 'Necesita una defensa penal inmediata?',
    body: 'Si enfrenta una investigacion o audiencia, conviene ordenar hechos y evidencia con defensa tecnica desde el inicio.',
    anchor: 'Solicitar consulta penal confidencial',
  },
  'abogado-penalista-sur-honduras': {
    title: 'Actue a tiempo en su caso penal',
    body: 'Las primeras decisiones procesales suelen marcar el rumbo del expediente. Una revision temprana ayuda a evitar errores de alto impacto.',
    anchor: 'Hablar con un abogado penalista',
  },
  'despido-laboral-honduras-guia-completa': {
    title: 'Evalua su despido con enfoque tecnico',
    body: 'Con contrato, comprobantes y cronologia laboral, puede definirse una ruta clara de reclamo o negociacion en plazos utiles.',
    anchor: 'Solicitar revision de caso laboral',
  },
  'divorcio-honduras-guia-completa': {
    title: 'Necesita orientacion para su proceso familiar?',
    body: 'Una estrategia temprana en divorcio, custodia y alimentos reduce conflictos y mejora la proteccion juridica de su familia.',
    anchor: 'Solicitar consulta de derecho de familia',
  },
  'pension-alimenticia-honduras-guia-completa': {
    title: 'Ordene su caso de pension alimenticia',
    body: 'Con documentacion correcta y objetivos claros, es posible avanzar con mayor precision en conciliacion o via judicial.',
    anchor: 'Iniciar consulta sobre pension alimenticia',
  },
  'abogados-en-choluteca': {
    title: 'Atencion legal para Choluteca y zona sur',
    body: 'Puede iniciar por WhatsApp o llamada y definir una hoja de ruta concreta segun el tipo de asunto y su urgencia.',
    anchor: 'Solicitar consulta desde Choluteca',
  },
  'danos-perjuicios-indemnizacion-honduras': {
    title: 'Ha sufrido danos y necesita reclamar?',
    body: 'La indemnizacion por danos y perjuicios requiere probar el dano, la culpa y la relacion causal. Un abogado civil puede evaluar la viabilidad de su reclamo.',
    anchor: 'Consultar sobre mi caso de danos',
  },
  'prescripcion-deudas-plazos-honduras': {
    title: 'Tiene una deuda que ya prescribio?',
    body: 'Conocer los plazos de prescripcion es el primer paso. Un abogado puede confirmar si su deuda ya prescribio y que accion tomar.',
    anchor: 'Verificar si mi deuda prescribio',
  },
  'pension-alimenticia-porcentaje-honduras-2026': {
    title: 'Necesita fijar o modificar una pension?',
    body: 'El calculo correcto de la pension alimenticia depende de ingresos, numero de hijos y necesidades del menor. Evite errores que retrasen el proceso.',
    anchor: 'Calcular mi pension alimenticia',
  },
  'estafas-fraudes-tipos-penales-honduras': {
    title: 'Fue victima de una estafa?',
    body: 'Las estafas requieren accion penal inmediata para preservar pruebas y evitar que el responsable disponga de los bienes defraudados.',
    anchor: 'Denunciar una estafa con abogado',
  },
  'poder-notarial-honduras-tipos-requisitos': {
    title: 'Necesita un poder notarial seguro?',
    body: 'Cada tipo de poder tiene requisitos especificos. Un poder mal redactado puede ser impugnado o rechazado. Hagalo bien desde el inicio.',
    anchor: 'Solicitar poder notarial en Nacaome',
  },
  'custodia-hijos-honduras-juez': {
    title: 'Esta en disputa la custodia de sus hijos?',
    body: 'El juez decide segun el interes superior del menor. Una estrategia legal solida puede marcar la diferencia en el resultado.',
    anchor: 'Consultar sobre custodia de menores',
  },
  'pension-alimenticia-honduras-como-solicitarla': {
    title: 'Listo para solicitar la pension alimenticia?',
    body: 'El proceso requiere documentacion especifica y seguir los pasos correctos ante el juzgado de familia. No lo haga solo.',
    anchor: 'Iniciar solicitud de pension ya',
  },
  'que-hacer-si-me-detienen-en-honduras': {
    title: 'Tiene un familiar detenido?',
    body: 'Las primeras 24 horas son criticas. Un abogado penalista puede garantizar sus derechos desde el primer momento y evitar abusos procesales.',
    anchor: 'Asistencia inmediata por detencion',
  },
  'medidas-sustitutivas-prision-preventiva-honduras': {
    title: 'Busca evitar la prision preventiva?',
    body: 'Existen 7 medidas sustitutivas que un abogado puede solicitar al juez. Cada caso tiene particularidades que deben argumentarse tecnicamente.',
    anchor: 'Solicitar revision de medida cautelar',
  },
  'derechos-detenido-honduras-guia-constitucional': {
    title: 'Conoce a alguien detenido?',
    body: 'La Constitucion garantiza derechos fundamentales desde la detencion. Un abogado puede verificar que se respeten y actuar si no es asi.',
    anchor: 'Verificar derechos del detenido',
  },
  'calcular-prestaciones-laborales-honduras': {
    title: 'Quiere saber cuanto le deben?',
    body: 'El calculo de prestaciones incluye varios conceptos que su empleador podria estar omitiendo. Revise su caso con un abogado laboralista.',
    anchor: 'Calcular mis prestaciones ahora',
  },
  'despido-injustificado-honduras-derechos-trabajador': {
    title: 'Lo despidieron sin justa causa?',
    body: 'Tiene derecho a indemnizacion. Pero debe actuar dentro de los plazos legales. No espere: cada dia cuenta en un reclamo laboral.',
    anchor: 'Reclamar mi despido injustificado',
  },
  'acoso-laboral-mobbing-honduras': {
    title: 'Sufre acoso en su trabajo?',
    body: 'El mobbing es una violacion a sus derechos laborales. Puede denunciarlo y reclamar indemnizacion. No tiene que soportarlo en silencio.',
    anchor: 'Denunciar acoso laboral',
  },
  'delitos-mas-comunes-honduras': {
    title: 'Enfrenta una acusacion penal?',
    body: 'Conocer el delito que le imputan es el primer paso. Un abogado penalista puede explicarle sus opciones y construir su defensa.',
    anchor: 'Consultar sobre mi caso penal',
  },
  'violencia-domestica-ruta-legal-honduras': {
    title: 'Necesita proteccion urgente?',
    body: 'La ley preve medidas de proteccion inmediatas para victimas de violencia domestica. No espere a que la situacion empeore.',
    anchor: 'Solicitar medidas de proteccion',
  },
  'audiencia-inicial-proceso-penal-honduras': {
    title: 'Tiene una audiencia inicial proxima?',
    body: 'Lo que ocurra en esa audiencia define el rumbo del proceso. Llegar con defensa tecnica es su derecho y su mejor estrategia.',
    anchor: 'Preparar mi audiencia inicial',
  },
  'compraventa-inmuebles-aspectos-legales-honduras': {
    title: 'Va a comprar o vender una propiedad?',
    body: 'Una compraventa sin due diligence puede costarle su patrimonio. Verifique gravamenes, impuestos y titularidad antes de firmar.',
    anchor: 'Revisar mi compraventa con abogado',
  },
  'contratos-arrendamiento-derechos-obligaciones-honduras': {
    title: 'Va a firmar un contrato de alquiler?',
    body: 'Las clausulas abusivas en contratos de arrendamiento son comunes. Un abogado civil puede revisarlo antes de que firme.',
    anchor: 'Revisar mi contrato de arrendamiento',
  },
  'derechos-laborales-basicos-honduras': {
    title: 'Conoce todos sus derechos como trabajador?',
    body: 'Muchos empleadores cuentan con que usted no conozca sus derechos. Informese y, si necesita reclamar, tenga un abogado a su lado.',
    anchor: 'Consultar mis derechos laborales',
  },
  'derechos-trabajadora-embarazada-honduras': {
    title: 'Esta embarazada y teme por su empleo?',
    body: 'El fuero maternal la protege contra el despido. Si fue despedida estando embarazada, tiene derecho a reintegro e indemnizacion.',
    anchor: 'Proteger mi estabilidad laboral',
  },
  'testamentos-sucesiones-herencia-honduras': {
    title: 'Necesita gestionar una herencia?',
    body: 'Las sucesiones requieren tramites especificos ante notario o juez. Un error puede retrasar la disposicion de los bienes por meses o anos.',
    anchor: 'Iniciar tramite de sucesion',
  },
  'calcular-liquidacion-laboral-honduras': {
    title: 'No esta seguro de que su liquidacion sea correcta?',
    body: 'Muchos empleadores calculan de menos. Un abogado laboralista puede revisar su liquidacion y reclamar la diferencia si corresponde.',
    anchor: 'Verificar mi liquidacion laboral',
  },
  'abogado-penalista-choluteca': {
    title: 'Necesita defensa penal en Choluteca?',
    body: 'Atendemos casos penales en los juzgados de Choluteca. Contactenos para una consulta confidencial sobre su situacion.',
    anchor: 'Hablar con abogado penalista en Choluteca',
  },
  'divorcio-choluteca': {
    title: 'Quiere iniciar su divorcio en Choluteca?',
    body: 'Cada tipo de divorcio tiene requisitos y costos distintos. Una consulta temprana le ayuda a elegir la via mas conveniente.',
    anchor: 'Consultar sobre divorcio en Choluteca',
  },
  'abogado-civil-choluteca': {
    title: 'Necesita un abogado civil en Choluteca?',
    body: 'Contratos, herencias, cobro de deudas y compraventas. Asesoria civil con conocimiento de los juzgados de la zona sur.',
    anchor: 'Consultar con abogado civil',
  },
  'cuando-necesito-abogado-penalista-honduras': {
    title: 'No sabe si necesita un abogado penalista?',
    body: 'Si recibio una citacion, esta siendo investigado o fue detenido, necesita defensa tecnica cuanto antes. No espere a que sea tarde.',
    anchor: 'Evaluar mi situacion penal sin costo',
  },
  'empleador-no-paga-salario-honduras': {
    title: 'Su empleador no le paga?',
    body: 'La retencion de salario es ilegal. Puede reclamar el pago de lo adeudado mas intereses y danos. Actue antes de que prescribe.',
    anchor: 'Reclamar salarios impagos',
  },
  'clausulas-abusivas-contratos-como-detectar-honduras': {
    title: 'Firmo un contrato con clausulas abusivas?',
    body: 'Muchas clausulas abusivas pueden declararse nulas. Un abogado civil puede revisar su contrato y asesorarle sobre sus opciones.',
    anchor: 'Revisar mi contrato ahora',
  },
  'usucapion-prescripcion-adquisitiva-honduras': {
    title: 'Quiere legalizar la propiedad que posee?',
    body: 'La usucapion permite adquirir la propiedad por posesion continua. El proceso requiere cumplir plazos y requisitos especificos.',
    anchor: 'Consultar sobre usucapion',
  },
};

function injectMidArticleCta(body: string, slug: string): string {
  const hasContextualTopic = Boolean(MID_POST_CTA_COPY[slug]);
  if (!hasContextualTopic) return body;
  if (body.includes('/solicitar-consulta')) return body;

  const paragraphEndRegex = /<\/p>/gi;
  const paragraphEndPositions: number[] = [];
  let match: RegExpExecArray | null;
  while ((match = paragraphEndRegex.exec(body)) !== null) {
    paragraphEndPositions.push(match.index + match[0].length);
  }

  const targetIndex = paragraphEndPositions.length >= 3
    ? Math.max(1, Math.floor(paragraphEndPositions.length * 0.65) - 1)
    : -1;

  const ctaHtml = `
<aside class="my-7 rounded-lg border border-accent/30 bg-surface-alt p-4">
  <p class="text-xxs font-bold uppercase tracking-wider text-accent-dark mb-1">Consulta legal</p>
  <p class="text-sm font-semibold text-text mb-1">¿Necesita orientación sobre este tema?</p>
  <p class="text-sm text-text-secondary leading-relaxed mb-2">Podemos revisar su situación concreta, explicarle las opciones disponibles y, si procede, preparar un presupuesto por escrito. No se garantizan resultados.</p>
  <a href="/solicitar-consulta#formulario" data-event-name="seo_blog_cta_click" data-cta-location="blog_inline" data-cta-topic="${slug}" class="text-sm font-semibold text-primary hover:text-accent-dark">Solicitar una consulta confidencial</a>
</aside>`;

  if (targetIndex >= 0) {
    const insertionPoint = paragraphEndPositions[targetIndex];
    return `${body.slice(0, insertionPoint)}${ctaHtml}${body.slice(insertionPoint)}`;
  }

  return `${body}${ctaHtml}`;
}

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((p) => ({ categoria: p.category, slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { categoria, slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post || post.category !== categoria) return {};

  // `absolute` evita que el template raíz añada otra marca. El helper conserva
  // primero la intención de búsqueda y solo añade la marca si cabe completa.
  const metaTitle = buildBlogMetaTitle(post.metaTitle || post.title);
  const metaDesc = buildBlogMetaDescription(
    post.metaDescription,
    post.description,
  );
  const ogImg = post.ogImage || post.coverImage || '/og-image.webp';
  const canonical = post.canonicalUrl || `/blog/${post.category}/${post.slug}`;
  const noindex = post.noindex === true;

  return {
    title: { absolute: metaTitle },
    description: metaDesc,
    alternates: { canonical },
    keywords: post.tags,
    robots: noindex
      ? { index: false, follow: true, googleBot: { index: false, follow: true } }
      : { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 } },
    twitter: {
      card: 'summary_large_image',
      title: metaTitle,
      description: metaDesc,
      images: [`${site.url}${ogImg}`],
    },
    openGraph: {
      title: metaTitle,
      description: metaDesc,
      url: `${site.url}${canonical}`,
      siteName: site.name,
      locale: 'es_HN',
      type: 'article',
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      authors: [post.author],
      tags: post.tags,
      images: [{ url: `${site.url}${ogImg}`, width: 1200, height: 630, alt: metaTitle }],
    },
  };
}

async function getRelatedPosts(slug: string, category: string, tags: string[], limit = 6) {
  const all = await getAllPosts();
  return all
    .filter((p) => p.slug !== slug)
    .map((p) => {
      const catMatch = p.category === category ? 3 : 0;
      const tagOverlap = p.tags.filter((t) => tags.includes(t)).length;
      return { post: p, score: catMatch + tagOverlap };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((r) => r.post);
}

export default async function BlogPostByCategoryPage({ params }: Props) {
  const { categoria, slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post || post.category !== categoria) notFound();

  const allPosts = await getAllPosts();
  const currentIndex = allPosts.findIndex((p) => p.slug === slug);
  const prevPost = currentIndex > 0 ? allPosts[currentIndex - 1] : null;
  const nextPost = currentIndex < allPosts.length - 1 ? allPosts[currentIndex + 1] : null;
  const relatedPosts = await getRelatedPosts(slug, post.category, post.tags);
  const categoryName = getCategoryName(post.category) ?? post.category;

  const postUrl = `/blog/${post.category}/${post.slug}`;

  const LAWYER_SLUGS: Record<string, string> = {
    'Danilo Pineda Maradiaga': 'danilo-pineda-maradiaga',
    'Thania Marlene Paz': 'thania',
    'Emil Barahona': 'emil',
  };

  const isReviewed =
    post.reviewStatus === 'verified' &&
    post.reviewedBy &&
    CANONICAL_REVIEWERS.includes(post.reviewedBy) &&
    post.reviewedAt;

  const authorSlug = post.author ? LAWYER_SLUGS[post.author] : null;
  const authorHref = authorSlug ? `/despacho#${authorSlug}` : '/despacho';

  // Inyecta CTA mid-article y luego asigna IDs estables a los H2/H3 del body
  // (server-side) para que el TOC y los fragment anchors (#section) existan en
  // el HTML servidor (SEO/GEO: crawlers y LLMs ven la estructura del doc).
  const rawHtml = injectMidArticleCta(post.body, post.slug);
  const { html: withHeadings, headings } = injectHeadingIds(rawHtml);
  // AUTO-LINKING CONTEXTUAL (Jul 2026): inserta enlaces internos a ciudades y
  // áreas de práctica detectadas en el body. Crea la tela de araña blog→geo.
  // Anti-over-optimization: máx 5 enlaces, respeta headings y anchors existentes.
  const articleHtml = injectContextLinks(normalizeBlogInternalLinks(withHeadings), {
    excludeHrefs: [postUrl], // evitar self-link
  });
  // Detecta ciudades mencionadas para el bloque RelatedCities al final.
  const mentionedCities = detectMentionedCities(post.body);
  const faqItems = extractFAQSchema(post.body);
  const faqLd = faqPageSchema(faqItems);

  const categoryCounts = deriveCategoryCounts(allPosts);
  const popularSidebar = derivePopularPosts(allPosts, 5).map(toCardData);
  const recentSidebar = deriveRecentPosts(allPosts, 5).map(toCardData);
  const archive = deriveArchiveMonths(allPosts, 8);
  const allTags = deriveAllTags(allPosts);

  return (
    <>
      {/* ── BREADCRUMBS ── */}
      <div className="bg-surface-alt border-b border-border/50">
        <Container size="lg">
          <Breadcrumbs items={[
            { label: 'Inicio', href: '/' },
            { label: 'Blog Jurídico', href: '/blog' },
            { label: categoryName, href: `/blog/${post.category}` },
            { label: post.title },
          ]} />
        </Container>
      </div>

      {/* ── HERO ── */}
      <Section spacing="sm">
        <Container size="lg">
          <div className="max-w-3xl mx-auto">
            <Link
              href={`/blog/${post.category}`}
              className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-eyebrow px-3 py-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary/15 transition-colors mb-5"
            >
              {categoryName}
            </Link>
            <h1 className="font-serif font-extrabold text-3xl md:text-4xl lg:text-5xl leading-tight text-text tracking-[-0.01em]">
              {post.title}
            </h1>
            <p className="mt-4 text-lg text-text-secondary leading-relaxed">
              {post.description}
            </p>
            <div className="flex flex-wrap items-center gap-5 mt-6 text-sm text-text-muted">
              <span className="flex items-center gap-1.5">
                <Calendar size={15} className="text-accent-dark" />
                <span>Publicado: <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time></span>
              </span>
              {post.updatedAt && (
                <span className="flex items-center gap-1.5" title="Última actualización">
                  <Clock size={15} className="text-accent-dark" />
                  <span>Actualizado: <time dateTime={post.updatedAt}>{formatDate(post.updatedAt)}</time></span>
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Clock size={15} className="text-accent-dark" />
                {post.readingTime}
              </span>
              <span className="flex items-center gap-1.5">
                <User size={15} className="text-accent-dark" />
                <span>Autor: <Link href={authorHref} className="hover:text-primary hover:underline transition-colors font-medium text-text-secondary">{post.author}</Link></span>
              </span>
              {isReviewed && (
                <span className="flex items-center gap-1.5">
                  <BadgeCheck size={15} className="text-accent-dark" />
                  <span>Revisión jurídica:{' '}
                  <Link href={`/despacho#${LAWYER_SLUGS[post.reviewedBy!]}`} className="hover:text-primary hover:underline transition-colors font-medium text-text-secondary font-semibold">
                    {post.reviewedBy}
                  </Link>
                  {post.reviewedAt && (
                    <time dateTime={post.reviewedAt}> · {formatDate(post.reviewedAt)}</time>
                  )}
                  </span>
                </span>
              )}
            </div>
          </div>
        </Container>
      </Section>

      {/* ── SOCIAL SHARE BAR ── */}
      <Container size="lg" className="mb-10">
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-lg border border-border/30 bg-surface-alt">
          <span className="text-sm font-semibold text-text">Compartir este artículo</span>
          <ShareButtons title={post.title} url={postUrl} variant="horizontal" />
        </div>
      </Container>

      {/* ── COVER IMAGE ── */}
      {post.coverImage && (
        <Container size="lg" className="mt-0 mb-10">
          <div className="relative aspect-[21/9] w-full overflow-hidden rounded-lg border border-border/30 shadow-sm">
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 1024px"
              className="object-cover"
            />
          </div>
        </Container>
      )}

      {/* ── CONTENIDO + SIDEBAR ── */}
      <Section spacing="md">
        <Container size="lg">
          <div className="grid lg:grid-cols-[1fr_20rem] gap-8 lg:gap-10">
            <div className="min-w-0">
              <article>
                {!isReviewed && (
                  <div className="p-4 mb-6 rounded-lg bg-surface-alt border border-yellow-500/20 text-xs text-text-secondary leading-relaxed flex items-start gap-2.5 shadow-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 flex-shrink-0 mt-1.5" />
                    <div>
                      <span className="font-bold text-text">Aviso informativo:</span> Este contenido tiene fines exclusivamente de divulgación general. Está pendiente de revisión jurídica individual por un abogado colegiado. Para un análisis detallado de su caso, consulte directamente a nuestro despacho.
                    </div>
                  </div>
                )}
                <BlogTOC headings={headings} />
                <div className="article-body" dangerouslySetInnerHTML={{ __html: articleHtml }} />

                {/* Tags */}
                {post.tags.length > 0 && (
                  <div className="mt-10 pt-6 border-t border-border/50">
                    <p className="text-xs font-bold uppercase tracking-widest text-text-muted mb-3">Etiquetas</p>
                    <div className="flex flex-wrap gap-2">
                      {post.tags.map((tag) => (
                        <Link
                          key={tag}
                          href={`/blog?tag=${encodeURIComponent(tag)}`}
                          rel="nofollow"
                          className="inline-block px-3 py-1.5 rounded-full bg-surface-alt text-xs text-text-secondary border border-border/30 hover:bg-primary/10 hover:text-primary hover:border-primary/20 transition-colors"
                        >
                          {tag}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Disclaimer legal único con fecha de revisión real del post (E-E-A-T).
                    El footer global NO repite este concepto (ver public-footer.tsx). */}
                <LegalDisclaimer lastReviewedIso={post.updatedAt ?? post.publishedAt} />

                <RelatedService category={post.category} />

                {/* Author Box */}
                <div className="mt-10 pt-6 border-t border-border/30">
                  <p className="text-xs font-bold uppercase tracking-widest text-text-muted mb-4">Sobre el autor</p>
                  <div className="flex flex-col sm:flex-row gap-4 p-5 rounded-lg border border-border/30 bg-surface-alt">
                    <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-lg flex-shrink-0">
                      {post.author === 'Danilo Pineda Maradiaga' ? 'DP' : post.author === 'Thania Marlene Paz' ? 'TP' : post.author === 'Emil Barahona' ? 'EB' : 'PA'}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-text">
                        <Link href={authorHref} className="hover:text-primary hover:underline transition-colors">
                          {post.author}
                        </Link>
                      </p>
                      <p className="text-xs text-text-muted">Abogados en Nacaome, Valle, zona sur de Honduras</p>
                      <p className="text-sm text-text-secondary leading-relaxed mt-2">
                        Bufete jurídico con sede en Nacaome y más de 15 años de experiencia. Abogados
                        colegiados en Honduras, con presencia activa en juzgados de la zona sur.
                      </p>
                      {isReviewed && (
                        <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-text-secondary">
                          <BadgeCheck size={14} className="text-accent-dark" />
                          Revisión jurídica:{' '}
                          <Link href={`/despacho#${LAWYER_SLUGS[post.reviewedBy!]}`} className="hover:text-primary hover:underline transition-colors font-semibold">
                            {post.reviewedBy}
                          </Link>
                          {post.reviewedAt && (
                            <time dateTime={post.reviewedAt}> · {formatDate(post.reviewedAt)}</time>
                          )}
                        </p>
                      )}
                      <Link
                        href="/blog"
                        className="inline-flex items-center gap-1 mt-2 text-sm font-semibold text-primary hover:text-accent-dark transition-colors"
                      >
                        Más artículos del equipo <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Share at end */}
                <div className="mt-8 pt-6 border-t border-border/30">
                  <p className="text-xs font-bold uppercase tracking-widest text-text-muted mb-3">Compartir</p>
                  <ShareButtons title={post.title} url={postUrl} variant="horizontal" />
                </div>
              </article>

              {/* Navegación entre posts */}
              {(prevPost || nextPost) && (
                <nav className="mt-10 pt-6 border-t border-border/30 grid sm:grid-cols-2 gap-4" aria-label="Navegación entre artículos">
                  {prevPost ? (
                    <Link
                      href={`/blog/${prevPost.category}/${prevPost.slug}`}
                      className="group flex items-start gap-3 p-4 rounded-lg border border-border/30 hover:border-accent/30 hover:bg-surface-alt transition-colors"
                    >
                      <ArrowLeft size={16} className="flex-shrink-0 mt-0.5 text-text-muted group-hover:text-accent-dark transition-colors" />
                      <div className="min-w-0">
                        <p className="text-xxs font-bold uppercase tracking-widest text-text-muted mb-1">Anterior</p>
                        <p className="text-sm text-text leading-snug line-clamp-2 group-hover:text-primary transition-colors">{prevPost.title}</p>
                      </div>
                    </Link>
                  ) : <div />}
                  {nextPost ? (
                    <Link
                      href={`/blog/${nextPost.category}/${nextPost.slug}`}
                      className="group flex items-start justify-end gap-3 p-4 rounded-lg border border-border/30 hover:border-accent/30 hover:bg-surface-alt transition-colors text-right"
                    >
                      <div className="min-w-0">
                        <p className="text-xxs font-bold uppercase tracking-widest text-text-muted mb-1">Siguiente</p>
                        <p className="text-sm text-text leading-snug line-clamp-2 group-hover:text-primary transition-colors">{nextPost.title}</p>
                      </div>
                      <ArrowRight size={16} className="flex-shrink-0 mt-0.5 text-text-muted group-hover:text-accent-dark transition-colors" />
                    </Link>
                  ) : <div />}
                </nav>
              )}
            </div>

            <BlogSidebar
              categories={categoryCounts}
              popular={popularSidebar}
              recent={recentSidebar}
              archive={archive}
              tags={allTags}
            />
          </div>
        </Container>
      </Section>

      {/* ── ARTÍCULOS RELACIONADOS ── */}
      {relatedPosts.length > 0 && (
        <Section spacing="md" background="muted">
          <Container size="lg">
            <div className="mb-8">
              <p className="text-xs font-bold uppercase tracking-eyebrow text-accent-dark mb-2">También puede interesarle</p>
              <h2 className="font-serif font-bold text-2xl text-text">Artículos relacionados</h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {relatedPosts.map((rp) => (
                <Link
                  key={rp.slug}
                  href={`/blog/${rp.category}/${rp.slug}`}
                  className="group block rounded-lg border border-border/30 bg-surface overflow-hidden hover:border-accent/30 hover:shadow-md transition-all"
                >
                  <div className="relative h-40 overflow-hidden">
                    {rp.coverImage ? (
                      <Image src={rp.coverImage} alt={rp.title} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover group-hover:scale-[1.025] transition-transform duration-200" />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10" />
                    )}
                  </div>
                  <div className="p-4">
                    <p className="text-xxs font-bold uppercase tracking-widest text-accent-dark mb-1">{getCategoryName(rp.category) ?? rp.category}</p>
                    <h3 className="font-serif font-bold text-sm leading-snug text-text group-hover:text-primary transition-colors line-clamp-2">{rp.title}</h3>
                    <p className="mt-1.5 text-xs text-text-muted flex items-center gap-1">
                      <Calendar size={11} /> {formatDate(rp.publishedAt)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </Container>
        </Section>
      )}

      {/* CLUSTER CONTEXTUAL (Jul 2026): ciudades + categorías relacionadas.
          Cierra el silo: post → geo, post → taxonomía. Si el post menciona
          una ciudad, se prioriza primera en el bloque geográfico. */}
      <Section background="muted" spacing="sm">
        <Container size="md">
          <div className="flex flex-col gap-6">
            <RelatedCities
              mentionedCitySlug={mentionedCities[0] ?? null}
              limit={6}
              eyebrow="Atendemos en el sur de Honduras"
            />
            <RelatedCategories current={post.category} limit={8} />
          </div>
        </Container>
      </Section>

      {/* ── FINAL CTA ── */}
      {/* Un único CTA de cierre por post. LocalConsultForm eliminado: era
          redundante con BlogCtaBar (ambos al mismo endpoint /api/consulta).
          BlogCtaBar ya ofrece teléfono + WhatsApp + enlace al formulario. */}
      <Section spacing="md">
        <Container size="md">
          <BlogCtaBar category={post.category} />
        </Container>
      </Section>

      {/* ── SCHEMAS ── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostSchema(post)) }}
      />
      {faqLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
        />
      )}
    </>
  );
}
