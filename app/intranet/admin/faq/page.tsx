'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { Plus, Trash2, Edit3, ChevronDown, ChevronRight, Save, X, ArrowUp, ArrowDown, Search, ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { useToast } from '@/components/ui/toast';
import { useConfirm } from '@/components/ui/confirm';
import { Spinner } from '@/components/ui/spinner';
import { faqCategoriesMeta } from '@/data/faq-categories';
import Link from 'next/link';

const VALID_CATEGORY_SLUGS = new Set(faqCategoriesMeta.map(c => c.slug));
const categoryNamesBySlug: Record<string, string> = Object.fromEntries(
  faqCategoriesMeta.map(c => [c.slug, c.titulo])
);

interface FaqEntry {
  id: string;
  category: string;
  question: string;
  answer: string;
  sortOrder: number;
  published: boolean;
}

export default function AdminFaqPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const [faqs, setFaqs] = useState<FaqEntry[]>([]);
  const [grouped, setGrouped] = useState<Record<string, FaqEntry[]>>({});
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ category: '', question: '', answer: '', sortOrder: 0, published: true });
  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState({ category: '', question: '', answer: '' });
  const [q, setQ] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [saving, setSaving] = useState(false);

  const displayCategories = useMemo(() => {
    const fromDb = faqs.reduce<string[]>((acc, f) => {
      if (!acc.includes(f.category)) acc.push(f.category);
      return acc;
    }, []).sort();
    if (fromDb.length > 0) return fromDb;
    return faqCategoriesMeta.map(c => c.slug);
  }, [faqs]);

  const categoryName = (slug: string) => categoryNamesBySlug[slug] ?? slug;
  const isCategoryValid = (slug: string) => VALID_CATEGORY_SLUGS.has(slug);

  const fetchFaqs = useCallback(() => {
    const params = new URLSearchParams();
    if (filterCategory) params.set('category', filterCategory);
    fetch(`/api/admin/faq?${params}`)
      .then(r => r.json())
      .then(data => {
        setFaqs(data.faqs ?? []);
        setGrouped(data.grouped ?? {});
      })
      .catch(() => toast.danger('Error al cargar FAQs'))
      .finally(() => setLoading(false));
  }, [filterCategory, toast]);

  useEffect(() => { setLoading(true); fetchFaqs(); }, [fetchFaqs]); // eslint-disable-line react-hooks/set-state-in-effect

  const publishedCount = faqs.filter(f => f.published).length;
  const draftCount = faqs.filter(f => !f.published).length;
  const invalidCategories = faqs.filter(f => !isCategoryValid(f.category));

  const filteredGrouped = useMemo(() => {
    const entries = Object.entries(grouped) as [string, FaqEntry[]][];
    return entries
      .map(([cat, entries]) => {
        let filtered = entries;
        if (q) {
          const lower = q.toLowerCase();
          filtered = filtered.filter(f =>
            f.question.toLowerCase().includes(lower) ||
            (f.answer || '').toLowerCase().includes(lower)
          );
        }
        if (filterStatus === 'true') filtered = filtered.filter(f => f.published);
        if (filterStatus === 'false') filtered = filtered.filter(f => !f.published);
        return [cat, filtered] as [string, FaqEntry[]];
      })
      .filter(([, entries]) => entries.length > 0);
  }, [grouped, q, filterStatus]);

  const allExpanded = () => {
    const cats = filteredGrouped.map(([cat]) => cat);
    setExpanded(new Set(cats));
  };

  const collapseAll = () => setExpanded(new Set());

  const toggleCategory = (cat: string) => {
    const next = new Set(expanded);
    if (next.has(cat)) { next.delete(cat); } else { next.add(cat); }
    setExpanded(next);
  };

  const startEdit = (f: FaqEntry) => {
    setEditing(f.id);
    setEditForm({ category: f.category, question: f.question, answer: f.answer, sortOrder: f.sortOrder, published: f.published });
    setShowNew(false);
  };

  const cancelEdit = () => { setEditing(null); setShowNew(false); };

  const saveEdit = async () => {
    if (!editing) return;
    if (!editForm.category || !editForm.question || !editForm.answer) {
      toast.danger('Todos los campos son obligatorios'); return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/faq/${editing}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      toast.success('FAQ actualizada');
      setEditing(null);
      fetchFaqs();
    } catch (e) { toast.danger(e instanceof Error ? e.message : 'Error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!await confirm({ title: '¿Eliminar esta FAQ?', description: 'Esta acción no se puede deshacer.' })) return;
    try {
      await fetch(`/api/admin/faq/${id}`, { method: 'DELETE' });
      toast.success('FAQ eliminada');
      fetchFaqs();
    } catch { toast.danger('Error al eliminar'); }
  };

  const createFaq = async () => {
    if (!newForm.category || !newForm.question || !newForm.answer) {
      toast.danger('Todos los campos son obligatorios'); return;
    }
    if (!isCategoryValid(newForm.category)) {
      toast.danger('Categoría no válida. Selecciona una categoría de la lista.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/admin/faq', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newForm),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      toast.success('FAQ creada y publicada');
      setShowNew(false);
      setNewForm({ category: '', question: '', answer: '' });
      fetchFaqs();
    } catch (e) { toast.danger(e instanceof Error ? e.message : 'Error'); }
    finally { setSaving(false); }
  };

  const reorder = async (f: FaqEntry, direction: -1 | 1) => {
    try {
      await fetch(`/api/admin/faq/${f.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sortOrder: f.sortOrder + direction }),
      });
      fetchFaqs();
    } catch { toast.danger('Error al reordenar'); }
  };

  if (loading) return <div className="flex justify-center py-8"><Spinner /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-primary">FAQ</h1>
          <p className="text-xs text-text-secondary">
            {faqs.length} preguntas ({publishedCount} publicadas, {draftCount} borradores)
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/preguntas-frecuentes" target="_blank" rel="noopener noreferrer">
            <Button variant="ghost" size="sm"><ExternalLink size={14} className="mr-1" /> Ver web</Button>
          </Link>
          <Button variant="primary" size="sm" onClick={() => { setShowNew(!showNew); setEditing(null); }}>
            <Plus size={14} className="mr-1" /> Nueva FAQ
          </Button>
        </div>
      </div>

      {/* Invalid categories warning */}
      {invalidCategories.length > 0 && (
        <Card padding="md" className="border-warning/50 bg-warning-bg">
          <p className="text-xs text-warning font-semibold">
            {invalidCategories.length} FAQ{invalidCategories.length > 1 ? 's' : ''} con categoría no reconocida: {[...new Set(invalidCategories.map(f => f.category))].join(', ')}. Las categorías deben coincidir con las definidas en <code className="text-xxs bg-surface px-1 rounded">data/faq-categories.ts</code>.
          </p>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <Card padding="sm" className="text-center">
          <p className="text-lg font-extrabold text-primary">{faqs.length}</p>
          <p className="text-xxs text-text-muted">Total</p>
        </Card>
        <Card padding="sm" className="text-center">
          <p className="text-lg font-extrabold text-success">{publishedCount}</p>
          <p className="text-xxs text-text-muted">Publicadas</p>
        </Card>
        <Card padding="sm" className="text-center">
          <p className="text-lg font-extrabold text-warning">{draftCount}</p>
          <p className="text-xxs text-text-muted">Borradores</p>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="flex-1 min-w-[200px]">
          <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar preguntas o respuestas..." iconLeft={<Search size={14} />} />
        </div>
        <select value={filterCategory} onChange={e => { setFilterCategory(e.target.value); }} className="h-9 rounded-md border border-border-light bg-surface px-2 text-sm">
          <option value="">Todas las categorías</option>
          {displayCategories.map(c => <option key={c} value={c}>{categoryName(c)}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="h-9 rounded-md border border-border-light bg-surface px-2 text-sm">
          <option value="all">Todos los estados</option>
          <option value="true">Publicados</option>
          <option value="false">Borradores</option>
        </select>
        <Button variant="ghost" size="sm" onClick={allExpanded}>Expandir todo</Button>
        <Button variant="ghost" size="sm" onClick={collapseAll}>Colapsar todo</Button>
      </div>

      {showNew && (
        <Card padding="md">
          <h2 className="font-bold text-sm text-primary mb-3">Nueva pregunta frecuente</h2>
          <div className="space-y-2">
            <div>
              <label className="text-xs font-semibold text-text-secondary">Categoría *</label>
              <select value={newForm.category} onChange={e => setNewForm(f => ({ ...f, category: e.target.value }))}
                className="w-full h-9 rounded-md border border-border-light bg-surface px-2 text-sm">
                <option value="">Seleccionar categoría...</option>
                {faqCategoriesMeta.map(c => <option key={c.slug} value={c.slug}>{c.titulo}</option>)}
              </select>
              {newForm.category && !isCategoryValid(newForm.category) && (
                <p className="text-xxs text-danger mt-1">Categoría no reconocida</p>
              )}
            </div>
            <Input value={newForm.question} onChange={e => setNewForm(f => ({ ...f, question: e.target.value }))} placeholder="Pregunta *" />
            <div>
              <label className="text-xs font-semibold text-text-secondary mb-1 block">Respuesta *</label>
              <RichTextEditor content={newForm.answer} onChange={html => setNewForm(f => ({ ...f, answer: html }))} minHeight={150} />
            </div>
            <div className="flex gap-2">
              <Button onClick={createFaq} variant="primary" size="sm" loading={saving}>
                <Save size={14} className="mr-1" /> Crear y publicar
              </Button>
              <Button onClick={cancelEdit} variant="ghost" size="sm">Cancelar</Button>
            </div>
          </div>
        </Card>
      )}

      {filteredGrouped.length === 0 ? (
        <Card padding="lg">
          <div className="text-center space-y-2">
            <p className="text-text-secondary text-sm">
              {q || filterCategory || filterStatus !== 'all'
                ? 'No se encontraron FAQs con esos filtros.'
                : 'No hay FAQs aún.'}
            </p>
            {!q && !filterCategory && filterStatus === 'all' && faqs.length === 0 && (
              <Button variant="primary" size="sm" onClick={() => setShowNew(true)}>
                <Plus size={14} className="mr-1" /> Crear primera FAQ
              </Button>
            )}
          </div>
        </Card>
      ) : (
        filteredGrouped.map(([cat, entries]) => (
          <Card key={cat} padding="none">
            <button type="button" onClick={() => toggleCategory(cat)}
              className="w-full flex items-center justify-between p-3 hover:bg-surface-alt transition-colors text-left">
              <span className="font-bold text-sm text-primary">
                {categoryName(cat)}
                {!isCategoryValid(cat) && <Badge tone="warning" className="ml-2">Cat. no estándar</Badge>}
                <span className="text-text-muted font-normal text-xs ml-1">({entries.length})</span>
              </span>
              {expanded.has(cat) ? <ChevronDown size={16} className="text-text-secondary" /> : <ChevronRight size={16} className="text-text-secondary" />}
            </button>
            {expanded.has(cat) && (
              <div className="border-t border-border-light">
                {entries.map(f => editing === f.id ? (
                  <div key={f.id} className="p-3 border-b border-border-light space-y-2 bg-surface-alt">
                    <label className="text-xs font-semibold text-text-secondary">Categoría</label>
                    <select value={editForm.category} onChange={e => setEditForm(ff => ({ ...ff, category: e.target.value }))}
                      className="w-full h-9 rounded-md border border-border-light bg-surface px-2 text-sm">
                      {faqCategoriesMeta.map(c => <option key={c.slug} value={c.slug}>{c.titulo}</option>)}
                    </select>
                    <Input value={editForm.question} onChange={e => setEditForm(ff => ({ ...ff, question: e.target.value }))} placeholder="Pregunta" />
                    <RichTextEditor content={editForm.answer} onChange={html => setEditForm(ff => ({ ...ff, answer: html }))} minHeight={150} />
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={editForm.published} onChange={e => setEditForm(ff => ({ ...ff, published: e.target.checked }))} className="rounded" /> Publicado
                    </label>
                    <div className="flex gap-2">
                      <Button onClick={saveEdit} variant="primary" size="sm" loading={saving}>
                        <Save size={14} className="mr-1" /> Guardar
                      </Button>
                      <Button onClick={cancelEdit} variant="ghost" size="sm"><X size={14} className="mr-1" /> Cancelar</Button>
                    </div>
                  </div>
                ) : (
                  <div key={f.id} className="p-3 border-b border-border-light hover:bg-surface-alt flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-text">{f.question}</p>
                        {f.published
                          ? <Badge tone="success" className="flex-shrink-0">Público</Badge>
                          : <Badge tone="warning" className="flex-shrink-0">Borrador</Badge>
                        }
                      </div>
                      <p className="text-xs text-text-secondary mt-0.5 line-clamp-2" dangerouslySetInnerHTML={{ __html: f.answer }} />
                    </div>
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      <Button variant="ghost" size="sm" onClick={() => reorder(f, -1)} aria-label="Subir"><ArrowUp size={12} /></Button>
                      <Button variant="ghost" size="sm" onClick={() => reorder(f, 1)} aria-label="Bajar"><ArrowDown size={12} /></Button>
                      <Button variant="ghost" size="sm" onClick={() => startEdit(f)} aria-label="Editar"><Edit3 size={14} /></Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(f.id)} aria-label="Eliminar"><Trash2 size={14} className="text-danger" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        ))
      )}
    </div>
  );
}
