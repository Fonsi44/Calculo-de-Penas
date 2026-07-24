'use client';
import { useEffect, useState } from 'react';
import { AlertTriangle, Check, X, RotateCcw, Filter } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/ui';

export default function ContradiccionesPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Array<{id:string;description:string;classification:string;reviewStatus:string;confidence:number;sourceExcerpt:string;relatedExcerpt:string}>>([]);
  const [filter, setFilter] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const url = filter ? `/api/sgie/contradicciones?status=${filter}` : '/api/sgie/contradicciones';
      const resp = await fetch(url);
      if (resp.ok) setItems(await resp.json());
    } catch { toast.danger('Error al cargar'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    const url = filter ? `/api/sgie/contradicciones?status=${filter}` : '/api/sgie/contradicciones';
    fetch(url).then(async r => { if (r.ok) setItems(await r.json()); }).catch(() => {}).finally(() => setLoading(false));
  }, [filter]);

  const review = async (id: string, decision: string) => {
    try {
      await fetch(`/api/sgie/contradicciones?action=review`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({id,decision}) });
      toast.success(`Contradicción ${decision === 'confirmed' ? 'confirmada' : 'rechazada'}`);
      load();
    } catch { toast.danger('Error'); }
  };

  const classColor = (c: string) => c === 'confirmed_contradiction' ? 'bg-red-100 text-red-800' : c === 'data_quality_issue' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800';
  const statusIcon = (s: string) => s === 'reviewed' ? <Check size={14} className="text-green-600" /> : <AlertTriangle size={14} className="text-orange-500" />;

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between"><div className="flex items-center gap-3"><AlertTriangle size={24} className="text-accent-dark" /><h1 className="text-xl font-extrabold text-primary">Contradicciones</h1></div>
        <div className="flex items-center gap-2"><Filter size={14} className="text-text-muted" /><select value={filter} onChange={e=>setFilter(e.target.value)} className="text-sm border rounded px-2 py-1">
          <option value="">Todas</option><option value="pending">Pendientes</option><option value="reviewed">Revisadas</option>
        </select><Button size="sm" onClick={load}><RotateCcw size={12} /></Button></div>
      </div>
      {loading && <Spinner />}
      {!loading && items.length === 0 && <Card className="p-8 text-center"><p className="text-text-muted">No hay contradicciones</p></Card>}
      {!loading && items.map(item => (
        <Card key={item.id} className={cn('p-4', item.reviewStatus==='reviewed'&&'opacity-60')}>
          <div className="flex items-start gap-3">
            <div className="mt-1">{statusIcon(item.reviewStatus)}</div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1"><Badge className={classColor(item.classification)}>{item.classification}</Badge><span className="text-xs text-text-muted">Confianza: {item.confidence}%</span></div>
              <p className="text-sm font-bold mb-1">{item.description}</p>
              {item.sourceExcerpt && <p className="text-xs text-text-secondary mb-1"><strong>Origen:</strong> {item.sourceExcerpt.substring(0,80)}</p>}
              {item.relatedExcerpt && <p className="text-xs text-text-secondary"><strong>Relacionado:</strong> {item.relatedExcerpt.substring(0,80)}</p>}
            </div>
            {item.reviewStatus === 'pending' && (<div className="flex gap-1 flex-shrink-0"><Button size="sm" onClick={()=>review(item.id,'confirmed')} variant="secondary"><Check size={14} /></Button><Button size="sm" onClick={()=>review(item.id,'rejected')} variant="secondary"><X size={14} /></Button></div>)}
          </div>
        </Card>
      ))}
    </div>
  );
}
