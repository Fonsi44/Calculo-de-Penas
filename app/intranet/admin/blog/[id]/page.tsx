'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, Eye } from 'lucide-react';
import { Card } from '@/components/ui/card'; // eslint-disable-line @typescript-eslint/no-unused-vars
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { Spinner } from '@/components/ui/spinner';
import Link from 'next/link';

export default function AdminBlogEditorPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const isNew = params.id === 'nuevo';
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);
  const [form, setForm] = useState({
    slug: '', title: '', description: '', body: '',
    publishedAt: new Date().toISOString().slice(0, 16),
    category: 'derecho-penal', tags: '', author: 'Pineda y Asociados',
    readingTime: '3 min', coverImage: '', featured: false, published: false,
  });

  useEffect(() => {
    if (isNew) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    fetch(`/api/admin/blog/${params.id}`)
      .then(r => r.json())
      .then(data => {
        if (data.post) {
          const p = data.post;
          setForm({
            slug: p.slug || '', title: p.title || '', description: p.description || '',
            body: p.body || '', publishedAt: p.publishedAt ? new Date(p.publishedAt).toISOString().slice(0, 16) : '',
            category: p.category || 'derecho-penal',
            tags: Array.isArray(p.tags) ? p.tags.join(', ') : '',
            author: p.author || 'Pineda y Asociados', readingTime: p.readingTime || '3 min',
            coverImage: p.coverImage || '', featured: p.featured || false, published: p.published || false,
          });
        }
      })
      .catch(() => toast.danger('Error al cargar'))
      .finally(() => setLoading(false));
  }, [isNew, params.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        title: form.title, description: form.description, body: form.body,
        publishedAt: new Date(form.publishedAt).toISOString(),
        category: form.category, tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        author: form.author, readingTime: form.readingTime,
        coverImage: form.coverImage || null, featured: form.featured, published: form.published,
      };
      if (form.slug && !isNew) body.slug = form.slug;

      const url = isNew ? '/api/admin/blog' : `/api/admin/blog/${params.id}`;
      const method = isNew ? 'POST' : 'PATCH';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      toast.success(isNew ? 'Post creado' : 'Post actualizado');
      router.push('/intranet/admin/blog');
    } catch (e) { toast.danger(e instanceof Error ? e.message : 'Error'); }
    finally { setSaving(false); }
  };

  const update = (k: string, v: string | boolean) => setForm(f => ({ ...f, [k]: v }));
  const slugFromTitle = () => { if (!form.slug) update('slug', form.title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')); };

  if (loading) return <div className="flex justify-center py-8"><Spinner /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3"><Link href="/intranet/admin/blog"><Button variant="ghost" size="sm"><ArrowLeft size={14} /></Button></Link>
        <h1 className="text-xl font-extrabold text-primary">{isNew ? 'Nuevo Post' : 'Editar Post'}</h1></div>

      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-4">
            <div><label className="block text-xs font-semibold text-text-secondary mb-1">Título *</label>
              <Input value={form.title} onChange={e => { update('title', e.target.value); if (!form.slug) slugFromTitle(); }} required /></div>

            <div><label className="block text-xs font-semibold text-text-secondary mb-1">Slug</label>
              <Input value={form.slug} onChange={e => update('slug', e.target.value)} placeholder="auto-generado" /></div>

            <div><label className="block text-xs font-semibold text-text-secondary mb-1">Descripción *</label>
              <Input value={form.description} onChange={e => update('description', e.target.value)} required /></div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-text-secondary">Contenido HTML *</label>
                <Button type="button" variant="ghost" size="sm" onClick={() => setPreview(!preview)}><Eye size={14} className="mr-1" />{preview ? 'Editor' : 'Preview'}</Button>
              </div>
              {preview ? (
                <div className="border border-border-light rounded-md p-3 bg-white min-h-[300px]">
                  <iframe sandbox="allow-same-origin" srcDoc={form.body} className="w-full min-h-[300px] border-0"
                    title="Preview" onLoad={e => { const el = e.target as HTMLIFrameElement; el.style.height = (el.contentWindow?.document?.body?.scrollHeight ?? 300) + 'px'; }} />
                </div>
              ) : (
                <textarea value={form.body} onChange={e => update('body', e.target.value)}
                  className="w-full min-h-[300px] rounded-md border border-border-light bg-surface px-3 py-2 text-sm font-mono" required />
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div><label className="block text-xs font-semibold text-text-secondary mb-1">Categoría</label>
              <select value={form.category} onChange={e => update('category', e.target.value)} className="w-full h-9 rounded-md border border-border-light bg-surface px-2 text-sm">
                {['derecho-penal','derecho-de-familia','derecho-laboral','derecho-civil','derecho-mercantil','extranjeria-migracion','hondurenos-en-espana','tributario','derecho-bancario','derecho-administrativo','derecho-aduanero','regulacion-sanitaria','propiedad-intelectual','derecho-ambiental','conciliacion-arbitraje'].map(c => <option key={c} value={c}>{c}</option>)}
              </select></div>

            <div><label className="block text-xs font-semibold text-text-secondary mb-1">Fecha publicación</label>
              <Input type="datetime-local" value={form.publishedAt} onChange={e => update('publishedAt', e.target.value)} /></div>

            <div><label className="block text-xs font-semibold text-text-secondary mb-1">Tags (separados por coma)</label>
              <Input value={form.tags} onChange={e => update('tags', e.target.value)} placeholder="ej: divorcio, familia" /></div>

            <div><label className="block text-xs font-semibold text-text-secondary mb-1">Autor</label>
              <Input value={form.author} onChange={e => update('author', e.target.value)} /></div>

            <div><label className="block text-xs font-semibold text-text-secondary mb-1">Tiempo lectura</label>
              <Input value={form.readingTime} onChange={e => update('readingTime', e.target.value)} /></div>

            <div><label className="block text-xs font-semibold text-text-secondary mb-1">Imagen portada (URL)</label>
              <Input value={form.coverImage} onChange={e => update('coverImage', e.target.value)} placeholder="/images/blog/..." /></div>

            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.featured} onChange={e => update('featured', e.target.checked)} className="rounded" /> Destacado</label>

            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.published} onChange={e => update('published', e.target.checked)} className="rounded" /> Publicado</label>

            <Button type="submit" variant="primary" fullWidth loading={saving}><Save size={14} className="mr-1" />{isNew ? 'Crear post' : 'Guardar cambios'}</Button>
          </div>
        </div>
      </form>
    </div>
  );
}
