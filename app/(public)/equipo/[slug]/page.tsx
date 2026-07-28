import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CheckCircle2, ArrowRight, Award } from 'lucide-react';
import { Section, Container } from '@/components/marketing/section';
import { Breadcrumbs } from '@/components/marketing/breadcrumbs';
import { ConsultationCTA } from '@/components/marketing/consultation-cta';
import { LegalDisclaimer } from '@/components/marketing/legal-disclaimer';
import { getPublishedPosts } from '@/lib/blog-db';
import { normalizeReviewStatus } from '@/lib/legal-review';
import { buildMetadata } from '@/lib/seo';
import {
  site,
  getLawyerProfileBySlug,
  LAWYER_PROFILES,
  FOUNDER_PROFILE,
  THANIA_PROFILE,
  EMIL_PROFILE,
} from '@/lib/site';

export const revalidate = 3600;

type Props = { params: Promise<{ slug: string }> };

/**
 * slug canónico de los tres perfiles exigidos por el plan maestro §4.
 * generateStaticParams enumera exactamente esos tres: nada más se pre-render.
 */
export function generateStaticParams() {
  return LAWYER_PROFILES.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const profile = getLawyerProfileBySlug(slug);
  if (!profile) return {};

  return buildMetadata({
    title: profile.metaTitle,
    description: profile.metaDescription,
    canonicalPath: `/equipo/${profile.slug}`,
    keywords: [
      profile.name,
      `${profile.name.split(' ')[0]} abogado`,
      'abogado colegiado en Honduras',
      'Pineda y Asociados',
      profile.areas[0],
    ],
    ogImage: profile.image,
    ogImageAlt: profile.imageAlt,
    ogType: 'profile',
  });
}

export default async function LawyerProfilePage({ params }: Props) {
  const { slug } = await params;
  const profile = getLawyerProfileBySlug(slug);
  if (!profile) notFound();

  // Mapa slug → datos de credenciales reales (CAH, LinkedIn, directorio) desde
  // lib/site.ts. No se inventan: cada campo viene de variables de entorno que
  // el despacho configura (R4). Si no están, no se muestran placeholders.
  const credentialsBySlug: Record<string, {
    cah: string | null;
    linkedin: string | null;
    directorio: string | null;
  }> = {
    'danilo-pineda-maradiaga': {
      cah: FOUNDER_PROFILE.cah,
      linkedin: FOUNDER_PROFILE.linkedin,
      directorio: FOUNDER_PROFILE.directorio,
    },
    'thania-marlene-paz': {
      cah: THANIA_PROFILE.cah,
      linkedin: THANIA_PROFILE.linkedin,
      directorio: THANIA_PROFILE.directorio,
    },
    'emil-barahona': {
      cah: EMIL_PROFILE.cah,
      linkedin: EMIL_PROFILE.linkedin,
      directorio: EMIL_PROFILE.directorio,
    },
  };
  const credentials = credentialsBySlug[profile.slug];

  // Artículos escritos y revisados por este abogado (DB-resiliente: si la DB
  // no es alcanzable, se muestra la sección vacía sin romper). Excluye posts
  // pendientes de revisión (noindex) — solo listamos verificados.
  let authored = 0;
  let reviewed = 0;
  try {
    const posts = await getPublishedPosts();
    for (const p of posts) {
      const verified = normalizeReviewStatus(p.reviewStatus) === 'verified';
      if (!verified) continue;
      if (p.author === profile.name) authored += 1;
      if (p.reviewedBy === profile.name) reviewed += 1;
    }
  } catch {
    // En build/preview sin DB, la sección simplemente muestra availability
    // condicional en runtime. No se inventan artículos.
  }

  // ProfilePage JSON-LD (plan §15.3). mainEntity apunta al Person @id estable
  // ya declarado en el @graph global del layout público (founderSchema /
  // thaniaSchema / emilSchema). No se duplican los datos Person aquí.
  const profileLd = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    '@id': `${site.url}/equipo/${profile.slug}#profilepage`,
    url: `${site.url}/equipo/${profile.slug}`,
    inLanguage: 'es-HN',
    isPartOf: { '@id': `${site.url}/#website` },
    mainEntity: { '@id': profile.personId },
  };

  return (
    <>
      <div className="bg-surface-alt border-b border-border/50">
        <Container size="lg">
          <Breadcrumbs
            items={[
              { label: 'Inicio', href: '/' },
              { label: 'El Despacho', href: '/despacho' },
              { label: 'Equipo', href: '/despacho' },
              { label: profile.name },
            ]}
          />
        </Container>
      </div>

      {/* HERO del perfil */}
      <Section spacing="sm">
        <Container size="lg">
          <div className="max-w-3xl mx-auto">
            <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-eyebrow px-3 py-1.5 rounded-full bg-primary/10 text-primary mb-5">
              Abogado colegiado en Honduras
            </p>
            <h1 className="font-serif font-extrabold text-3xl md:text-4xl lg:text-5xl leading-tight text-text tracking-[-0.01em]">
              {profile.h1}
            </h1>
            <p className="mt-4 text-lg text-text-secondary leading-relaxed">
              {profile.description}
            </p>
            <p className="mt-5 text-sm font-semibold text-text">
              {profile.jobTitle} · {site.name}
            </p>

            {/* Credenciales reales (solo si existen; R4: no placeholders) */}
            {(credentials.cah || credentials.linkedin || credentials.directorio) && (
              <div className="mt-5 flex flex-wrap items-center gap-2">
                {credentials.cah && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface border border-border-light text-xs text-text-secondary font-medium">
                    <Award size={12} /> CAH: {credentials.cah}
                  </span>
                )}
                {credentials.linkedin && (
                  <a
                    href={credentials.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface border border-border-light text-xs text-text-secondary hover:text-primary transition-colors"
                  >
                    LinkedIn
                  </a>
                )}
                {credentials.directorio && (
                  <a
                    href={credentials.directorio}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface border border-border-light text-xs text-text-secondary hover:text-primary transition-colors"
                  >
                    Directorio Jurídico
                  </a>
                )}
              </div>
            )}
          </div>
        </Container>
      </Section>

      {/* Áreas verificadas */}
      <Section spacing="sm">
        <Container size="lg">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-xl font-bold text-text mb-4">Áreas de práctica</h2>
            <ul className="grid sm:grid-cols-2 gap-3">
              {profile.areas.map((area) => (
                <li
                  key={area}
                  className="flex items-start gap-2 text-sm text-text-secondary"
                >
                  <CheckCircle2 size={16} className="flex-shrink-0 mt-0.5 text-accent-dark" />
                  <span>{area}</span>
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </Section>

      {/* Sobre el despacho + CTA */}
      <Section spacing="sm">
        <Container size="lg">
          <div className="max-w-3xl mx-auto rounded-lg border border-border/40 bg-surface-alt p-6">
            <h2 className="text-lg font-bold text-text mb-2">Atención en Nacaome, Valle</h2>
            <p className="text-sm text-text-secondary leading-relaxed mb-4">
              {profile.name} forma parte de {site.name}, bufete con sede en
              {' '}{site.address.city}, {site.address.department}. La asignación
              de cada asunto depende del área de práctica del abogado responsable
              y, cuando el tema es transversal, cuenta con revisión de un segundo
              profesional del equipo.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href={`/despacho`}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
              >
                Conocer el equipo completo <ArrowRight size={15} />
              </Link>
              <Link
                href={`/solicitar-consulta`}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
              >
                Solicitar evaluación confidencial <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </Container>
      </Section>

      {/* Artículos escritos / revisados (solo verificados, sin inventar) */}
      <Section spacing="sm">
        <Container size="lg">
          <div className="max-w-3xl mx-auto text-sm text-text-secondary">
            {authored > 0 || reviewed > 0 ? (
              <p>
                {authored > 0 && <>Autor de {authored} artículo{authored > 1 ? 's' : ''} verificado{authored > 1 ? 's' : ''} en el blog.</>}
                {authored > 0 && reviewed > 0 && <br />}
                {reviewed > 0 && <>Revisor jurídico de {reviewed} contenido{reviewed > 1 ? 's' : ''}.</>}
              </p>
            ) : (
              <p className="text-text-muted">
                Los artículos jurídicos del bufete se asignan por área de
                práctica y se publican únicamente tras revisión jurídica humana.
              </p>
            )}
          </div>
        </Container>
      </Section>

      <LegalDisclaimer />

      <ConsultationCTA />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(profileLd) }}
      />
    </>
  );
}