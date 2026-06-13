'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Scale, Calculator, BookOpen, ArrowRight, FilePlus, ShieldCheck,
  ClipboardList, Search, Gavel, FileCheck, AlertTriangle, Sparkles,
  BookMarked, Layers, TrendingUp, Activity, Zap, Users,
  FileText, MessageSquare, Settings, User, BarChart3,
  Plus, PenLine, ExternalLink, Globe,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { ArticuloAutocomplete } from '@/components/domain/articulo-autocomplete';
import { site } from '@/lib/site';
import { formatHondurasDate, getHondurasClock } from '@/lib/datetime';

interface Feature {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  desc: string;
  href: string;
  cta: string;
  tone: 'accent' | 'success' | 'info' | 'warning' | 'neutral';
  badge?: string;
  external?: boolean;
}

const FEATURES: Feature[] = [
  {
    icon: Calculator,
    title: 'Calcular pena',
    desc: 'Flujo guiado de 8 pasos: delito, participación, tentativa, concurso, agravantes, atenuantes, eximentes y resultado.',
    href: '/intranet/calculadora',
    cta: 'Iniciar cálculo',
    tone: 'accent',
    badge: 'Motor v1',
    external: true,
  },
  {
    icon: ClipboardList,
    title: 'Mis casos',
    desc: 'Guarda, organiza y consulta tus cálculos con fecha, cliente y PDF exportable.',
    href: '/intranet/casos',
    cta: 'Ver mis casos',
    tone: 'success',
    external: true,
  },
  {
    icon: BookOpen,
    title: 'Biblioteca del Código Penal',
    desc: 'Consulta los artículos del CP de Honduras (Decreto 130-2017 y reformas vigentes) con búsqueda por número, epígrafe o tema.',
    href: '/intranet/cp',
    cta: 'Abrir biblioteca',
    tone: 'info',
    badge: 'Decreto 130-2017 · Reformas 59-2024',
    external: true,
  },
  {
    icon: FileCheck,
    title: 'Catálogo de delitos',
    desc: 'Busca, crea y edita tipos penales con sus artículos y rangos de pena asociados.',
    href: '/intranet/delitos',
    cta: 'Explorar catálogo',
    tone: 'neutral',
    external: true,
  },
  {
    icon: FilePlus,
    title: 'Registrar nuevo delito',
    desc: 'Añadir un tipo penal personalizado al catálogo de delitos.',
    href: '/delito-form',
    cta: 'Añadir delito',
    tone: 'accent',
    external: true,
  },
];

const RULES = [
  { icon: Gavel, label: 'Concurso real, ideal y continuado' },
  { icon: Layers, label: 'Mitad superior e inferior' },
  { icon: Sparkles, label: 'Agravantes y atenuantes' },
  { icon: ShieldCheck, label: 'Eximentes completas e incompletas' },
  { icon: BookMarked, label: 'Tentativa y complicidad' },
];

interface AdminStats {
  usuarios: number;
  posts: {
    total: number;
    published: number;
    drafts: number;
    recent: { id: string; title: string; slug: string; category: string; published: boolean; publishedAt: string }[];
  };
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
    Promise.all([
      fetch('/api/delitos/count').then((r) => r.json()),
      fetch('/api/clasificaciones').then((r) => r.json()),
      fetch('/api/admin/usuarios?limit=1').then((r) => r.json()),
      fetch('/api/admin/blog?limit=5').then((r) => r.json()),
      fetch('/api/admin/blog?published=true&limit=1').then((r) => r.json()),
      fetch('/api/admin/blog?published=false&limit=1').then((r) => r.json()),
      fetch('/api/admin/faq').then((r) => r.json()),
    ])
      .then(([delitosCount, clas, usersData, postsData, pubPosts, draftPosts, faqsData]) => {
        const faqs = faqsData.faqs ?? [];
        setStats({
          delitos: delitosCount.total ?? 0,
          clasificaciones: Array.isArray(clas) ? clas.length : 0,
          usuarios: usersData.total ?? 0,
          posts: {
            total: postsData.total ?? 0,
            published: pubPosts.total ?? 0,
            drafts: draftPosts.total ?? 0,
            recent: (postsData.posts ?? []).slice(0, 5),
          },
          faqs: {
            total: faqs.length,
            published: faqs.filter((f: { published: boolean }) => f.published).length,
            drafts: faqs.filter((f: { published: boolean }) => !f.published).length,
          },
        });
      })
      .catch((e) => console.warn('Stats error', e))
      .finally(() => setLoading(false));
    return () => clearInterval(t);
  }, []);

  const toneClasses: Record<Feature['tone'], { bg: string; icon: string; ring: string }> = {
    accent: { bg: 'bg-accent/15', icon: 'text-primary', ring: 'ring-accent/20' },
    success: { bg: 'bg-success-bg', icon: 'text-success', ring: 'ring-success/20' },
    info: { bg: 'bg-info-bg', icon: 'text-info', ring: 'ring-info/20' },
    warning: { bg: 'bg-warning-bg', icon: 'text-warning', ring: 'ring-warning/20' },
    neutral: { bg: 'bg-surface-alt', icon: 'text-text-secondary', ring: 'ring-border-light' },
  };

  const greeting = (() => {
    const h = getHondurasClock(now ?? new Date()).hour;
    if (h < 12) return 'Buenos días';
    if (h < 18) return 'Buenas tardes';
    return 'Buenas noches';
  })();

  const dateStr = formatHondurasDate(now ?? new Date(), {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const formatDate = (d: string) => {
    try { return new Date(d).toLocaleDateString('es-HN', { day: 'numeric', month: 'short', year: 'numeric' }); }
    catch { return d; }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      {/* Hero / bienvenida — estilo dashboard */}
      <Card padding="md" className="relative overflow-hidden border-l-4 border-l-accent">
        <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-accent/10 blur-2xl pointer-events-none" />
        <div className="flex items-start gap-3 relative">
          <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center flex-shrink-0 shadow-md">
            <Scale size={22} className="text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xxs font-bold uppercase tracking-widest text-accent-dark">
              {greeting}
            </p>
            <h2 className="font-extrabold text-lg text-primary leading-tight mt-0.5">
              Panel de Administración
            </h2>
            <p className="text-xs text-text-secondary mt-1 leading-5 capitalize">
              {dateStr} · {site.address.city}, {site.address.department}
            </p>
          </div>
          <Badge tone="success" className="hidden sm:inline-flex">
            <Activity size={10} className="mr-1" /> Sesión activa
          </Badge>
        </div>

        {/* Stats combinadas: 2 filas de 4 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
          <div className="relative bg-surface-alt rounded-md p-2.5 text-center overflow-hidden">
            <FileCheck size={14} className="mx-auto mb-1 text-primary" aria-hidden="true" />
            <p className="text-primary font-extrabold text-lg tabular-nums leading-none">{stats?.delitos ?? 0}</p>
            <p className="text-xxs text-text-muted uppercase tracking-wider mt-1">Delitos</p>
          </div>
          <div className="relative bg-surface-alt rounded-md p-2.5 text-center overflow-hidden">
            <BookOpen size={14} className="mx-auto mb-1 text-info" aria-hidden="true" />
            <p className="text-primary font-extrabold text-lg tabular-nums leading-none">635</p>
            <p className="text-xxs text-text-muted uppercase tracking-wider mt-1">Arts. CP</p>
          </div>
          <div className="relative bg-surface-alt rounded-md p-2.5 text-center overflow-hidden">
            <Layers size={14} className="mx-auto mb-1 text-accent-dark" aria-hidden="true" />
            <p className="text-primary font-extrabold text-lg tabular-nums leading-none">{stats?.clasificaciones ?? 0}</p>
            <p className="text-xxs text-text-muted uppercase tracking-wider mt-1">Ramas</p>
          </div>
          <div className="relative bg-surface-alt rounded-md p-2.5 text-center overflow-hidden">
            <Zap size={14} className="mx-auto mb-1 text-aggravation" aria-hidden="true" />
            <p className="text-primary font-extrabold text-lg tabular-nums leading-none">8</p>
            <p className="text-xxs text-text-muted uppercase tracking-wider mt-1">Pasos</p>
          </div>
          <div className="relative bg-surface-alt rounded-md p-2.5 text-center overflow-hidden">
            <FileText size={14} className="mx-auto mb-1 text-success" aria-hidden="true" />
            <p className="text-primary font-extrabold text-lg tabular-nums leading-none">{stats?.posts.total ?? 0}</p>
            <p className="text-xxs text-text-muted uppercase tracking-wider mt-1">Posts</p>
          </div>
          <div className="relative bg-surface-alt rounded-md p-2.5 text-center overflow-hidden">
            <FileText size={14} className="mx-auto mb-1 text-success" aria-hidden="true" />
            <p className="text-success font-extrabold text-lg tabular-nums leading-none">{stats?.posts.published ?? 0}</p>
            <p className="text-xxs text-text-muted uppercase tracking-wider mt-1">Publicados</p>
          </div>
          <div className="relative bg-surface-alt rounded-md p-2.5 text-center overflow-hidden">
            <FileText size={14} className="mx-auto mb-1 text-warning" aria-hidden="true" />
            <p className="text-warning font-extrabold text-lg tabular-nums leading-none">{stats?.posts.drafts ?? 0}</p>
            <p className="text-xxs text-text-muted uppercase tracking-wider mt-1">Borradores</p>
          </div>
          <div className="relative bg-surface-alt rounded-md p-2.5 text-center overflow-hidden">
            <MessageSquare size={14} className="mx-auto mb-1 text-info" aria-hidden="true" />
            <p className="text-primary font-extrabold text-lg tabular-nums leading-none">{stats?.faqs.total ?? 0}</p>
            <p className="text-xxs text-text-muted uppercase tracking-wider mt-1">FAQs</p>
          </div>
        </div>
      </Card>

      {/* Acciones rápidas + búsqueda */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Quick actions */}
        <Card padding="md">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-md bg-accent/15 flex items-center justify-center">
              <Zap size={14} className="text-accent-dark" />
            </div>
            <h2 className="font-bold text-sm text-primary">Acciones rápidas</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/intranet/admin/blog/nuevo">
              <Button variant="primary" size="sm"><Plus size={14} className="mr-1" /> Nuevo post</Button>
            </Link>
            <Link href="/intranet/admin/faq">
              <Button variant="secondary" size="sm"><Plus size={14} className="mr-1" /> Nueva FAQ</Button>
            </Link>
            <Link href="/intranet/admin/blog">
              <Button variant="secondary" size="sm"><PenLine size={14} className="mr-1" /> Gestionar blog</Button>
            </Link>
            <Link href="/intranet/admin/seo">
              <Button variant="secondary" size="sm"><BarChart3 size={14} className="mr-1" /> Panel SEO</Button>
            </Link>
            <Link href="/intranet/admin/pages">
              <Button variant="ghost" size="sm"><Globe size={14} className="mr-1" /> Páginas</Button>
            </Link>
          </div>
        </Card>

        {/* Quick search */}
        <Card padding="md" className="border-l-4 border-l-accent">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-md bg-accent/15 flex items-center justify-center">
              <Search size={14} className="text-accent-dark" />
            </div>
            <h2 className="font-bold text-sm text-primary">Búsqueda rápida de artículos</h2>
            <Badge tone="info">CP Honduras</Badge>
          </div>
          <p className="text-xxs text-text-secondary mb-2 leading-4">
            Buscá por número (Art. 19), epígrafe (hurto) o tema (eximente).
          </p>
          <ArticuloAutocomplete />
        </Card>
      </div>

      {/* Features / herramientas jurídicas — estilo dashboard */}
      <div>
        <div className="flex items-center justify-between mb-2 px-1">
          <p className="text-xxs font-bold text-text-muted uppercase tracking-wider">Herramientas jurídicas</p>
          <p className="text-xxs text-text-muted inline-flex items-center gap-1">
            <TrendingUp size={10} /> 5 módulos activos
          </p>
        </div>
        <div className="space-y-2">
          {FEATURES.map((f) => {
            const tone = toneClasses[f.tone];
            return (
              <Link
                key={f.href}
                href={f.href}
                className={`group flex items-center bg-surface p-3 rounded-md border border-border-light shadow-sm hover:shadow-md hover:border-accent/50 transition-all focus-visible:outline-none focus-visible:ring-2 ${tone.ring}`}
              >
                <div className={`w-11 h-11 rounded-md flex items-center justify-center mr-3 flex-shrink-0 ${tone.bg}`}>
                  <f.icon size={20} className={tone.icon} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-bold text-text text-sm">{f.title}</p>
                    {f.badge && (
                      <span className="hidden sm:inline-block px-1.5 py-0.5 rounded-full bg-accent/15 text-accent-dark text-xxs font-bold uppercase tracking-wider">{f.badge}</span>
                    )}
                  </div>
                  <p className="text-text-secondary text-xxs leading-4 mt-0.5">{f.desc}</p>
                </div>
                <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                  <span className="text-xxs font-semibold text-accent-dark hidden sm:inline group-hover:text-primary transition-colors">{f.cta}</span>
                  <ArrowRight size={16} className="text-text-muted group-hover:translate-x-0.5 group-hover:text-accent-dark transition-all" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Blog recent posts + Módulos + Reglas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent posts */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xxs font-bold text-text-muted uppercase tracking-wider">Posts recientes</p>
            <Link href="/intranet/admin/blog" className="text-xxs text-accent hover:text-accent-dark transition-colors flex items-center gap-1">
              Ver todos <ArrowRight size={10} />
            </Link>
          </div>
          {stats && stats.posts.recent.length === 0 ? (
            <Card padding="md">
              <p className="text-center text-text-secondary text-sm">No hay posts aún.</p>
              <div className="flex justify-center mt-2">
                <Link href="/intranet/admin/blog/nuevo"><Button variant="primary" size="sm"><Plus size={14} className="mr-1" /> Crear primer post</Button></Link>
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

          {/* Rules applied — estilo dashboard */}
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

        {/* Sidebar modules */}
        <div className="space-y-3">
          <p className="text-xxs font-bold text-text-muted uppercase tracking-wider">Módulos de gestión</p>
          {[
            { label: 'Blog', desc: `${stats?.posts.published ?? 0} publicados · ${stats?.posts.drafts ?? 0} borradores`, href: '/intranet/admin/blog', icon: FileText, stat: stats?.posts.total, statLabel: 'posts' },
            { label: 'FAQ', desc: `${stats?.faqs.published ?? 0} publicadas · ${stats?.faqs.drafts ?? 0} borradores`, href: '/intranet/admin/faq', icon: MessageSquare, stat: stats?.faqs.total, statLabel: 'preguntas' },
            { label: 'Páginas', desc: 'Editar contenido de páginas públicas', href: '/intranet/admin/pages', icon: Globe, statLabel: 'secciones' },
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

      {/* Marco normativo */}
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
          Los tipos penales, rangos de pena, atenuantes, agravantes y eximentes están
          codificados en el motor conforme a los artículos 1 a 635.
        </p>
        <Link
          href="/derecho-penal"
          className="inline-flex items-center gap-1 mt-2 text-xxs font-semibold text-primary hover:text-accent-dark"
        >
          Ver marco normativo completo <ArrowRight size={12} />
        </Link>
      </Card>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xxs text-text-muted">
        <span className="flex items-center gap-1"><Badge tone="success">Publicado</Badge> Visible en la web</span>
        <span className="flex items-center gap-1"><Badge tone="warning">Borrador</Badge> Solo visible en admin</span>
        <span className="flex items-center gap-1"><AlertTriangle size={10} className="text-text-muted" /> Cálculo orientativo y técnico</span>
      </div>
    </div>
  );
}
