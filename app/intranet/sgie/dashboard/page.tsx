'use client';
import { useEffect, useState } from 'react';
import { BarChart3, FolderKanban, FileText, AlertTriangle, Calendar } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';

export default function DashboardPage() {
  const [data, setData] = useState<{totalCases:number;activeCases:number;pendingDocuments:number;pendingSignatures:number;overdueTasks:number;upcomingDeadlines:number;alertsActive:number;casesByPriority:Array<{priority:string;count:number}>} | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/sgie/dashboard-operativo').then(async r => {
      if (r.ok) setData(await r.json());
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3"><BarChart3 size={24} className="text-accent-dark" /><h1 className="text-xl font-extrabold text-primary">Dashboard operativo</h1></div>
      {loading && <Spinner />}
      {data && !loading && (<>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-4 text-center"><FolderKanban size={20} className="mx-auto mb-1 text-accent-dark" /><p className="text-2xl font-extrabold">{data.activeCases}</p><p className="text-xs text-text-muted">Expedientes activos</p></Card>
          <Card className="p-4 text-center"><FileText size={20} className="mx-auto mb-1 text-accent-dark" /><p className="text-2xl font-extrabold">{data.pendingDocuments}</p><p className="text-xs text-text-muted">Documentos pendientes</p></Card>
          <Card className="p-4 text-center"><AlertTriangle size={20} className="mx-auto mb-1 text-orange-500" /><p className="text-2xl font-extrabold text-orange-600">{data.overdueTasks}</p><p className="text-xs text-text-muted">Tareas vencidas</p></Card>
          <Card className="p-4 text-center"><Calendar size={20} className="mx-auto mb-1 text-accent-dark" /><p className="text-2xl font-extrabold">{data.upcomingDeadlines}</p><p className="text-xs text-text-muted">Plazos (7d)</p></Card>
        </div>
        {data.casesByPriority.length > 0 && <Card className="p-4"><p className="font-bold mb-2">Casos por prioridad</p>
          <div className="space-y-2">{data.casesByPriority.map((p,i) => (
            <div key={i} className="flex items-center gap-2"><span className="text-sm w-16">{p.priority}</span><div className="flex-1 bg-gray-200 rounded-full h-2"><div className="h-2 rounded-full bg-accent" style={{width:`${Math.min(100,(p.count/Math.max(...data.casesByPriority.map(x=>x.count)))*100)}%`}} /></div><span className="text-sm font-bold w-8 text-right">{p.count}</span></div>
          ))}</div>
        </Card>}
      </>)}
      {!loading && !data && <Card className="p-8 text-center text-text-muted">Cargando datos del dashboard...</Card>}
    </div>
  );
}
