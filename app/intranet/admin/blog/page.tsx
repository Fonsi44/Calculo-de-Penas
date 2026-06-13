'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Plus, Edit3, Trash2, Eye, EyeOff, Copy, ArrowUpDown, ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import { useConfirm } from '@/components/ui/confirm';
import { Spinner } from '@/components/ui/spinner';
import { PageHeader } from '@/components/ui/page-header';
import { FilterBar } from '@/components/ui/filter-bar';
import { TablePagination } from '@/components/ui/table-pagination';
import { StatCards } from '@/components/ui/stat-cards';

type SortField = 'publishedAt' | 'title' | 'published';
type SortDir = 'asc' | 'desc';

function SortHeader({ field, label, className, sortField, onToggle }: {
  field: SortField; label: string; className?: string;
  sortField: SortField; sortDir: SortDir; onToggle: (f: SortField) => void;
}) {
  return (
    <th
      className={`text-left p-3 text-xxs font-bold uppercase cursor-pointer select-none hover:text-primary transition-colors ${className ?? ''}`}
      onClick={() => onToggle(field)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <ArrowUpDown size={10} className={sortField === field ? 'text-accent' : 'text-text-muted'} />
      </span>
    </th>
  );
}

interface Post {
  id: string; slug: string; title: string; category: string;
  published: boolean; featured: boolean; publishedAt: string; updatedAt: string | null;
}

export default function AdminBlogPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const [posts, setPosts] = useState<Post[]>([]);
  const [total, setTotal] = useState(0);
  const [publishedTotal, setPublishedTotal] = useState(0);
  const [draftTotal, setDraftTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>('publishedAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [duplicating, setDuplicating] = useState<string | null>(null);
  const limit = 20;
  const [dbCategories, setDbCategories] = useState<{ slug: string; nombre: string }[]>([]);

  useEffect(() => {
    fetch('/api/admin/categorias-blog').then(r => r.json()).then(data => {
      if (data.categorias) setDbCategories(data.categorias);
    }).catch(() => {});
  }, []);

  const categoryName = (slug: string) => dbCategories.find(c => c.slug === slug)?.nombre ?? slug;

  const fetchPosts = useCallback(() => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit), published: status });
    if (q) params.set('q', q);
    if (category) params.set('category', category);
    const countParams = new URLSearchParams();
    if (q) countParams.set('q', q);
    if (category) countParams.set('category', category);
    Promise.all([
      fetch(`/api/admin/blog?${params}`).then(r => r.json()),
      fetch(`/api/admin/blog?published=true&limit=1&${countParams}`).then(r => r.json()),
      fetch(`/api/admin/blog?published=false&limit=1&${countParams}`).then(r => r.json()),
    ])
      .then(([data, pubData, draftData]) => {
        setPosts(data.posts ?? []);
        setTotal(data.total ?? 0);
        setPublishedTotal(pubData.total ?? 0);
        setDraftTotal(draftData.total ?? 0);
      })
      .catch(() => toast.danger('Error al cargar posts'))
      .finally(() => setLoading(false));
  }, [page, q, category, status, toast]);

  useEffect(() => { setLoading(true); fetchPosts(); }, [fetchPosts]); // eslint-disable-line react-hooks/set-state-in-effect

  const sortedPosts = [...posts].sort((a, b) => {
    let cmp = 0;
    if (sortField === 'title') cmp = a.title.localeCompare(b.title, 'es');
    else if (sortField === 'published') cmp = Number(a.published) - Number(b.published);
    else cmp = new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime();
    return sortDir === 'desc' ? -cmp : cmp;
  });

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!await confirm({ title: `¿Eliminar "${title}"?`, description: 'Esta acción no se puede deshacer.' })) return;
    try {
      const res = await fetch(`/api/admin/blog/${id}`, { method: 'DELETE' });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      toast.success('Post eliminado');
      fetchPosts();
    } catch (e) { toast.danger(e instanceof Error ? e.message : 'Error'); }
  };

  const handleTogglePublished = async (post: Post) => {
    try {
      const res = await fetch(`/api/admin/blog/${post.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: !post.published }),
      });
      if (!res.ok) throw new Error('Error');
      toast.success(post.published ? 'Post despublicado' : 'Post publicado');
      fetchPosts();
    } catch { toast.danger('Error al cambiar estado'); }
  };

  const handleDuplicate = async (post: Post) => {
    setDuplicating(post.id);
    try {
      const newSlug = `${post.slug}-copia`;
      const res = await fetch('/api/admin/blog', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: `${post.title} (copia)`, description: `Copia de: ${post.title}`, body: '', category: post.category, slug: newSlug, published: false }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      const data = await res.json();
      toast.success('Post duplicado');
      const origRes = await fetch(`/api/admin/blog/${post.id}`);
      const origData = await origRes.json();
      if (origData.post?.body) {
        await fetch(`/api/admin/blog/${data.post.id}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ body: origData.post.body, description: origData.post.description || `Copia de: ${post.title}` }),
        });
      }
      fetchPosts();
    } catch (e) { toast.danger(e instanceof Error ? e.message : 'Error al duplicar'); }
    finally { setDuplicating(null); }
  };

  const formatDate = (d: string) => {
    try { return new Date(d).toLocaleDateString('es-HN', { day: 'numeric', month: 'short', year: 'numeric' }); }
    catch { return d; }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Blog"
        subtitle={`${total} posts (${publishedTotal} publicados, ${draftTotal} borradores)`}
        actions={<Link href="/intranet/admin/blog/nuevo"><Button variant="primary" size="sm"><Plus size={14} /> Nuevo post</Button></Link>}
      />

      {!loading && total > 0 && (
        <StatCards
          columns={3}
          items={[
            { value: total, label: 'Total', tone: 'default' },
            { value: publishedTotal, label: 'Publicados', tone: 'success' },
            { value: draftTotal, label: 'Borradores', tone: 'warning' },
          ]}
        />
      )}

      {!loading && !category && !q && draftTotal > 0 && (
        <Card padding="md" className="border-warning/50 bg-warning-bg">
          <div className="flex items-center justify-between">
            <p className="text-xs text-warning font-semibold">{draftTotal} posts sin publicar.</p>
            <Button variant="secondary" size="sm" onClick={async () => {
              if (!await confirm({ title: '¿Publicar todos?', description: `${draftTotal} posts se marcarán como publicados y serán visibles en la web.` })) return;
              try {
                const res = await fetch('/api/admin/blog/publish-all', { method: 'POST' });
                if (!res.ok) throw new Error();
                const data = await res.json();
                toast.success(`${data.published} posts publicados`);
                fetchPosts();
              } catch { toast.danger('Error al publicar'); }
            }}>Publicar todos</Button>
          </div>
        </Card>
      )}

      <FilterBar
        search={q}
        onSearchChange={(v) => { setQ(v); setPage(1); }}
        searchPlaceholder="Buscar por título o descripción..."
        filters={[
          {
            value: category,
            onChange: (v) => { setCategory(v); setPage(1); },
            options: [{ value: '', label: 'Todas las categorías' }, ...dbCategories.map(c => ({ value: c.slug, label: c.nombre }))],
          },
          {
            value: status,
            onChange: (v) => { setStatus(v); setPage(1); },
            options: [
              { value: 'all', label: 'Todos los estados' },
              { value: 'true', label: 'Publicados' },
              { value: 'false', label: 'Borradores' },
            ],
          },
        ]}
      />

      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : sortedPosts.length === 0 ? (
        <Card padding="lg">
          <div className="text-center space-y-2">
            <p className="text-text-secondary text-sm">{q || category || status !== 'all' ? 'No se encontraron posts con esos filtros.' : 'No hay posts aún.'}</p>
            {!q && !category && status === 'all' && (
              <Link href="/intranet/admin/blog/nuevo"><Button variant="primary" size="sm"><Plus size={14} /> Crear primer post</Button></Link>
            )}
          </div>
        </Card>
      ) : (
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-light text-text-secondary">
                  <SortHeader field="title" label="Título" sortField={sortField} sortDir={sortDir} onToggle={toggleSort} />
                  <th className="text-left p-3 text-xxs font-bold uppercase hidden sm:table-cell">Categoría</th>
                  <SortHeader field="published" label="Estado" className="hidden md:table-cell" sortField={sortField} sortDir={sortDir} onToggle={toggleSort} />
                  <SortHeader field="publishedAt" label="Fecha" className="hidden md:table-cell" sortField={sortField} sortDir={sortDir} onToggle={toggleSort} />
                  <th className="text-right p-3 text-xxs font-bold uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {sortedPosts.map(p => (
                  <tr key={p.id} className="border-b border-border-light hover:bg-surface-alt">
                    <td className="p-3 max-w-[220px]">
                      <div className="font-medium text-text truncate">{p.title}</div>
                      <div className="text-xxs text-text-muted truncate hidden sm:block">/{p.slug}</div>
                    </td>
                    <td className="p-3 text-text-secondary hidden sm:table-cell">
                      <Badge tone="neutral">{categoryName(p.category)}</Badge>
                    </td>
                    <td className="p-3 hidden md:table-cell">
                      <Badge tone={p.published ? 'success' : 'warning'}>{p.published ? 'Publicado' : 'Borrador'}</Badge>
                      {p.featured && <Badge tone="info" className="ml-1">Destacado</Badge>}
                    </td>
                    <td className="p-3 text-text-secondary text-xxs hidden md:table-cell">
                      <div>{formatDate(p.publishedAt)}</div>
                      {p.updatedAt && <div className="text-text-muted">Act: {formatDate(p.updatedAt)}</div>}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/intranet/admin/blog/${p.id}`}>
                          <Button variant="ghost" size="sm" aria-label="Editar" title="Editar"><Edit3 size={14} /></Button>
                        </Link>
                        <Button variant="ghost" size="sm" onClick={() => handleTogglePublished(p)} aria-label={p.published ? 'Despublicar' : 'Publicar'} title={p.published ? 'Despublicar' : 'Publicar'}>
                          {p.published ? <EyeOff size={14} /> : <Eye size={14} />}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDuplicate(p)} disabled={duplicating === p.id} aria-label="Duplicar" title="Duplicar">
                          <Copy size={14} className={duplicating === p.id ? 'animate-pulse' : ''} />
                        </Button>
                        {p.published && (
                          <Link href={`/blog/${p.category}/${p.slug}`} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="sm" aria-label="Ver" title="Ver en web"><ExternalLink size={14} /></Button>
                          </Link>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(p.id, p.title)} aria-label="Eliminar" title="Eliminar">
                          <Trash2 size={14} className="text-danger" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <TablePagination
            page={page}
            totalPages={totalPages}
            total={total}
            label="posts"
            onPrev={() => setPage(p => Math.max(1, p - 1))}
            onNext={() => setPage(p => Math.min(totalPages, p + 1))}
          />
        </Card>
      )}
    </div>
  );
}