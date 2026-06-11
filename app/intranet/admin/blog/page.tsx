'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Plus, Search, Edit3, Trash2, Eye, EyeOff, Copy, ArrowUpDown, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import { useConfirm } from '@/components/ui/confirm';
import { Spinner } from '@/components/ui/spinner';
import { blogCategories } from '@/data/blog/categories';

interface Post {
  id: string;
  slug: string;
  title: string;
  category: string;
  published: boolean;
  featured: boolean;
  publishedAt: string;
  updatedAt: string | null;
}

type SortField = 'publishedAt' | 'title' | 'published';
type SortDir = 'asc' | 'desc';

export default function AdminBlogPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const [posts, setPosts] = useState<Post[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>('publishedAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [duplicating, setDuplicating] = useState<string | null>(null);
  const limit = 20;

  const fetchPosts = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit), published: status });
    if (q) params.set('q', q);
    if (category) params.set('category', category);
    fetch(`/api/admin/blog?${params}`)
      .then(r => r.json())
      .then(data => { setPosts(data.posts ?? []); setTotal(data.total ?? 0); })
      .catch(() => toast.danger('Error al cargar posts'))
      .finally(() => setLoading(false));
  }, [page, q, category, status]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const sortedPosts = [...posts].sort((a, b) => {
    let cmp = 0;
    if (sortField === 'title') {
      cmp = a.title.localeCompare(b.title, 'es');
    } else if (sortField === 'published') {
      cmp = Number(a.published) - Number(b.published);
    } else {
      cmp = new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime();
    }
    return sortDir === 'desc' ? -cmp : cmp;
  });

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
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
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
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
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `${post.title} (copia)`,
          description: `Copia de: ${post.title}`,
          body: '',
          category: post.category,
          slug: newSlug,
          published: false,
        }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      const data = await res.json();
      toast.success('Post duplicado');
      // Copiar contenido del original al duplicado
      const origRes = await fetch(`/api/admin/blog/${post.id}`);
      const origData = await origRes.json();
      if (origData.post?.body) {
        await fetch(`/api/admin/blog/${data.post.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ body: origData.post.body, description: origData.post.description || `Copia de: ${post.title}` }),
        });
      }
      fetchPosts();
    } catch (e) {
      toast.danger(e instanceof Error ? e.message : 'Error al duplicar');
    } finally {
      setDuplicating(null);
    }
  };

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString('es-HN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch { return d; }
  };

  const totalPages = Math.ceil(total / limit);
  const categoryName = (slug: string) => blogCategories.find(c => c.slug === slug)?.nombre ?? slug;

  const publishedCount = posts.filter(p => p.published).length;
  const draftCount = posts.filter(p => !p.published).length;

  const SortHeader = ({ field, label, className }: { field: SortField; label: string; className?: string }) => (
    <th
      className={`text-left p-3 text-xxs font-bold uppercase cursor-pointer select-none hover:text-primary transition-colors ${className ?? ''}`}
      onClick={() => toggleSort(field)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <ArrowUpDown size={10} className={sortField === field ? 'text-accent' : 'text-text-muted'} />
      </span>
    </th>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-primary">Blog</h1>
          <p className="text-xs text-text-secondary">{total} posts ({publishedCount} publicados, {draftCount} borradores)</p>
        </div>
        <Link href="/intranet/admin/blog/nuevo">
          <Button variant="primary" size="sm"><Plus size={14} className="mr-1" /> Nuevo post</Button>
        </Link>
      </div>

      {/* Stats overview */}
      {!loading && total > 0 && (
        <div className="grid grid-cols-3 gap-2">
          <Card padding="sm" className="text-center">
            <p className="text-lg font-extrabold text-primary">{total}</p>
            <p className="text-xxs text-text-muted">Total</p>
          </Card>
          <Card padding="sm" className="text-center">
            <p className="text-lg font-extrabold text-success">{publishedCount}</p>
            <p className="text-xxs text-text-muted">Publicados</p>
          </Card>
          <Card padding="sm" className="text-center">
            <p className="text-lg font-extrabold text-warning">{draftCount}</p>
            <p className="text-xxs text-text-muted">Borradores</p>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="flex-1 min-w-[200px]">
          <Input value={q} onChange={e => { setQ(e.target.value); setPage(1); }} placeholder="Buscar por título o descripción..." iconLeft={<Search size={14} />} />
        </div>
        <select value={category} onChange={e => { setCategory(e.target.value); setPage(1); }} className="h-9 rounded-md border border-border-light bg-surface px-2 text-sm">
          <option value="">Todas las categorías</option>
          {blogCategories.map(c => <option key={c.slug} value={c.slug}>{c.nombre}</option>)}
        </select>
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className="h-9 rounded-md border border-border-light bg-surface px-2 text-sm">
          <option value="all">Todos los estados</option>
          <option value="true">Publicados</option>
          <option value="false">Borradores</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : sortedPosts.length === 0 ? (
        <Card padding="lg">
          <div className="text-center space-y-2">
            <p className="text-text-secondary text-sm">
              {q || category || status !== 'all' ? 'No se encontraron posts con esos filtros.' : 'No hay posts aún.'}
            </p>
            {!q && !category && status === 'all' && (
              <Link href="/intranet/admin/blog/nuevo">
                <Button variant="primary" size="sm"><Plus size={14} className="mr-1" /> Crear primer post</Button>
              </Link>
            )}
          </div>
        </Card>
      ) : (
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-light text-text-secondary">
                  <SortHeader field="title" label="Título" />
                  <th className="text-left p-3 text-xxs font-bold uppercase hidden sm:table-cell">Categoría</th>
                  <SortHeader field="published" label="Estado" className="hidden md:table-cell" />
                  <SortHeader field="publishedAt" label="Fecha" className="hidden md:table-cell" />
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
                      <Badge tone={p.published ? 'success' : 'warning'}>
                        {p.published ? 'Publicado' : 'Borrador'}
                      </Badge>
                      {p.featured && <Badge tone="info" className="ml-1">Destacado</Badge>}
                    </td>
                    <td className="p-3 text-text-secondary text-xxs hidden md:table-cell">
                      <div>{formatDate(p.publishedAt)}</div>
                      {p.updatedAt && (
                        <div className="text-text-muted">Act: {formatDate(p.updatedAt)}</div>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/intranet/admin/blog/${p.id}`}>
                          <Button variant="ghost" size="sm" aria-label="Editar" title="Editar">
                            <Edit3 size={14} />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleTogglePublished(p)}
                          aria-label={p.published ? 'Despublicar' : 'Publicar'}
                          title={p.published ? 'Despublicar' : 'Publicar'}
                        >
                          {p.published ? <EyeOff size={14} /> : <Eye size={14} />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDuplicate(p)}
                          disabled={duplicating === p.id}
                          aria-label="Duplicar"
                          title="Duplicar"
                        >
                          <Copy size={14} className={duplicating === p.id ? 'animate-pulse' : ''} />
                        </Button>
                        {p.published && (
                          <Link
                            href={`/blog/${p.category}/${p.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button variant="ghost" size="sm" aria-label="Ver" title="Ver en web">
                              <ExternalLink size={14} />
                            </Button>
                          </Link>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(p.id, p.title)}
                          aria-label="Eliminar"
                          title="Eliminar"
                        >
                          <Trash2 size={14} className="text-danger" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-3 border-t border-border-light">
              <p className="text-xs text-text-secondary">
                Página {page} de {totalPages} · {total} posts
              </p>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  <ChevronLeft size={14} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  <ChevronRight size={14} />
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
