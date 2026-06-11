'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Plus, Search, Edit3, Trash2, Eye, EyeOff } from 'lucide-react';
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

  const fetchPosts = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20', published: status });
    if (q) params.set('q', q);
    if (category) params.set('category', category);
    fetch(`/api/admin/blog?${params}`)
      .then(r => r.json())
      .then(data => { setPosts(data.posts ?? []); setTotal(data.total ?? 0); })
      .catch(() => toast.danger('Error al cargar posts'))
      .finally(() => setLoading(false));
  }, [page, q, category, status]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchPosts(); }, [fetchPosts]); // eslint-disable-line react-hooks/set-state-in-effect

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

  const formatDate = (d: string) => { try { return new Date(d).toLocaleDateString('es-HN', { day:'numeric', month:'short', year:'numeric' }); } catch { return d; }};

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-extrabold text-primary">Blog</h1><p className="text-xs text-text-secondary">{total} posts</p></div>
        <Link href="/intranet/admin/blog/nuevo"><Button variant="primary" size="sm"><Plus size={14} className="mr-1" /> Nuevo post</Button></Link>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="flex-1 min-w-[200px]"><Input value={q} onChange={e => { setQ(e.target.value); setPage(1); }} placeholder="Buscar..." iconLeft={<Search size={14} />} /></div>
        <select value={category} onChange={e => { setCategory(e.target.value); setPage(1); }} className="h-9 rounded-md border border-border-light bg-surface px-2 text-sm">
          <option value="">Todas las categorías</option>
          {blogCategories.map(c => <option key={c.slug} value={c.slug}>{c.nombre}</option>)}
        </select>
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className="h-9 rounded-md border border-border-light bg-surface px-2 text-sm">
          <option value="all">Todos</option>
          <option value="true">Publicados</option>
          <option value="false">Borradores</option>
        </select>
        <Button variant="secondary" size="sm" onClick={fetchPosts}>Buscar</Button>
      </div>

      {loading ? <div className="flex justify-center py-8"><Spinner /></div>
      : posts.length === 0 ? <Card padding="md"><p className="text-center text-text-secondary text-sm">No se encontraron posts</p></Card>
      : <Card padding="none"><div className="overflow-x-auto"><table className="w-full text-sm">
        <thead><tr className="border-b border-border-light text-text-secondary">
          <th className="text-left p-3 text-xxs font-bold uppercase">Título</th>
          <th className="text-left p-3 text-xxs font-bold uppercase hidden sm:table-cell">Categoría</th>
          <th className="text-left p-3 text-xxs font-bold uppercase hidden md:table-cell">Estado</th>
          <th className="text-left p-3 text-xxs font-bold uppercase hidden md:table-cell">Fecha</th>
          <th className="text-right p-3 text-xxs font-bold uppercase">Acciones</th>
        </tr></thead>
        <tbody>
          {posts.map(p => (
            <tr key={p.id} className="border-b border-border-light hover:bg-surface-alt">
              <td className="p-3 font-medium text-text max-w-[200px] truncate">{p.title}</td>
              <td className="p-3 text-text-secondary hidden sm:table-cell"><Badge tone="neutral">{p.category}</Badge></td>
              <td className="p-3 hidden md:table-cell">
                <Badge tone={p.published ? 'success' : 'warning'}>{p.published ? 'Publicado' : 'Borrador'}</Badge>
                {p.featured && <Badge tone="info" className="ml-1">Destacado</Badge>}
              </td>
              <td className="p-3 text-text-secondary text-xxs hidden md:table-cell">{formatDate(p.publishedAt)}</td>
              <td className="p-3"><div className="flex items-center justify-end gap-1">
                <Link href={`/intranet/admin/blog/${p.id}`}><Button variant="ghost" size="sm" aria-label="Editar"><Edit3 size={14} /></Button></Link>
                <Button variant="ghost" size="sm" onClick={() => handleTogglePublished(p)} aria-label={p.published ? 'Despublicar' : 'Publicar'}>
                  {p.published ? <EyeOff size={14} /> : <Eye size={14} />}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(p.id, p.title)} aria-label="Eliminar"><Trash2 size={14} className="text-danger" /></Button>
              </div></td>
            </tr>
          ))}
        </tbody>
      </table></div></Card>}
    </div>
  );
}
