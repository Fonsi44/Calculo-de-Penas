'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/toast';
import { BookOpen, Plus, Check, X, Eye } from 'lucide-react';

interface KS { id: string; title: string; type: string; estado: string; version_estado?: string; version?: number; content_hash?: string; }

export default function KnowledgeAdminPage() {
  const toast = useToast();
  const [sources, setSources] = useState<KS[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState('norma');
  const [content, setContent] = useState('');

  const refreshSources = () => {
    setLoading(true);
    fetch('/api/admin/knowledge')
      .then(async r => { if (r.ok) setSources((await r.json()).sources || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/admin/knowledge', { signal: controller.signal })
      .then(async r => { if (r.ok) setSources((await r.json()).sources || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  const handleCreate = async () => {
    if (!title.trim() || !content.trim()) return;
    try {
      const resp = await fetch('/api/admin/knowledge', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), type, content: content.trim() }),
      });
      if (!resp.ok) throw new Error((await resp.json()).error);
      toast.success('Fuente creada');
      setShowCreate(false); setTitle(''); setContent('');
      refreshSources();
    } catch (e: unknown) { toast.danger(e instanceof Error ? e.message : 'Error'); }
  };

  const handleAction = async (sourceId: string, action: string) => {
    try {
      const resp = await fetch(`/api/admin/knowledge/${action}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceId, motivo: `Acción ${action}` }),
      });
      if (!resp.ok) throw new Error((await resp.json()).error);
      toast.success(`"${action}" completado`);
      refreshSources();
    } catch (e: unknown) { toast.danger(e instanceof Error ? e.message : 'Error'); }
  };

  const el = (e: string) => {
    const m: Record<string, string> = { draft:'Borrador', pending_legal_review:'Revisión', approved:'Aprobado', published_internal:'Publicado', superseded:'Sustituido', withdrawn:'Retirado' };
    return m[e] || e;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-text flex items-center gap-2"><BookOpen size={18} /> Base Jurídica</h1>
        <Button variant="primary" size="sm" onClick={() => setShowCreate(true)}><Plus size={14} /> Nueva fuente</Button>
      </div>

      {loading ? <div className="flex justify-center py-8"><Spinner size="md" /></div> :
        sources.length === 0 ? <Card padding="md"><p className="text-sm text-text-secondary">Sin fuentes jurídicas.</p></Card> :
        <div className="space-y-2">
          {sources.map((s) => (
            <Card key={s.id} padding="sm">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-accent-dark">{s.type}</span>
                  <span className="text-xs ml-2 px-1 py-0.5 rounded bg-surface-alt">{el(s.version_estado || s.estado)}</span>
                  <p className="text-sm text-text">{s.title}</p>
                  {s.content_hash && <span className="text-xxs text-text-muted font-mono">v{s.version} · {s.content_hash.slice(0,12)}…</span>}
                </div>
                <div className="flex gap-1">
                  {(s.estado === 'draft' || s.version_estado === 'draft') && (
                    <Button variant="ghost" size="sm" onClick={() => handleAction(s.id, 'review')} title="Revisar"><Eye size={12} /></Button>
                  )}
                  {s.version_estado === 'pending_legal_review' && (
                    <Button variant="ghost" size="sm" onClick={() => handleAction(s.id, 'approve')} title="Aprobar"><Check size={12} /></Button>
                  )}
                  {s.version_estado === 'approved' && (
                    <Button variant="ghost" size="sm" onClick={() => handleAction(s.id, 'publish')} title="Publicar"><Eye size={12} /></Button>
                  )}
                  {(s.version_estado === 'approved' || s.version_estado === 'published_internal') && (
                    <Button variant="ghost" size="sm" onClick={() => handleAction(s.id, 'withdraw')} title="Retirar"><X size={12} /></Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      }

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={e => { if (e.target === e.currentTarget) setShowCreate(false); }} onKeyDown={e => { if (e.key === 'Escape') setShowCreate(false); }}>
          <div className="bg-surface rounded-xl shadow-2xl w-full max-w-lg m-4 p-6" role="dialog" aria-label="Nueva fuente jurídica">
            <h3 className="text-lg font-bold mb-4">Nueva fuente</h3>
            <div className="space-y-3">
              <input className="w-full border rounded px-3 py-2 text-sm" placeholder="Título" value={title} onChange={e => setTitle(e.target.value)} aria-label="Título" />
              <select className="w-full border rounded px-3 py-2 text-sm" value={type} onChange={e => setType(e.target.value)} aria-label="Tipo">
                {['norma','reforma','jurisprudencia','protocolo','formulario','plantilla','criterio_interno','checklist','guia','modelo_comunicacion'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <textarea className="w-full border rounded px-3 py-2 text-sm h-40" placeholder="Contenido" value={content} onChange={e => setContent(e.target.value)} aria-label="Contenido" />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setShowCreate(false)}>Cancelar</Button>
                <Button variant="primary" size="sm" onClick={handleCreate}>Crear</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
