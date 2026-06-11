'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, FileText, MessageSquare, Settings, User, ArrowRight, Plus, PenLine, FileEdit, ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';

interface AdminStats {
  usuarios: number;
  posts: { total: number; published: number; drafts: number; recent: { id: string; title: string; slug: string; category: string; published: boolean; publishedAt: string }[] };
  faqs: { total: number; published: number; drafts: number };
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/usuarios?limit=1').then(r => r.json()),
      fetch('/api/admin/blog?limit=5').then(r => r.json()),
      fetch('/api/admin/blog?published=true&limit=1').then(r => r.json()),
      fetch('/api/admin/blog?published=false&limit=1').then(r => r.json()),
      fetch('/api/admin/faq').then(r => r.json()),
    ]).then(([users, posts, pubPosts, draftPosts, faqsData]) => {
      const faqs = faqsData.faqs ?? [];
      setStats({
        usuarios: users.total ?? 0,
        posts: {
          total: posts.total ?? 0,
          published: pubPosts.total ?? 0,
          drafts: draftPosts.total ?? 0,
          recent: (posts.posts ?? []).slice(0, 5),
        },
        faqs: {
          total: faqs.length,
          published: faqs.filter((f: { published: boolean }) => f.published).length,
          drafts: faqs.filter((f: { published: boolean }) => !f.published).length,
        },
      });
    }).catch(console.warn).finally(() => setLoading(false));
  }, []);

  const formatDate = (d: string) => {
    try { return new Date(d).toLocaleDateString('es-HN', { day: 'numeric', month: 'short', year: 'numeric' }); }
    catch { return d; }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Spinner /></div>;
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-extrabold text-primary">Panel de Administración</h1>
        <p className="text-xs text-text-secondary mt-1">
          CMS · Gestión de contenido, usuarios y configuración del sitio
        </p>
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Card padding="sm" className="text-center">
          <p className="text-2xl font-extrabold text-primary tabular-nums">{stats?.posts.total ?? 0}</p>
          <p className="text-xxs text-text-muted uppercase tracking-wider">Posts totales</p>
        </Card>
        <Card padding="sm" className="text-center">
          <p className="text-2xl font-extrabold text-success tabular-nums">{stats?.posts.published ?? 0}</p>
          <p className="text-xxs text-text-muted uppercase tracking-wider">Publicados</p>
        </Card>
        <Card padding="sm" className="text-center">
          <p className="text-2xl font-extrabold text-warning tabular-nums">{stats?.posts.drafts ?? 0}</p>
          <p className="text-xxs text-text-muted uppercase tracking-wider">Borradores</p>
        </Card>
        <Card padding="sm" className="text-center">
          <p className="text-2xl font-extrabold text-info tabular-nums">{stats?.faqs.total ?? 0}</p>
          <p className="text-xxs text-text-muted uppercase tracking-wider">FAQs</p>
        </Card>
      </div>

      {/* QUICK ACTIONS */}
      <div>
        <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Acciones rápidas</p>
        <div className="flex flex-wrap gap-2">
          <Link href="/intranet/admin/blog/nuevo">
            <Button variant="primary" size="sm">
              <Plus size={14} className="mr-1" /> Nuevo post
            </Button>
          </Link>
          <Link href="/intranet/admin/faq">
            <Button variant="secondary" size="sm">
              <Plus size={14} className="mr-1" /> Nueva FAQ
            </Button>
          </Link>
          <Link href="/intranet/admin/blog">
            <Button variant="secondary" size="sm">
              <FileEdit size={14} className="mr-1" /> Gestionar blog
            </Button>
          </Link>
          <Link href="/intranet/admin/config">
            <Button variant="ghost" size="sm">
              <Settings size={14} className="mr-1" /> Configuración
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* RECENT POSTS */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Posts recientes</p>
            <Link href="/intranet/admin/blog" className="text-xxs text-accent hover:text-accent-dark transition-colors flex items-center gap-1">
              Ver todos <ArrowRight size={10} />
            </Link>
          </div>
          {stats?.posts.recent.length === 0 ? (
            <Card padding="md">
              <p className="text-center text-text-secondary text-sm">No hay posts aún.</p>
              <div className="flex justify-center mt-2">
                <Link href="/intranet/admin/blog/nuevo">
                  <Button variant="primary" size="sm"><Plus size={14} className="mr-1" /> Crear primer post</Button>
                </Link>
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
                    {stats.posts.recent.map(p => (
                      <tr key={p.id} className="border-b border-border-light hover:bg-surface-alt">
                        <td className="p-3 max-w-[200px]">
                          <p className="font-medium text-text truncate text-xs">{p.title}</p>
                          <p className="text-xxs text-text-muted truncate">{p.category}</p>
                        </td>
                        <td className="p-3 hidden sm:table-cell">
                          <Badge tone={p.published ? 'success' : 'warning'}>
                            {p.published ? 'Publicado' : 'Borrador'}
                          </Badge>
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
        </div>

        {/* SIDEBAR MODULES */}
        <div className="space-y-3">
          <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Módulos</p>
          {[
            { label: 'Blog', desc: `${stats?.posts.published ?? 0} publicados · ${stats?.posts.drafts ?? 0} borradores`, href: '/intranet/admin/blog', icon: FileText, stat: stats?.posts.total, statLabel: 'posts' },
            { label: 'FAQ', desc: `${stats?.faqs.published ?? 0} publicadas · ${stats?.faqs.drafts ?? 0} borradores`, href: '/intranet/admin/faq', icon: MessageSquare, stat: stats?.faqs.total, statLabel: 'preguntas' },
            { label: 'Usuarios', desc: 'Gestionar cuentas y roles', href: '/intranet/admin/usuarios', icon: Users, stat: stats?.usuarios, statLabel: 'usuarios' },
            { label: 'Configuración', desc: 'Datos del sitio y SEO', href: '/intranet/admin/config', icon: Settings },
            { label: 'Perfil', desc: 'Cambiar contraseña', href: '/intranet/admin/perfil', icon: User },
          ].map(mod => (
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
                    {mod.stat !== undefined && (
                      <p className="text-xs font-semibold text-accent-dark mt-1">{mod.stat} {mod.statLabel}</p>
                    )}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* LEGEND */}
      <div className="flex flex-wrap gap-3 text-xxs text-text-muted">
        <span className="flex items-center gap-1"><Badge tone="success">Publicado</Badge> Visible en la web</span>
        <span className="flex items-center gap-1"><Badge tone="warning">Borrador</Badge> Solo visible en admin</span>
      </div>
    </div>
  );
}
