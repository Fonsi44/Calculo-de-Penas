'use client';
import { useEffect, useState, useCallback } from 'react';
import { FileText, RefreshCw, Calendar, AlertTriangle, CheckSquare, Clock, Settings } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/ui';

export default function BriefPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [brief, setBrief] = useState<{
    summary: string; casesSummary: string;
    upcomingDeadlines: Array<{caseName:string;date:string;description:string}>;
    pendingTasks: Array<{taskTitle:string;caseName:string;dueDate:string|null}>;
    alerts: Array<{type:string;message:string}>;
  } | null>(null);
  const [recs, setRecs] = useState<Array<{type:string;title:string;description:string;priority:string;actionUrl?:string}>>([]);
  const [showPrefs, setShowPrefs] = useState(false);
  const [timezone, setTimezone] = useState('Europe/Madrid');
  const [hour, setHour] = useState(8);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await fetch('/api/sgie/brief');
      if (resp.ok) { const d = await resp.json(); setBrief(d.brief); setRecs(d.recommendations || []); }
    } catch { toast.danger('Error al cargar'); }
    finally { setLoading(false); }
  }, [toast]);

  const generate = async () => {
    setLoading(true);
    try {
      const resp = await fetch('/api/sgie/brief', { method:'POST', headers:{'Content-Type':'application/json'} });
      if (resp.ok) setBrief(await resp.json());
      toast.success('Brief generado');
    } catch { toast.danger('Error'); }
    finally { setLoading(false); }
  };

  const savePrefs = async () => {
    try {
      await fetch('/api/sgie/brief', { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({briefTimezone:timezone,briefHour:hour}) });
      toast.success('Preferencias guardadas');
      setShowPrefs(false);
    } catch { toast.danger('Error'); }
  };

  useEffect(() => {
    fetch('/api/sgie/brief').then(async r => {
      if (r.ok) {
        const d = await r.json();
        setBrief(d.brief);
        setRecs(d.recommendations || []);
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3"><FileText size={24} className="text-accent-dark" /><h1 className="text-xl font-extrabold text-primary">Brief diario</h1></div>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => setShowPrefs(!showPrefs)} variant="secondary"><Settings size={14} className="mr-1" />Preferencias</Button>
          <Button size="sm" onClick={generate} disabled={loading}><RefreshCw size={14} className={cn(loading&&'animate-spin','mr-1')} />Generar</Button>
        </div>
      </div>

      {showPrefs && <Card className="p-4 space-y-3">
        <p className="font-bold">Preferencias del brief</p>
        <div className="flex gap-3 items-center">
          <label className="text-sm">Zona horaria:</label>
          <select value={timezone} onChange={e=>setTimezone(e.target.value)} className="border rounded px-2 py-1 text-sm">
            <option value="Europe/Madrid">Europe/Madrid</option><option value="America/Tegucigalpa">America/Tegucigalpa</option>
          </select>
          <label className="text-sm">Hora:</label>
          <input type="number" value={hour} onChange={e=>setHour(Number(e.target.value))} min={0} max={23} className="border rounded px-2 py-1 text-sm w-16" />
          <Button size="sm" onClick={savePrefs}>Guardar</Button>
        </div>
      </Card>}

      {loading && <Spinner label="Cargando brief..." />}

      {brief && !loading && (<>
        <Card className="p-5"><p className="text-lg font-extrabold text-primary mb-1">{brief.summary}</p><p className="text-sm text-text-secondary">{brief.casesSummary}</p></Card>

        {brief.alerts.length > 0 && <div className="space-y-2">{brief.alerts.map((a,i) => (
          <Card key={i} className={cn('p-3 flex items-center gap-3', a.type==='warning'?'bg-orange-50 border-orange-200':'bg-blue-50 border-blue-200')}>
            <AlertTriangle size={16} className={a.type==='warning'?'text-orange-500':'text-blue-500'} />
            <span className="text-sm">{a.message}</span>
          </Card>
        ))}</div>}

        {recs.length > 0 && <Card className="p-4"><p className="font-bold mb-2">Recomendaciones</p>
          {recs.map((r,i) => (
            <div key={i} className="flex items-center gap-2 py-1.5 border-b border-border-light last:border-0">
              <Clock size={14} className={r.priority==='alta'?'text-red-500':'text-orange-500'} />
              <div><p className="text-sm font-semibold">{r.title}</p><p className="text-xs text-text-secondary">{r.description}</p></div>
            </div>
          ))}
        </Card>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {brief.upcomingDeadlines.length > 0 && <Card className="p-4"><p className="font-bold mb-2 flex items-center gap-2"><Calendar size={14} />Plazos próximos</p>
            {brief.upcomingDeadlines.map((d,i) => <div key={i} className="text-sm py-1"><strong>{d.caseName}</strong>: {d.description}</div>)}
          </Card>}
          {brief.pendingTasks.length > 0 && <Card className="p-4"><p className="font-bold mb-2 flex items-center gap-2"><CheckSquare size={14} />Tareas pendientes</p>
            {brief.pendingTasks.map((t,i) => <div key={i} className="text-sm py-1"><strong>{t.caseName}</strong>: {t.taskTitle}</div>)}
          </Card>}
        </div>
      </>)}

      {!loading && !brief && <Card className="p-8 text-center"><p className="text-text-muted">Genera tu primer brief para ver el resumen del día.</p></Card>}
    </div>
  );
}
