'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Scale, BookOpen, ArrowRight, ShieldCheck,
  Search, Gavel, AlertTriangle, Sparkles,
  BookMarked, Layers, Activity, Zap, Users,
  FileText, MessageSquare, Settings, User, BarChart3,
  Plus, PenLine, ExternalLink, Globe,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { StatCards } from '@/components/ui/stat-cards';
import { ArticuloAutocomplete } from '@/components/domain/articulo-autocomplete';
import { site } from '@/lib/site';
import { apiFetch } from '@/lib/api-fetch';
import { formatHondurasDate, getHondurasClock } from '@/lib/datetime';

const RULES = [
  { icon: Gavel, label: 'Concurso real, ideal y continuado' },
  { icon: Layers, label: 'Mitad superior e inferior' },
  { icon: Sparkles, label: 'Agravantes y atenuantes' },
  { icon: ShieldCheck, label: 'Eximentes completas e incompletas' },
  { icon: BookMarked, label: 'Tentativa y complicidad' },
];

interface AdminStats {
  usuarios: number;
  posts: { total: number; published: number; drafts: number; recent: { id: string; title: string; slug: string; category: string; published: boolean; publishedAt: string }[] };
  faqs: { total: number; published: number; drafts: number };
  delitos: number;
  clasificaciones: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState<Date | null>(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    // apiFetch centraliza el manejo de sesión expirada (401 → redirect login),
    // evitando que el dashboard quede en spinner silencioso si el token caduca.
    Promise.all([
      apiFetch<{ total?: number }>('/api/delitos/count'),
      apiFetch<unknown[]>('/api/clasificaciones'),
      apiFetch<{ total?: number }>('/api/admin/usuarios?limit=1'),
      apiFetch<{ total?: number; posts?: { id: string; title: string; slug: string; category: string; published: boolean; publishedAt: string }[] }>('/api/admin/blog?limit=5'),
      apiFetch<{ total?: number }>('/api/admin/blog?published=true&limit=1'),
      apiFetch<{ total?: number }>('/api/admin/blog?published=false&limit=1'),
      apiFetch<{ faqs?: { published: boolean }[] }>('/api/admin/faq'),
    ])
      .then(([delitosCount, clas, usersData, postsData, pubPosts, draftPosts, faqsData]) => {
        const faqs = faqsData.faqs ?? [];
        setStats({
          delitos: delitosCount.total ?? 0,
          clasificaciones: Array.isArray(clas) ? clas.length : 0,
          usuarios: usersData.total ?? 0,
          posts: { total: postsData.total ?? 0, published: pubPosts.total ?? 0, drafts: draftPosts.total ?? 0, recent: (postsData.posts ?? []).slice(0, 5) },
          faqs: { total: faqs.length, published: faqs.filter((f) => f.published).length, drafts: faqs.filter((f) => !f.published).length },
        });
      })
      .catch((e) => {
        // apiFetch lanza ApiError; los 401 ya redirigen. El resto (red/500)
        // se loguea y el dashboard muestra los stats en 0 (estado loading ya false).
        console.warn('Stats error', e instanceof Error ? e.message : e);
      })
      .finally(() => setLoading(false));
    return () => clearInterval(t);
  }, []);

  const greeting = (() => {
    const h = getHondurasClock(now ?? new Date()).hour;
    if (h < 12) return 'Buenos días';
    if (h < 18) return 'Buenas tardes';
    return 'Buenas noches';
  })();

  const dateStr = formatHondurasDate(now ?? new Date(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const formatDate = (d: string) => {
    try { return new Date(d).toLocaleDateString('es-HN', { day: 'numeric', month: 'short', year: 'numeric' }); }
    catch { return d; }
  };

  if (loading) {
    return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;
  }

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      {/* Welcome hero */}
      <div className="bg-surface border border-border-light rounded-xl p-5 relative overflow-hidden shadow-sm">
        <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-accent/10 blur-2xl pointer-events-none" />
        <div className="flex items-start gap-3 relative">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center flex-shrink-0 shadow-md">
            <Scale size={22} className="text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xxs font-bold uppercase tracking-widest text-accent-dark">{greeting}</p>
            <h2 className="font-extrabold text-lg text-primary leading-tight mt-0.5">Panel de Administración</h2>
            <p className="text-xs text-text-secondary mt-1 leading-5 capitalize">{dateStr} · {site.address.city}, {site.address.department}</p>
          </div>
          <Badge tone="success" className="hidden sm:inline-flex"><Activity size={10} className="mr-1" /> Sesión activa</Badge>
        </div>
      </div>

      {/* Stats grid */}
      <StatCards
        columns={4}
        items={[
          { value: stats?.delitos ?? 0, label: 'Delitos', tone: 'default' },
          { value: site.corpus.articulosCp, label: 'Arts. CP', tone: 'info' },
          { value: stats?.clasificaciones ?? 0, label: 'Ramas', tone: 'accent' },
          { value: site.corpus.pasosWizard, label: 'Pasos', tone: 'default' },
          { value: stats?.posts.total ?? 0, label: 'Posts', tone: 'success' },
          { value: stats?.posts.published ?? 0, label: 'Publicados', tone: 'success' },
          { value: stats?.posts.drafts ?? 0, label: 'Borradores', tone: 'warning' },
          { value: stats?.faqs.total ?? 0, label: 'FAQs', tone: 'info' },
        ]}
      />

      {/* Quick actions + search */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card padding="md">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-md bg-accent/15 flex items-center justify-center">
              <Zap size={14} className="text-accent-dark" />
            </div>
            <h2 className="font-bold text-sm text-primary">Acciones rápidas</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/intranet/admin/blog/nuevo"><Button variant="primary" size="sm"><Plus size={14} /> Nuevo post</Button></Link>
            <Link href="/intranet/admin/faq"><Button variant="secondary" size="sm"><Plus size={14} /> Nueva FAQ</Button></Link>
            <Link href="/intranet/admin/blog"><Button variant="secondary" size="sm"><PenLine size={14} /> Gestionar blog</Button></Link>
            <Link href="/intranet/admin/seo"><Button variant="secondary" size="sm"><BarChart3 size={14} /> Panel SEO</Button></Link>
            <Link href="/intranet/admin/pages"><Button variant="ghost" size="sm"><Globe size={14} /> Páginas</Button></Link>
          </div>
        </Card>

        <Card padding="md" className="border-l-4 border-l-accent">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-md bg-accent/15 flex items-center justify-center">
              <Search size={14} className="text-accent-dark" />
            </div>
            <h2 className="font-bold text-sm text-primary">Búsqueda rápida de artículos</h2>
            <Badge tone="info">CP Honduras</Badge>
          </div>
          <p className="text-xxs text-text-secondary mb-2 leading-4">Buscá por número (Art. 19), epígrafe (hurto) o tema (eximente).</p>
          <ArticuloAutocomplete />
        </Card>
      </div>

      {/* Blog recent posts + Modules */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xxs font-bold text-text-muted uppercase tracking-wider">Posts recientes</p>
            <Link href="/intranet/admin/blog" className="text-xxs text-accent hover:text-accent-dark transition-colors flex items-center gap-1">Ver todos <ArrowRight size={10} /></Link>
          </div>
          {stats && stats.posts.recent.length === 0 ? (
            <Card padding="md">
              <p className="text-center text-text-secondary text-sm">No hay posts aún.</p>
              <div className="flex justify-center mt-2">
                <Link href="/intranet/admin/blog/nuevo"><Button variant="primary" size="sm"><Plus size={14} /> Crear primer post</Button></Link>
              </div>
            </Card>
          ) : stats ? (
            <Card padding="none">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border-light text-text-secondary">
                      <th className="text-left p-3 text-xxs font-bold uppercase">Título</th>
                      <th className="text-left p-3 text-xxs font-bold uppercase hidden sm:table-cell">Estado</th>
                      <th className="text-left p-3 text-xxs font-bold uppercase hidden md:table-cell">Fecha</th>
                      <th className="text-right p-3 text-xxs font-bold uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.posts.recent.map((p) => (
                      <tr key={p.id} className="border-b border-border-light hover:bg-surface-alt">
                        <td className="p-3 max-w-[200px]">
                          <p className="font-medium text-text truncate text-xs">{p.title}</p>
                          <p className="text-xxs text-text-muted truncate">{p.category}</p>
                        </td>
                        <td className="p-3 hidden sm:table-cell">
                          <Badge tone={p.published ? 'success' : 'warning'}>{p.published ? 'Publicado' : 'Borrador'}</Badge>
                        </td>
                        <td className="p-3 text-text-secondary text-xxs hidden md:table-cell">{formatDate(p.publishedAt)}</td>
                        <td className="p-3">
                          <div className="flex items-center justify-end gap-1">
                            <Link href={`/intranet/admin/blog/${p.id}`}>
                              <Button variant="ghost" size="sm" aria-label="Editar"><PenLine size={13} /></Button>
                            </Link>
                            {p.published && (
                              <Link href={`/blog/${p.category}/${p.slug}`} target="_blank" rel="noopener noreferrer">
                                <Button variant="ghost" size="sm" aria-label="Ver"><ExternalLink size={13} /></Button>
                              </Link>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : null}

          <Card padding="md">
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-primary/10 rounded-full w-fit mb-2">
              <ShieldCheck size={12} className="text-accent-dark" />
              <span className="font-bold text-xxs text-primary uppercase tracking-wider">Reglas técnicas que aplica el motor</span>
            </div>
            <ul className="space-y-1.5">
              {RULES.map((r, i) => (
                <li key={i} className="flex items-center gap-2 text-xs text-text-secondary">
                  <r.icon size={14} className="text-accent-dark flex-shrink-0" />
                  <span>{r.label}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <div className="space-y-3">
          <p className="text-xxs font-bold text-text-muted uppercase tracking-wider">Módulos de gestión</p>
          {[
            { label: 'Blog', desc: `${stats?.posts.published ?? 0} publicados · ${stats?.posts.drafts ?? 0} borradores`, href: '/intranet/admin/blog', icon: FileText, stat: stats?.posts.total, statLabel: 'posts' },
            { label: 'FAQ', desc: `${stats?.faqs.published ?? 0} publicadas · ${stats?.faqs.drafts ?? 0} borradores`, href: '/intranet/admin/faq', icon: MessageSquare, stat: stats?.faqs.total, statLabel: 'preguntas' },
            { label: 'Páginas', desc: 'Editar contenido de páginas públicas', href: '/intranet/admin/pages', icon: Globe },
            { label: 'Usuarios', desc: 'Gestionar cuentas y roles', href: '/intranet/admin/usuarios', icon: Users, stat: stats?.usuarios, statLabel: 'usuarios' },
            { label: 'SEO', desc: 'Analítica y optimización', href: '/intranet/admin/seo', icon: BarChart3 },
            { label: 'Configuración', desc: 'Datos del sitio y preferencias', href: '/intranet/admin/pages/configuracion', icon: Settings },
            { label: 'Perfil', desc: 'Cambiar contraseña', href: '/intranet/admin/perfil', icon: User },
          ].map((mod) => (
            <Link key={mod.href} href={mod.href}>
              <Card padding="md" className="hover:shadow-md hover:border-accent/50 transition-all cursor-pointer">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-accent/15 flex items-center justify-center flex-shrink-0">
                    <mod.icon size={18} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h2 className="font-bold text-sm text-primary">{mod.label}</h2>
                      <ArrowRight size={13} className="text-text-muted" />
                    </div>
                    <p className="text-xxs text-text-secondary mt-0.5">{mod.desc}</p>
                    {mod.stat !== undefined && <p className="text-xs font-semibold text-accent-dark mt-1">{mod.stat} {mod.statLabel}</p>}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Legal framework */}
      <Card padding="md" className="border-l-4 border-l-info">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen size={14} className="text-info" />
          <h2 className="font-bold text-sm text-primary">Marco normativo</h2>
          <Badge tone="info">Vigente</Badge>
        </div>
        <p className="text-xs text-text leading-5">
          El cálculo se basa en el <strong>Código Penal de Honduras</strong> (Decreto 130-2017,
          publicado en el Diario Oficial el 18 de enero de 2018) y sus reformas vigentes
          (Decretos 119-2019, 46-2020, 93-2021 y 59-2024).
        </p>
        <Link href="/derecho-penal" className="inline-flex items-center gap-1 mt-2 text-xxs font-semibold text-primary hover:text-accent-dark">
          Ver marco normativo completo <ArrowRight size={12} />
        </Link>
      </Card>

      <div className="flex flex-wrap gap-3 text-xxs text-text-muted">
        <span className="flex items-center gap-1"><Badge tone="success">Publicado</Badge> Visible en la web</span>
        <span className="flex items-center gap-1"><Badge tone="warning">Borrador</Badge> Solo visible en admin</span>
        <span className="flex items-center gap-1"><AlertTriangle size={10} className="text-text-muted" /> Cálculo orientativo y técnico</span>
      </div>
    </div>
  );
}
