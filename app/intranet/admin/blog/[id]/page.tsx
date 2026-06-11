'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, Sparkles, Image, Clock, Tag, Wand2, Loader2, CheckCircle2, Code2, Eye, AlertTriangle, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { blogCategories } from '@/data/blog/categories';
import { useToast } from '@/components/ui/toast';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/ui';
import Link from 'next/link';

const FUNNY_COMMENTS = [
  'Consultando el Código Penal...',
  'Revisando jurisprudencia...',
  'Redactando como un abogado senior...',
  'Buscando sinónimos jurídicos...',
  'Añadiendo palabras que impresionan al juez...',
  'Verificando que no haya contradicciones legales...',
  'Citando doctrina... aunque sin decir cuál...',
  'Formateando para que parezca muy profesional...',
  'Consultando con el equipo... (yo mismo)...',
  'Echando café al teclado para que escriba más rápido...',
  'Convenciendo a las palabras de que se ordenen solas...',
  'Puliendo el SEO como un diamante en bruto...',
  'Insertando latinajos para darle seriedad...',
];

interface GeneratedPost {
  title: string;
  description: string;
  body: string;
  slug: string;
  readingTime: string;
  tags: string[];
  category: string;
}

type EditorTab = 'visual' | 'code';

export default function AdminBlogEditorPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const isNew = params.id === 'nuevo';
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genProgress, setGenProgress] = useState(0);
  const [funnyComment, setFunnyComment] = useState('');
  const [genTopic, setGenTopic] = useState('');
  const [genCategory, setGenCategory] = useState('derecho-penal');
  const [activeTab, setActiveTab] = useState<EditorTab>('visual');
  const [codeValue, setCodeValue] = useState('');
  const [codeError, setCodeError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const initialFormRef = useRef<string>('');

  const [form, setForm] = useState({
    slug: '', title: '', description: '', body: '',
    publishedAt: new Date().toISOString().slice(0, 16),
    category: 'derecho-penal', tags: '', author: 'Pineda y Asociados',
    readingTime: '3 min', coverImage: '', featured: false, published: false,
  });

  useEffect(() => {
    if (isNew) return;
    fetch(`/api/admin/blog/${params.id}`)
      .then(r => r.json())
      .then(data => {
        if (data.post) {
          const p = data.post;
          const newForm = {
            slug: p.slug || '', title: p.title || '', description: p.description || '',
            body: p.body || '', publishedAt: p.publishedAt ? new Date(p.publishedAt).toISOString().slice(0, 16) : '',
            category: p.category || 'derecho-penal',
            tags: Array.isArray(p.tags) ? p.tags.join(', ') : '',
            author: p.author || 'Pineda y Asociados', readingTime: p.readingTime || '3 min',
            coverImage: p.coverImage || '', featured: p.featured || false, published: p.published || false,
          };
          setForm(newForm);
          setCodeValue(p.body || '');
          initialFormRef.current = JSON.stringify(newForm);
        }
      })
      .catch(() => toast.danger('Error al cargar'))
      .finally(() => setLoading(false));
  }, [isNew, params.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!loading) {
      const current = JSON.stringify(form);
      setIsDirty(current !== initialFormRef.current && initialFormRef.current !== '');
    }
  }, [form, loading]);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  const handleSave = async (e: React.FormEvent, saveAsDraft?: boolean) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        title: form.title, description: form.description, body: form.body,
        publishedAt: new Date(form.publishedAt).toISOString(),
        category: form.category, tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        author: form.author, readingTime: form.readingTime,
        coverImage: form.coverImage || null, featured: form.featured, published: saveAsDraft ? false : form.published,
      };
      if (form.slug && !isNew) body.slug = form.slug;

      const url = isNew ? '/api/admin/blog' : `/api/admin/blog/${params.id}`;
      const method = isNew ? 'POST' : 'PATCH';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      toast.success(isNew ? 'Post creado' : 'Post actualizado');
      setIsDirty(false);
      router.push('/intranet/admin/blog');
    } catch (e) { toast.danger(e instanceof Error ? e.message : 'Error'); }
    finally { setSaving(false); }
  };

  const update = (k: string, v: string | boolean) => {
    setForm(f => ({ ...f, [k]: v }));
  };

  const handleBodyChange = useCallback((html: string) => {
    setForm(f => ({ ...f, body: html }));
    if (activeTab === 'visual') {
      setCodeValue(html);
    }
  }, [activeTab]);

  const handleCodeChange = useCallback((code: string) => {
    setCodeValue(code);
    setCodeError(null);
    try {
      const div = document.createElement('div');
      div.innerHTML = code;
      setForm(f => ({ ...f, body: code }));
    } catch {
      setCodeError('El HTML contiene errores de sintaxis');
    }
  }, []);

  const switchToVisual = useCallback(() => {
    setForm(f => ({ ...f, body: codeValue }));
    setActiveTab('visual');
  }, [codeValue]);

  const switchToCode = useCallback(() => {
    setCodeValue(form.body);
    setCodeError(null);
    setActiveTab('code');
  }, [form.body]);

  const slugFromTitle = () => {
    if (!form.slug && form.title) {
      const slug = form.title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      update('slug', slug);
    }
  };

  const handleAutoTags = async () => {
    if (!form.body) { toast.danger('Escribe contenido primero'); return; }
    try {
      const res = await fetch('/api/admin/blog/helpers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'tags', title: form.title, description: form.description, body: form.body, category: form.category }),
      });
      const data = await res.json();
      if (data.tags) update('tags', data.tags.join(', '));
      toast.success('Tags generados automáticamente');
    } catch { toast.danger('Error al generar tags'); }
  };

  const handleAutoReadingTime = () => {
    if (!form.body) { toast.danger('Escribe contenido primero'); return; }
    const text = form.body.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, '');
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    const minutes = Math.max(1, Math.round(words / 200));
    update('readingTime', `${minutes} min`);
    toast.success(`Tiempo estimado: ${minutes} min`);
  };

  const handleAutoCover = () => {
    const cat = blogCategories.find(c => c.slug === form.category);
    const slug = cat ? cat.slug : 'derecho-penal';
    const imageMap: Record<string, string> = {
      'derecho-penal': '/images/blog/defensa-penal.webp',
      'proceso-penal': '/images/blog/diferencia-denuncia-querella-acusacion-honduras.webp',
      'derecho-de-familia': '/images/blog/problemas-familiares.webp',
      'derecho-laboral': '/images/blog/despido-laboral.webp',
      'derecho-civil': '/images/blog/poder-legal-honduras-cuando-se-necesita.webp',
      'derecho-mercantil': '/images/blog/servicios-empresariales.webp',
      'tributario': '/images/blog/sar-notifica-fiscalizacion-que-hacer-honduras.webp',
      'extranjeria-migracion': '/images/blog/permiso-trabajo-extranjeros-honduras.webp',
      'hondurenos-en-espana': '/images/blog/hondurenos-en-espana-guia-legal-completa.webp',
      'derecho-bancario': '/images/blog/tarjetas-credito-intereses-cargos-defensa-honduras.webp',
      'derecho-notarial': '/images/blog/tramites-notariales-frecuentes-honduras.webp',
      'noticias-legales': '/images/blog/actualizacion-legislativa-mensual-honduras.webp',
      'practica-legal': '/images/blog/costos-honorarios-abogados-como-funcionan-honduras.webp',
      'derechos-ciudadanos': '/images/blog/derechos-del-detenido-guia-constitucional-honduras.webp',
      'derecho-administrativo': '/images/blog/sanciones-administrativas-como-defenderse-honduras.webp',
      'derecho-aduanero': '/images/blog/importar-mercancias-guia-legal-aduanera-honduras.webp',
      'regulacion-sanitaria': '/images/blog/registro-sanitario-alimentos-arsa-paso-a-paso-honduras.webp',
      'propiedad-intelectual': '/images/blog/registrar-marca-paso-a-paso-honduras.webp',
      'derecho-ambiental': '/images/blog/licencia-ambiental-categorias-plazos-honduras.webp',
      'conciliacion-arbitraje': '/images/blog/mediacion-vs-juicio-que-conviene-mas-honduras.webp',
    };
    update('coverImage', imageMap[slug] ?? '/images/blog/pineda-asociados-bufete-multidisciplinario-honduras.webp');
    toast.success('Imagen de portada asignada');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.danger('Solo se permiten imágenes JPEG, PNG o WebP');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.danger('La imagen no puede superar los 10 MB');
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const imageSlug = form.slug || (form.title ? form.title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '') : file.name.replace(/\.[^.]+$/, ''));
      fd.append('slug', imageSlug);
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      const data = await res.json();
      update('coverImage', data.url);
      setUploadPreview(data.url);
      toast.success('Imagen subida y optimizada');
    } catch (err) {
      toast.danger(err instanceof Error ? err.message : 'Error al subir imagen');
    } finally {
      setUploading(false);
    }
  };

  const clearCoverImage = () => {
    update('coverImage', '');
    setUploadPreview(null);
  };

  const handleGeneratePost = async () => {
    if (!genTopic.trim()) { toast.danger('Escribe un tema para el artículo'); return; }
    setGenerating(true);
    setGenProgress(0);

    try {
      const commentInterval = setInterval(() => {
        setFunnyComment(FUNNY_COMMENTS[Math.floor(Math.random() * FUNNY_COMMENTS.length)]);
        setGenProgress(p => Math.min(p + Math.random() * 18, 95));
      }, 800);

      const res = await fetch('/api/admin/blog/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: genTopic, category: genCategory }),
      });

      clearInterval(commentInterval);
      setGenProgress(100);

      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }

      const post: GeneratedPost = await res.json();
      setForm({
        slug: post.slug,
        title: post.title,
        description: post.description,
        body: post.body,
        publishedAt: new Date().toISOString().slice(0, 16),
        category: post.category,
        tags: post.tags.join(', '),
        author: 'Pineda y Asociados',
        readingTime: post.readingTime,
        coverImage: '',
        featured: false,
        published: false,
      });
      setCodeValue(post.body);
      setFunnyComment('');
      toast.success('Post generado! Revisa y personaliza el contenido.');
      setGenTopic('');
    } catch (e) {
      toast.danger(e instanceof Error ? e.message : 'Error al generar');
      setFunnyComment('');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return <div className="flex justify-center py-8"><Spinner /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/intranet/admin/blog"><Button variant="ghost" size="sm"><ArrowLeft size={14} /></Button></Link>
          <div>
            <h1 className="text-xl font-extrabold text-primary">{isNew ? 'Nuevo Post' : 'Editar Post'}</h1>
            {isDirty && (
              <p className="text-xxs text-warning flex items-center gap-1">
                <AlertTriangle size={10} /> Cambios sin guardar
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={(e) => handleSave(e as unknown as React.FormEvent, true)} disabled={saving}>
            <Save size={14} className="mr-1" /> Guardar borrador
          </Button>
          <Button type="button" variant="primary" size="sm" onClick={(e) => handleSave(e as unknown as React.FormEvent)} loading={saving}>
            <Save size={14} className="mr-1" /> {isNew ? 'Publicar' : 'Actualizar'}
          </Button>
        </div>
      </div>

      {/* GENERADOR AI */}
      {isNew && (
        <Card padding="md">
          <div className="flex items-center gap-2 mb-3">
            <Wand2 size={16} className="text-accent" />
            <h2 className="font-bold text-sm text-primary">Generar artículo automáticamente</h2>
          </div>
          <p className="text-xs text-text-secondary mb-3">
            Escribe un tema y selecciona la categoría. El sistema generará un artículo completo con estructura legal, secciones y formato listo para publicar.
          </p>
          <div className="flex flex-wrap gap-2 mb-3">
            <div className="flex-1 min-w-[200px]">
              <Input
                value={genTopic}
                onChange={e => setGenTopic(e.target.value)}
                placeholder="Tema del artículo, ej: Cómo reclamar una herencia en Honduras"
              />
            </div>
            <select
              value={genCategory}
              onChange={e => setGenCategory(e.target.value)}
              className="h-9 rounded-md border border-border-light bg-surface px-2 text-sm"
            >
              {blogCategories.map(c => <option key={c.slug} value={c.slug}>{c.nombre}</option>)}
            </select>
            <Button
              onClick={handleGeneratePost}
              variant="primary"
              size="sm"
              loading={generating}
              disabled={generating}
            >
              {generating ? <Loader2 size={14} className="animate-spin mr-1" /> : <Sparkles size={14} className="mr-1" />}
              Generar post
            </Button>
          </div>

          {generating && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-surface-alt rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent rounded-full transition-all duration-300"
                    style={{ width: `${genProgress}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-accent tabular-nums">{Math.round(genProgress)}%</span>
              </div>
              <p className="text-xs text-text-secondary italic flex items-center gap-1">
                <Sparkles size={12} className="text-accent" />
                {funnyComment}
              </p>
            </div>
          )}

          {!generating && form.body && (
            <div className="flex items-center gap-2 text-xs text-success">
              <CheckCircle2 size={14} />
              Artículo generado y cargado en el editor
            </div>
          )}
        </Card>
      )}

      {/* FORMULARIO */}
      <form onSubmit={(e) => handleSave(e)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Columna principal: metadata del post + editor */}
          <div className="md:col-span-2 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Título *</label>
              <Input value={form.title} onChange={e => { update('title', e.target.value); if (!form.slug) slugFromTitle(); }} required placeholder="Título del artículo" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Slug</label>
              <Input value={form.slug} onChange={e => update('slug', e.target.value)} placeholder="auto-generado desde el título" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Descripción (extracto) *</label>
              <Input value={form.description} onChange={e => update('description', e.target.value)} required placeholder="Breve descripción del artículo" />
            </div>

            {/* EDITOR CON DOBLE PESTAÑA */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-text-secondary">Contenido *</label>
                <div className="flex rounded-md border border-border-light overflow-hidden">
                  <button
                    type="button"
                    onClick={() => activeTab === 'code' ? switchToVisual() : null}
                    className={cn(
                      'flex items-center gap-1 px-3 py-1 text-xs font-medium transition-colors',
                      activeTab === 'visual'
                        ? 'bg-accent/15 text-primary'
                        : 'text-text-secondary hover:bg-surface-alt'
                    )}
                  >
                    <Eye size={12} /> Editor visual
                  </button>
                  <button
                    type="button"
                    onClick={() => activeTab === 'visual' ? switchToCode() : null}
                    className={cn(
                      'flex items-center gap-1 px-3 py-1 text-xs font-medium transition-colors',
                      activeTab === 'code'
                        ? 'bg-accent/15 text-primary'
                        : 'text-text-secondary hover:bg-surface-alt'
                    )}
                  >
                    <Code2 size={12} /> Código
                  </button>
                </div>
              </div>

              {activeTab === 'visual' ? (
                <RichTextEditor content={form.body} onChange={handleBodyChange} minHeight={400} />
              ) : (
                <div className="space-y-1">
                  <textarea
                    value={codeValue}
                    onChange={e => handleCodeChange(e.target.value)}
                    className="w-full min-h-[400px] p-3 rounded-md border border-border-light bg-surface font-mono text-xs text-text leading-relaxed focus:outline-none focus:ring-2 focus:ring-accent/30 resize-y"
                    spellCheck={false}
                    placeholder="<p>Escribe el contenido HTML aquí...</p>"
                  />
                  {codeError && (
                    <p className="text-xs text-danger flex items-center gap-1">
                      <AlertTriangle size={10} /> {codeError}
                    </p>
                  )}
                  <p className="text-xxs text-text-muted">
                    Puedes escribir HTML directamente. Los cambios se convertirán al editor visual al cambiar de pestaña. Antes de guardar, verifica el contenido en ambas pestañas.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Columna lateral: metadatos */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Categoría</label>
              <select value={form.category} onChange={e => update('category', e.target.value)} className="w-full h-9 rounded-md border border-border-light bg-surface px-2 text-sm">
                {blogCategories.map(c => <option key={c.slug} value={c.slug}>{c.nombre}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Fecha publicación</label>
              <Input type="datetime-local" value={form.publishedAt} onChange={e => update('publishedAt', e.target.value)} />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-text-secondary">Tags</label>
                <button type="button" onClick={handleAutoTags} className="text-xxs text-accent hover:text-accent-dark flex items-center gap-1 transition-colors">
                  <Tag size={11} /> Auto
                </button>
              </div>
              <Input value={form.tags} onChange={e => update('tags', e.target.value)} placeholder="ej: divorcio, familia, custodia" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Autor</label>
              <Input value={form.author} onChange={e => update('author', e.target.value)} />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-text-secondary">Tiempo lectura</label>
                <button type="button" onClick={handleAutoReadingTime} className="text-xxs text-accent hover:text-accent-dark flex items-center gap-1 transition-colors">
                  <Clock size={11} /> Auto
                </button>
              </div>
              <Input value={form.readingTime} onChange={e => update('readingTime', e.target.value)} />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-text-secondary">Imagen portada</label>
                <button type="button" onClick={handleAutoCover} className="text-xxs text-accent hover:text-accent-dark flex items-center gap-1 transition-colors">
                  {/* eslint-disable-next-line jsx-a11y/alt-text */}
                  <Image size={11} /> Auto
                </button>
              </div>
              <Input value={form.coverImage} onChange={e => update('coverImage', e.target.value)} placeholder="/images/blog/..." />
              <div className="mt-2">
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border-light bg-surface hover:bg-surface-alt text-xs text-text-secondary cursor-pointer transition-colors">
                  <Upload size={12} />
                  {uploading ? 'Subiendo...' : 'Subir imagen'}
                  <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageUpload} className="hidden" disabled={uploading} />
                </label>
                {form.coverImage && (
                  <button type="button" onClick={clearCoverImage} className="ml-2 inline-flex items-center gap-1 text-xxs text-danger hover:text-danger-dark transition-colors">
                    <X size={11} /> Quitar
                  </button>
                )}
              </div>
              {(form.coverImage || uploadPreview) && (
                <div className="mt-2 relative aspect-video rounded-md overflow-hidden border border-border-light bg-surface-alt">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={form.coverImage} alt="Vista previa" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                </div>
              )}
              <p className="text-xxs text-text-muted mt-1">
                Formatos: JPEG, PNG, WebP. Máx. 10 MB. Se convierte a WebP optimizado y se nombra según el slug.
              </p>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.featured} onChange={e => update('featured', e.target.checked)} className="rounded" /> Destacado
            </label>

            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.published} onChange={e => update('published', e.target.checked)} className="rounded" /> Publicado
            </label>

            <div className="flex flex-col gap-2 pt-2 border-t border-border-light">
              <Button type="button" variant="secondary" size="sm" onClick={(e) => handleSave(e as unknown as React.FormEvent, true)} disabled={saving} fullWidth>
                <Save size={14} className="mr-1" /> Guardar borrador
              </Button>
              <Button type="button" variant="primary" size="sm" onClick={(e) => handleSave(e as unknown as React.FormEvent)} loading={saving} fullWidth>
                <Save size={14} className="mr-1" /> {isNew ? 'Publicar post' : 'Actualizar post'}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
