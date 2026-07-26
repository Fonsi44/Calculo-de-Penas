'use client';
import { useState, useCallback } from 'react';
import { Layers, RefreshCw, Check, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/ui';

export default function SegmentacionPage() {
  const toast = useToast();
  const [docId, setDocId] = useState('');
  const [loading, setLoading] = useState(false);
  const [segments, setSegments] = useState<Array<{id:string;startPage:number;endPage:number;suggestedType:string;suggestedTitle:string;confidence:number;reviewStatus:string}>>([]);
  const [_runId, setRunId] = useState('');

  const analyze = useCallback(async () => {
    if (!docId.trim()) return;
    setLoading(true);
    try {
      const resp = await fetch(`/api/sgie/documentos/${docId}/segmentacion`, { method:'POST', headers:{'Content-Type':'application/json'} });
      if (!resp.ok) throw new Error((await resp.json()).error);
      const data = await resp.json();
      setRunId(data.runId);
      const segResp = await fetch(`/api/sgie/documentos/${docId}/segmentacion?run_id=${data.runId}`);
      if (segResp.ok) { const d = await segResp.json(); setSegments(d.segments || []); }
      toast.success('Análisis completado');
    } catch (e: unknown) { toast.danger(e instanceof Error ? e.message : 'Error'); }
    finally { setLoading(false); }
  }, [docId, toast]);

  const review = async (segId: string, decision: string) => {
    try {
      await fetch(`/api/sgie/documentos/${docId}/segmentacion`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({segment_id:segId,decision}) });
      setSegments(prev => prev.map(s => s.id === segId ? {...s, reviewStatus:'reviewed'} : s));
      toast.success(`Segmento ${decision === 'accepted' ? 'aceptado' : 'rechazado'}`);
    } catch { toast.danger('Error al revisar'); }
  };

  const levelColor = (c: number) => c >= 70 ? 'bg-green-100 text-green-800' : c >= 40 ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600';

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3"><Layers size={24} className="text-accent-dark" /><h1 className="text-xl font-extrabold text-primary">Segmentación documental</h1></div>
      <Card className="p-4"><div className="flex gap-3">
        <input type="text" value={docId} onChange={e=>setDocId(e.target.value)} placeholder="ID del documento (UUID)" className="flex-1 px-3 py-2 rounded-lg border border-border-light bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-accent/30" />
        <Button onClick={analyze} disabled={loading||!docId.trim()}><RefreshCw size={14} className={cn(loading&&'animate-spin','mr-1')} />Analizar</Button>
      </div></Card>
      {loading && <Spinner label="Analizando documento..." />}
      {segments.length > 0 && !loading && (
        <div className="space-y-3">{segments.map(s => (
          <Card key={s.id} className={cn('p-4 flex items-start gap-4', s.reviewStatus==='reviewed'&&'opacity-60')}>
            <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-accent/10 flex items-center justify-center"><Layers size={24} className="text-accent-dark" /></div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge className={levelColor(s.confidence)}>{s.suggestedType}</Badge>
                <span className="text-xs text-text-muted">Páginas {s.startPage}-{s.endPage}</span>
                <span className="text-xs text-text-muted">Confianza: {s.confidence}%</span>
              </div>
              <p className="font-bold text-sm">{s.suggestedTitle}</p>
              {s.reviewStatus === 'reviewed' && <p className="text-xs text-green-600 mt-1">✓ Revisado</p>}
            </div>
            {s.reviewStatus !== 'reviewed' && (<div className="flex gap-1 flex-shrink-0">
              <Button size="sm" onClick={()=>review(s.id,'accepted')} variant="secondary"><Check size={14} /></Button>
              <Button size="sm" onClick={()=>review(s.id,'rejected')} variant="secondary"><X size={14} /></Button>
            </div>)}
          </Card>
        ))}</div>
      )}
      {!loading && segments.length === 0 && <Card className="p-8 text-center"><p className="text-text-muted">Ingresa un ID de documento y haz clic en Analizar</p></Card>}
    </div>
  );
}
