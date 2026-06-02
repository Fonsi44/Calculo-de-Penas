'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, ChevronLeft, FileText, Gavel, Calendar, ArrowRight, ClipboardList } from 'lucide-react';
import { useAuth } from '../auth-context';

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
  };

  if (authLoading || loading) {
    return (
      <div className="flex flex-1 items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 bg-background">
      <div className="flex items-center bg-primary px-3 py-2">
        <Link href="/" className="w-8 h-8 rounded-md bg-white/10 flex items-center justify-center mr-2 hover:bg-white/20 transition-colors">
          <ChevronLeft size={20} className="text-white" />
        </Link>
        <div className="flex-1">
          <h1 className="text-white font-bold text-sm">Mis casos</h1>
          <p className="text-[#C9D1DD] text-[10px]">{casos.length} caso{casos.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setShowNewForm(true)}
          className="w-8 h-8 rounded-md bg-accent flex items-center justify-center hover:bg-accent-light transition-colors"
        >
          <Plus size={20} className="text-primary" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {showNewForm && (
          <div className="bg-surface border border-accent/30 rounded-lg p-3 mb-3 shadow-md">
            <h2 className="font-bold text-sm text-text mb-3">Nuevo caso</h2>
            <input
              className="w-full border border-border rounded-lg px-3 py-2 text-sm text-text bg-surface-alt outline-none focus:border-accent mb-2"
              placeholder="Título del caso *"
              value={newTitulo}
              onChange={e => setNewTitulo(e.target.value)}
              autoFocus
            />
            <input
              className="w-full border border-border rounded-lg px-3 py-2 text-sm text-text bg-surface-alt outline-none focus:border-accent mb-3"
              placeholder="Nombre del cliente (opcional)"
              value={newCliente}
              onChange={e => setNewCliente(e.target.value)}
            />
            <div className="flex gap-2">
              <button onClick={() => setShowNewForm(false)} className="flex-1 py-2 rounded-md border border-border text-sm font-semibold text-text-secondary hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button onClick={createCaso} disabled={!newTitulo.trim()} className="flex-1 py-2 rounded-md bg-primary text-white text-sm font-bold hover:bg-primary-light transition-colors disabled:opacity-50">
                Crear caso
              </button>
            </div>
          </div>
        )}

        {casos.length === 0 && !showNewForm ? (
          <div className="flex flex-col items-center py-16 text-text-muted">
            <ClipboardList size={56} className="mb-2 opacity-50" />
            <p className="font-bold text-base text-text">Sin casos todavía</p>
            <p className="text-sm mb-4">Crea tu primer caso para guardar cálculos.</p>
            <button onClick={() => setShowNewForm(true)} className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-light transition-colors">
              Crear primer caso
            </button>
          </div>
        ) : (
          <div className="space-y-2 max-w-2xl mx-auto">
            {casos.map(c => (
              <Link
                key={c.id}
                href={`/casos/${c.id}`}
                className="block bg-surface border border-border-light rounded-lg p-3 hover:shadow-md transition-shadow"
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
                <div className="flex items-center gap-3 mt-1.5 text-[10px] text-text-muted">
                  <span className={`px-1.5 py-0.5 rounded-full font-semibold ${
                    c.estado === 'completado' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                  }`}>
                    {c.estado}
                  </span>
                  <span className="flex items-center gap-1">
                    <Gavel size={10} />
                    {c.totalCalculos} cálculo{c.totalCalculos !== 1 ? 's' : ''}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar size={10} />
                    {new Date(c.creadoEn).toLocaleDateString('es-ES')}
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
