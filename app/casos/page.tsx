'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, ChevronLeft, FileText, Gavel, Calendar, ArrowRight, Briefcase } from 'lucide-react';
import { useAuth } from '../auth-context';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';
import { CenteredSpinner } from '@/components/ui/spinner';
import { formatFechaCorta, pluralizar } from '@/lib/ui';

interface Caso {
  id: string;
  titulo: string;
  cliente: string | null;
  estado: string;
  creadoEn: string;
  totalCalculos: number;
}

export default function CasosPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [casos, setCasos] = useState<Caso[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newTitulo, setNewTitulo] = useState('');
  const [newCliente, setNewCliente] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/login'); return; }
    fetch('/api/casos')
      .then(r => r.json())
      .then(data => setCasos(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, authLoading, router]);

  const createCaso = async () => {
    if (!newTitulo.trim()) return;
    try {
      const res = await fetch('/api/casos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titulo: newTitulo, cliente: newCliente }),
      });
      const data = await res.json();
      setCasos(prev => [data, ...prev]);
      setShowNewForm(false);
      setNewTitulo('');
      setNewCliente('');
    } catch {
      // noop
    }
  };

  if (authLoading || loading) return <CenteredSpinner label="Cargando casos..." />;

  return (
    <div className="flex flex-col flex-1 bg-background">
      <div className="flex items-center bg-primary px-3 py-2 no-print">
        <Link href="/" aria-label="Volver al inicio" className="w-9 h-9 rounded-md bg-white/15 flex items-center justify-center mr-2 hover:bg-white/25">
          <ChevronLeft size={18} className="text-text-inverse" />
        </Link>
        <div className="flex-1">
          <h1 className="text-text-inverse font-bold text-sm">Mis casos</h1>
          <p className="text-[11px] text-text-inverse/70">{pluralizar(casos.length, 'caso', 'casos')}</p>
        </div>
        <IconButton label="Crear nuevo caso" variant="solid" onClick={() => setShowNewForm(true)}>
          <Plus size={18} />
        </IconButton>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {showNewForm && (
          <Card padding="md" tone="accent" className="mb-3">
            <h2 className="font-bold text-sm text-text mb-3">Nuevo caso</h2>
            <Input
              placeholder="Título del caso *"
              value={newTitulo}
              onChange={e => setNewTitulo(e.target.value)}
              autoFocus
              className="mb-2"
            />
            <Input
              placeholder="Nombre del cliente (opcional)"
              value={newCliente}
              onChange={e => setNewCliente(e.target.value)}
              className="mb-3"
            />
            <div className="flex gap-2">
              <Button variant="secondary" fullWidth onClick={() => setShowNewForm(false)}>
                Cancelar
              </Button>
              <Button variant="primary" fullWidth disabled={!newTitulo.trim()} onClick={createCaso}>
                Crear caso
              </Button>
            </div>
          </Card>
        )}

        {casos.length === 0 && !showNewForm ? (
          <EmptyState
            icon={<Briefcase size={48} />}
            title="Sin casos todavía"
            description="Crea tu primer caso para guardar cálculos y construir tu expediente."
            action={
              <Button variant="primary" iconLeft={<Plus size={16} />} onClick={() => setShowNewForm(true)}>
                Crear primer caso
              </Button>
            }
          />
        ) : (
          <div className="space-y-2 max-w-2xl mx-auto">
            {casos.map(c => (
              <Link
                key={c.id}
                href={`/casos/${c.id}`}
                className="block bg-surface border border-border-light rounded-md p-3 hover:shadow-md transition-shadow focus-visible:outline-none"
              >
                <div className="flex items-start gap-2 mb-1">
                  <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <FileText size={16} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-text truncate">{c.titulo}</p>
                    {c.cliente && <p className="text-[11px] text-text-muted">Cliente: {c.cliente}</p>}
                  </div>
                  <ArrowRight size={16} className="text-text-muted flex-shrink-0 mt-1" />
                </div>
                <div className="flex items-center gap-3 mt-2 text-[11px] text-text-muted">
                  <Badge tone={c.estado === 'completado' ? 'mitigation' : 'warning'}>{c.estado}</Badge>
                  <span className="flex items-center gap-1">
                    <Gavel size={11} />
                    {pluralizar(c.totalCalculos, 'cálculo', 'cálculos')}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar size={11} />
                    {formatFechaCorta(c.creadoEn)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
