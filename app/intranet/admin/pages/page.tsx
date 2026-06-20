'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Globe, ExternalLink,
  Eye, Copy, Trash2, Search, MoreHorizontal,
  Layers, Edit3, CheckCircle2, AlertCircle, Clock,
  FileEdit,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { PageHeader } from '@/components/ui/page-header';
import { cn } from '@/lib/ui';
import { useToast } from '@/components/ui/toast';
import { useConfirm } from '@/components/ui/confirm';

type PageStatus = 'published' | 'draft' | 'inactive';

interface PageItem {
  page: string;
  label: string;
  status: PageStatus;
  sections: number;
  fields: number;
  updatedAt: string | null;
  publishedAt: string | null;
  hasSeo: boolean;
}

const PAGE_ROUTES: Record<string, string> = {
  home: '/', despacho: '/despacho', 'solicitar-consulta': '/solicitar-consulta',
  'como-llegar': '/como-llegar', terminos: '/terminos', 'aviso-legal': '/aviso-legal',
  'politica-privacidad': '/politica-privacidad', 'politica-cookies': '/politica-cookies',
  disclaimer: '/disclaimer', 'servicios-juridicos': '/servicios-juridicos',
  'derecho-penal': '/derecho-penal', 'hondurenos-en-espana': '/hondurenos-en-espana',
};

const STATUS_CONFIG: Record<PageStatus, { label: string; tone: 'success' | 'warning' | 'danger' }> = {
  published: { label: 'Publicado', tone: 'success' },
  draft: { label: 'Borrador', tone: 'warning' },
  inactive: { label: 'Inactivo', tone: 'danger' },
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('es-HN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

export default function AdminPagesPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const [items, setItems] = useState<PageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<PageStatus | 'all'>('all');
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/pages?list=all')
      .then(r => r.json())
      .then(data => setItems(data.pages ?? []))
      .catch(() => toast.danger('Error al cargar páginas'))
      .finally(() => setLoading(false));
  }, [toast]);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!item.label.toLowerCase().includes(q) && !item.page.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [items, search, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: items.length,
      published: items.filter((i) => i.status === 'published').length,
      drafts: items.filter((i) => i.status === 'draft').length,
      inactive: items.filter((i) => i.status === 'inactive').length,
      withSeo: items.filter((i) => i.hasSeo).length,
    };
  }, [items]);

  const handleDuplicate = async (page: string) => {
    setOpenMenu(null);
    try {
      const res = await fetch('/api/admin/pages?page=' + page);
      const data = await res.json();
      if (data.grouped) {
        for (const [section, fields] of Object.entries(data.grouped as Record<string, Record<string, string>>)) {
          for (const [field, content] of Object.entries(fields)) {
            await fetch('/api/admin/pages', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ page: page + '-copia', section, field, content }),
            });
          }
        }
        toast.success('Contenido duplicado como borrador');
      }
    } catch {
      toast.danger('Error al duplicar');
    }
  };

  const handleDelete = async (page: string) => {
    setOpenMenu(null);
    const ok = await confirm({
      title: `¿Eliminar "${page}"?`,
      description: 'Se eliminará todo el contenido de esta página. Esta acción no se puede deshacer.',
      confirmLabel: 'Eliminar',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      const res = await fetch(`/api/admin/pages?page=${page}`, { method: 'DELETE' });
      if (res.ok) {
        setItems((prev) => prev.filter((i) => i.page !== page));
        toast.success('Contenido eliminado');
      } else {
        toast.danger('Error al eliminar');
      }
    } catch {
      toast.danger('Error al eliminar');
    }
  };

  if (loading) return <div className="flex justify-center py-8"><Spinner /></div>;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Páginas"
        subtitle="Gestiona el contenido y metadatos de las páginas públicas del sitio."
      />

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {[
          { label: 'Total', value: stats.total, tone: 'default' as const },
          { label: 'Publicadas', value: stats.published, tone: 'success' as const },
          { label: 'Borradores', value: stats.drafts, tone: 'warning' as const },
          { label: 'Inactivas', value: stats.inactive, tone: 'danger' as const },
          { label: 'Con SEO', value: stats.withSeo, tone: 'accent' as const },
        ].map((s) => (
          <Card key={s.label} padding="sm" className="text-center">
            <p className="text-lg font-extrabold text-primary">{s.value}</p>
            <p className="text-xxs text-text-secondary mt-0.5 uppercase tracking-wider">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2">
          {(['all', 'published', 'draft', 'inactive'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-semibold transition-all',
                statusFilter === f
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-surface-alt text-text-secondary hover:bg-surface-alt/70 hover:text-text',
              )}
            >
              {f === 'all' ? 'Todas' : STATUS_CONFIG[f].label}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-56">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar páginas..."
            className="w-full pl-8 pr-3 py-1.5 rounded-md border border-border-light bg-surface text-sm text-text outline-none focus:ring-2 focus:ring-accent/30"
          />
        </div>
      </div>

      {/* Pages table */}
      {filtered.length === 0 ? (
        <Card padding="lg">
          <p className="text-center text-text-secondary text-sm">No hay páginas que coincidan con los filtros.</p>
        </Card>
      ) : (
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-light bg-surface-alt/50">
                  <th className="text-left p-3 text-xxs font-bold uppercase text-text-muted tracking-wider">Página</th>
                  <th className="text-left p-3 text-xxs font-bold uppercase text-text-muted tracking-wider hidden sm:table-cell">Estado</th>
                  <th className="text-left p-3 text-xxs font-bold uppercase text-text-muted tracking-wider hidden md:table-cell">Contenido</th>
                  <th className="text-left p-3 text-xxs font-bold uppercase text-text-muted tracking-wider hidden lg:table-cell">SEO</th>
                  <th className="text-left p-3 text-xxs font-bold uppercase text-text-muted tracking-wider hidden lg:table-cell">Actualizado</th>
                  <th className="text-right p-3 text-xxs font-bold uppercase text-text-muted tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => {
                  const statusCfg = STATUS_CONFIG[item.status];
                  const publicRoute = PAGE_ROUTES[item.page];

                  return (
                    <tr
                      key={item.page}
                      className="border-b border-border-light hover:bg-surface-alt/50 transition-colors"
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-accent/15 flex items-center justify-center flex-shrink-0">
                            <Globe size={15} className="text-primary" />
                          </div>
                          <div className="min-w-0">
                            <Link
                              href={`/intranet/admin/pages/${item.page}`}
                              className="font-semibold text-sm text-text hover:text-accent-dark transition-colors"
                            >
                              {item.label}
                            </Link>
                            <p className="text-xxs text-text-muted mt-0.5 truncate">/{item.page}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 hidden sm:table-cell">
                        <Badge tone={statusCfg.tone} size="sm">{statusCfg.label}</Badge>
                      </td>
                      <td className="p-3 hidden md:table-cell">
                        <div className="flex items-center gap-2 text-xxs text-text-secondary">
                          <span className="flex items-center gap-1"><Layers size={10} /> {item.sections} sec.</span>
                          <span className="flex items-center gap-1"><Edit3 size={10} /> {item.fields} campos</span>
                        </div>
                      </td>
                      <td className="p-3 hidden lg:table-cell">
                        {item.hasSeo ? (
                          <span className="inline-flex items-center gap-1 text-xxs text-success">
                            <CheckCircle2 size={10} /> Configurado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xxs text-text-muted">
                            <AlertCircle size={10} /> Pendiente
                          </span>
                        )}
                      </td>
                      <td className="p-3 hidden lg:table-cell">
                        <span className="inline-flex items-center gap-1 text-xxs text-text-secondary">
                          <Clock size={10} />
                          {formatDate(item.updatedAt)}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/intranet/admin/pages/${item.page}`}>
                            <Button variant="ghost" size="sm" className="!px-2" title="Editor visual">
                              <Eye size={13} />
                            </Button>
                          </Link>
                          <Link href={`/intranet/admin/pages/${item.page}?tab=meta`}>
                            <Button variant="ghost" size="sm" className="!px-2" title="Metadatos y SEO">
                              <FileEdit size={13} />
                            </Button>
                          </Link>
                          {publicRoute && (
                            <Link href={publicRoute} target="_blank" rel="noopener noreferrer">
                              <Button variant="ghost" size="sm" className="!px-2" title="Ver página pública">
                                <ExternalLink size={13} />
                              </Button>
                            </Link>
                          )}
                          <div className="relative">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="!px-2"
                              onClick={() => setOpenMenu(openMenu === item.page ? null : item.page)}
                            >
                              <MoreHorizontal size={13} />
                            </Button>
                            {openMenu === item.page && (
                              <>
                                <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />
                                <div className="absolute right-0 top-full mt-1 z-20 w-36 bg-white border border-border-light rounded-md shadow-lg py-1">
                                  <button
                                    onClick={() => { setOpenMenu(null); handleDuplicate(item.page); }}
                                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-text hover:bg-surface-alt"
                                  >
                                    <Copy size={12} /> Duplicar
                                  </button>
                                  <button
                                    onClick={() => handleDelete(item.page)}
                                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-danger hover:bg-danger-bg"
                                  >
                                    <Trash2 size={12} /> Eliminar
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xxs text-text-muted px-1">
        <span className="flex items-center gap-1"><Badge tone="success" size="sm">Publicado</Badge> Visible en la web</span>
        <span className="flex items-center gap-1"><Badge tone="warning" size="sm">Borrador</Badge> Solo en admin</span>
        <span className="flex items-center gap-1"><Badge tone="danger" size="sm">Inactivo</Badge> No visible</span>
        <span className="flex items-center gap-1 ml-auto">
          <Eye size={10} /> Editor visual · <FileEdit size={10} /> Metadatos
        </span>
      </div>
    </div>
  );
}
