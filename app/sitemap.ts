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
  { path: '/areas-de-practica', priority: 0.9, changeFrequency: 'monthly' },
  { path: '/areas-de-practica/defensa-penal', priority: 0.9, changeFrequency: 'monthly' },
  { path: '/areas-de-practica/delitos-contra-la-vida', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/areas-de-practica/delitos-contra-la-propiedad', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/areas-de-practica/drogas', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/areas-de-practica/violencia-domestica', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/areas-de-practica/delitos-sexuales', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/areas-de-practica/delitos-economicos', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/areas-de-practica/asistencia-detenidos', priority: 0.9, changeFrequency: 'monthly' },
  { path: '/areas-de-practica/audiencias', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/areas-de-practica/recursos', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/areas-de-practica/asesoria-preventiva', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/areas-de-practica/atencion-victimas', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/derecho-penal-hondureno', priority: 0.9, changeFrequency: 'monthly' },
  { path: '/proceso-penal', priority: 0.9, changeFrequency: 'monthly' },
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
