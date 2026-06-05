import type { MetadataRoute } from 'next';
import { site, absoluteUrl } from '@/lib/site';

/**
 * Listado de rutas públicas del sitio. Durante el modo noindex
 * (desarrollo) el sitemap se emite vacío para no entregar URL
 * alguna a los motores. Al lanzar, se enumeran todas las rutas
 * para que Google las descubra eficientemente.
 */

const PUBLIC_ROUTES: Array<{ path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']; lastModified?: Date }> = [
  { path: '/', priority: 1.0, changeFrequency: 'weekly' },
  { path: '/despacho', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/areas-juridicas', priority: 0.9, changeFrequency: 'monthly' },
  { path: '/areas-juridicas/derecho-de-familia', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/areas-juridicas/derecho-laboral', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/areas-juridicas/derecho-civil-y-notarial', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/areas-juridicas/derecho-mercantil-empresarial', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/areas-juridicas/derecho-bancario-y-financiero', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/areas-juridicas/derecho-administrativo-y-servicio-civil', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/areas-juridicas/derecho-aduanero-y-comercio-exterior', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/areas-juridicas/regulacion-sanitaria', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/areas-juridicas/extranjeria-en-honduras', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/areas-juridicas/propiedad-intelectual', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/areas-juridicas/tributario-fiscal', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/areas-juridicas/ambiental-regulatorio', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/areas-juridicas/conciliacion-y-arbitraje', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/derecho-penal', priority: 0.9, changeFrequency: 'monthly' },
  { path: '/derecho-penal/atencion-casos-penales-litigiosos', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/derecho-penal/mediacion-conflictos-penales-y-multas', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/derecho-penal/menores-justicia-juvenil', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/derecho-penal/proceso-penal-completo', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/derecho-penal/recursos-y-defensa-avanzada', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/derecho-penal/estrategia-penal-y-litigio', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/derecho-penal/ejecucion-penal-y-beneficios', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/migrantes-hondurenos-en-espana', priority: 0.9, changeFrequency: 'monthly' },
  { path: '/migrantes-hondurenos-en-espana/gestion-documental-y-legalizacion', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/migrantes-hondurenos-en-espana/actos-notariales-internacionales', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/migrantes-hondurenos-en-espana/asuntos-civiles-y-familiares-desde-el-extranjero', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/preguntas-frecuentes', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/blog', priority: 0.7, changeFrequency: 'weekly' },
  { path: '/contacto', priority: 0.9, changeFrequency: 'yearly' },
  { path: '/solicitar-consulta', priority: 0.95, changeFrequency: 'yearly' },
  { path: '/como-llegar', priority: 0.6, changeFrequency: 'yearly' },
  { path: '/aviso-legal', priority: 0.2, changeFrequency: 'yearly' },
  { path: '/politica-privacidad', priority: 0.2, changeFrequency: 'yearly' },
  { path: '/politica-cookies', priority: 0.2, changeFrequency: 'yearly' },
  { path: '/terminos', priority: 0.2, changeFrequency: 'yearly' },
  { path: '/disclaimer', priority: 0.2, changeFrequency: 'yearly' },
];

export default function sitemap(): MetadataRoute.Sitemap {
  // Modo noindex: devolvemos sitemap vacío para no entregar nada
  // a los motores. Al lanzar (NEXT_PUBLIC_NOINDEX=false) se enumera todo.
  if (site.noindex) {
    return [];
  }

  const now = new Date();
  return PUBLIC_ROUTES.map((r) => ({
    url: absoluteUrl(r.path),
    lastModified: r.lastModified ?? now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}
