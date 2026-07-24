'use client';
import { useState } from 'react';
import { GitCompare, RefreshCw, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/ui';

export default function ComparacionPage() {
  const toast = useToast();
  const [srcId, setSrcId] = useState(''); const [tgtId, setTgtId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{summary:string;deterministicDiff:{pagesAdded:number[];pagesRemoved:number[];pagesReordered:boolean;additions:Array<{page:number;text:string}>;deletions:Array<{page:number;text:string}>;modifications:Array<{page:number;before:string;after:string}>};materialChanges:Array<{category:string;description:string;confidence:number}>} | null>(null);

  const compare = async () => {
    if (!srcId.trim() || !tgtId.trim()) return;
    setLoading(true);
    try {
      const resp = await fetch('/api/sgie/documentos/comparar', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({sourceDocId:srcId.trim(),targetDocId:tgtId.trim()}) });
      if (!resp.ok) throw new Error((await resp.json()).error);
      const data = await resp.json();
      setResult(data);
      toast.success('Comparación completada');
    } catch (e: unknown) { toast.danger(e instanceof Error ? e.message : 'Error'); }
    finally { setLoading(false); }
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3"><GitCompare size={24} className="text-accent-dark" /><h1 className="text-xl font-extrabold text-primary">Comparación de versiones</h1></div>
      <Card className="p-4"><div className="flex items-center gap-3">
        <input type="text" value={srcId} onChange={e=>setSrcId(e.target.value)} placeholder="Documento origen (UUID)" className="flex-1 px-3 py-2 rounded-lg border border-border-light bg-surface text-sm" />
        <ArrowRight size={16} className="text-text-muted flex-shrink-0" />
        <input type="text" value={tgtId} onChange={e=>setTgtId(e.target.value)} placeholder="Documento destino (UUID)" className="flex-1 px-3 py-2 rounded-lg border border-border-light bg-surface text-sm" />
        <Button onClick={compare} disabled={loading||!srcId.trim()||!tgtId.trim()}><RefreshCw size={14} className={cn(loading&&'animate-spin','mr-1')} />Comparar</Button>
      </div></Card>
      {loading && <Spinner label="Comparando documentos..." />}
      {result && !loading && (<>
        <Card className="p-4"><p className="font-bold mb-2">{result.summary}</p>
          <div className="grid grid-cols-3 gap-3 text-center text-sm">
            <div><p className="text-2xl font-extrabold text-green-600">{result.deterministicDiff.additions.length}</p><p className="text-text-muted">Añadidas</p></div>
            <div><p className="text-2xl font-extrabold text-red-600">{result.deterministicDiff.deletions.length}</p><p className="text-text-muted">Eliminadas</p></div>
            <div><p className="text-2xl font-extrabold text-orange-600">{result.deterministicDiff.modifications.length}</p><p className="text-text-muted">Modificadas</p></div>
          </div>
        </Card>
        {result.materialChanges.length > 0 && <Card className="p-4"><p className="font-bold mb-2">Cambios materiales</p>{result.materialChanges.map((m,i)=><div key={i} className="flex items-center gap-2 text-sm py-1"><Badge>{m.category}</Badge><span className="text-text-secondary">{m.description}</span></div>)}</Card>}
      </>)}
      {!loading && !result && <Card className="p-8 text-center"><p className="text-text-muted">Selecciona dos documentos para comparar</p></Card>}
    </div>
  );
}
