'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, Edit3, ChevronDown, ChevronRight, Save, X, ArrowUp, ArrowDown } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { useToast } from '@/components/ui/toast';
import { useConfirm } from '@/components/ui/confirm';
import { Spinner } from '@/components/ui/spinner';

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

  const fetchFaqs = () => {
    setLoading(true);
    fetch('/api/admin/faq').then(r => r.json()).then(data => {
      setFaqs(data.faqs ?? []);
      setGrouped(data.grouped ?? {});
    }).catch(() => toast.danger('Error al cargar FAQs')).finally(() => setLoading(false));
  };

  useEffect(() => { fetchFaqs(); }, []); // eslint-disable-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps

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
  };

  const handleDelete = async (id: string) => {
    if (!await confirm({ title: '¿Eliminar esta FAQ?' })) return;
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
    try {
      const res = await fetch('/api/admin/faq', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newForm),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      toast.success('FAQ creada');
      setShowNew(false);
      setNewForm({ category: '', question: '', answer: '' });
      fetchFaqs();
    } catch (e) { toast.danger(e instanceof Error ? e.message : 'Error'); }
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
        <div><h1 className="text-xl font-extrabold text-primary">FAQ</h1><p className="text-xs text-text-secondary">{faqs.length} preguntas</p></div>
        <Button variant="primary" size="sm" onClick={() => { setShowNew(!showNew); setEditing(null); }}>
          <Plus size={14} className="mr-1" /> Nueva FAQ
        </Button>
      </div>

      {showNew && (
        <Card padding="md">
          <h2 className="font-bold text-sm text-primary mb-3">Nueva pregunta</h2>
          <div className="space-y-2">
            <Input value={newForm.category} onChange={e => setNewForm(f => ({ ...f, category: e.target.value }))} placeholder="Categoría (ej: derecho-penal)" />
            <Input value={newForm.question} onChange={e => setNewForm(f => ({ ...f, question: e.target.value }))} placeholder="Pregunta" />
            <RichTextEditor content={newForm.answer} onChange={html => setNewForm(f => ({ ...f, answer: html }))} minHeight={150} placeholder="Respuesta" />
            <div className="flex gap-2">
              <Button onClick={createFaq} variant="primary" size="sm"><Save size={14} className="mr-1" /> Crear</Button>
              <Button onClick={cancelEdit} variant="ghost" size="sm">Cancelar</Button>
            </div>
          </div>
        </Card>
      )}

      {Object.keys(grouped).length === 0 ? (
        <Card padding="md"><p className="text-center text-text-secondary text-sm">No hay FAQs. Usa el botón para crear la primera.</p></Card>
      ) : (
        Object.entries(grouped).map(([cat, entries]) => (
          <Card key={cat} padding="none">
            <button type="button" onClick={() => toggleCategory(cat)}
              className="w-full flex items-center justify-between p-3 hover:bg-surface-alt transition-colors text-left">
              <span className="font-bold text-sm text-primary">{cat} <span className="text-text-muted font-normal text-xs">({entries.length})</span></span>
              {expanded.has(cat) ? <ChevronDown size={16} className="text-text-secondary" /> : <ChevronRight size={16} className="text-text-secondary" />}
            </button>
            {expanded.has(cat) && (
              <div className="border-t border-border-light">
                {entries.map(f => editing === f.id ? (
                  <div key={f.id} className="p-3 border-b border-border-light space-y-2 bg-surface-alt">
                    <Input value={editForm.category} onChange={e => setEditForm(ff => ({ ...ff, category: e.target.value }))} placeholder="Categoría" />
                    <Input value={editForm.question} onChange={e => setEditForm(ff => ({ ...ff, question: e.target.value }))} placeholder="Pregunta" />
                    <RichTextEditor content={editForm.answer} onChange={html => setEditForm(ff => ({ ...ff, answer: html }))} minHeight={150} />
                    <div className="flex gap-2">
                      <Button onClick={saveEdit} variant="primary" size="sm"><Save size={14} className="mr-1" /> Guardar</Button>
                      <Button onClick={cancelEdit} variant="ghost" size="sm"><X size={14} className="mr-1" /> Cancelar</Button>
                    </div>
                  </div>
                ) : (
                  <div key={f.id} className="p-3 border-b border-border-light hover:bg-surface-alt flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text">{f.question}</p>
                      <p className="text-xs text-text-secondary mt-0.5 line-clamp-2" dangerouslySetInnerHTML={{ __html: f.answer }} />
                    </div>
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      <Button variant="ghost" size="sm" onClick={() => reorder(f, -1)}><ArrowUp size={12} /></Button>
                      <Button variant="ghost" size="sm" onClick={() => reorder(f, 1)}><ArrowDown size={12} /></Button>
                      <Button variant="ghost" size="sm" onClick={() => startEdit(f)}><Edit3 size={14} /></Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(f.id)}><Trash2 size={14} className="text-danger" /></Button>
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
