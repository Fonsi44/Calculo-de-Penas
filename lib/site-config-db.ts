import { db } from '@/lib/db';
import { configuracionSitio } from '@/lib/schema';

export async function getSiteConfigOverrides(): Promise<Record<string, string>> {
  try {
    const rows = await db.select().from(configuracionSitio);
    const config: Record<string, string> = {};
    for (const row of rows) {
      config[row.clave] = row.valor;
    }
    return config;
  } catch {
    return {};
  }
}

export interface SeoOverrides {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  googleVerification?: string;
  noindex?: boolean;
  sitemapAuto?: boolean;
}

/**
 * Lee los campos SEO de la tabla configuracion_sitio y devuelve un objeto
 * con los valores tipados. Los valores de DB tienen precedencia sobre env vars.
 */
export async function getSeoOverrides(): Promise<SeoOverrides> {
  const overrides = await getSiteConfigOverrides();
  return {
    title: overrides['seo_title'] || undefined,
    description: overrides['seo_description'] || undefined,
    keywords: overrides['seo_keywords'] || undefined,
    ogImage: overrides['seo_og_image'] || undefined,
    googleVerification: overrides['seo_google_verification'] || undefined,
    noindex: overrides['seo_noindex'] === 'true' ? true : overrides['seo_noindex'] === 'false' ? false : undefined,
    sitemapAuto: overrides['seo_sitemap_auto'] === 'true' ? true : undefined,
  };
}
