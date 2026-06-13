'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, FileText, Gavel, Calendar, ArrowRight, Briefcase, ClipboardList } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';
import { CenteredSpinner } from '@/components/ui/spinner';
import { PageHeader } from '@/components/ui/page-header';
import { formatFechaCorta, pluralizar } from '@/lib/ui';

interface Caso { id: string; titulo: string; cliente: string | null; estado: string; creadoEn: string; totalCalculos: number; }

export default function AdminCasosPage() {
  const [casos, setCasos] = useState<Caso[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newTitulo, setNewTitulo] = useState('');
  const [newCliente, setNewCliente] = useState('');

  useEffect(() => {
    fetch('/api/casos')
      .then(r => r.json())
      .then(data => setCasos(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const createCaso = async () => {
    if (!newTitulo.trim()) return;
    try {
      const res = await fetch('/api/casos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ titulo: newTitulo, cliente: newCliente }) });
      const data = await res.json();
      setCasos(prev => [data, ...prev]);
      setShowNewForm(false); setNewTitulo(''); setNewCliente('');
    } catch {}
  };

  if (loading) return <CenteredSpinner label="Cargando casos..." />;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Mis casos"
        subtitle={pluralizar(casos.length, 'caso', 'casos')}
        icon={<ClipboardList size={18} className="text-accent" />}
        actions={<Button variant="primary" size="sm" onClick={() => setShowNewForm(true)}><Plus size={14} /> Nuevo caso</Button>}
      />

      {showNewForm && (
        <Card padding="md" tone="accent">
          <h2 className="font-bold text-sm text-text mb-3">Nuevo caso</h2>
          <Input placeholder="Título del caso *" value={newTitulo} onChange={e => setNewTitulo(e.target.value)} autoFocus className="mb-2" />
          <Input placeholder="Nombre del cliente (opcional)" value={newCliente} onChange={e => setNewCliente(e.target.value)} className="mb-3" />
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setShowNewForm(false)}>Cancelar</Button>
            <Button variant="primary" disabled={!newTitulo.trim()} onClick={createCaso}>Crear caso</Button>
          </div>
        </Card>
      )}

      {casos.length === 0 && !showNewForm ? (
        <EmptyState icon={<Briefcase size={48} />} title="Sin casos todavía" description="Crea tu primer caso para guardar cálculos y construir tu expediente."
          action={<Button variant="primary" onClick={() => setShowNewForm(true)}><Plus size={16} /> Crear primer caso</Button>} />
      ) : (
        <div className="space-y-2 max-w-2xl">
          {casos.map(c => (
            <Link key={c.id} href={`/intranet/admin/casos/${c.id}`}
              className="block bg-surface border border-border rounded-md p-3 hover:shadow-md transition-shadow focus-visible:outline-none">
              <div className="flex items-start gap-2 mb-1">
                <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <FileText size={16} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-text truncate">{c.titulo}</p>
                  {c.cliente && <p className="text-xxs text-text-muted">Cliente: {c.cliente}</p>}
                </div>
                <ArrowRight size={16} className="text-text-muted flex-shrink-0 mt-1" />
              </div>
              <div className="flex items-center gap-3 mt-2 text-xxs text-text-muted">
                <Badge tone={c.estado === 'completado' ? 'mitigation' : 'warning'}>{c.estado}</Badge>
                <span className="flex items-center gap-1"><Gavel size={11} />{pluralizar(c.totalCalculos, 'cálculo', 'cálculos')}</span>
                <span className="flex items-center gap-1"><Calendar size={11} />{formatFechaCorta(c.creadoEn)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}