'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Gavel, Calendar, Trash2, Calculator, FileText, ArrowRight } from 'lucide-react';
import { useAuth } from '../../auth-context';

interface Calculo {
  id: string;
  config: any;
  resultado: any;
  creadoEn: string;
}

interface Caso {
  id: string;
  titulo: string;
  cliente: string | null;
  estado: string;
  creadoEn: string;
  calculos: Calculo[];
}

export default function CasoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [caso, setCaso] = useState<Caso | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editTitulo, setEditTitulo] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/login'); return; }
    if (!params?.id) return;

    fetch(`/api/casos/${params.id}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        setCaso(data);
        setEditTitulo(data.titulo);
      })
      .catch(() => router.push('/casos'))
      .finally(() => setLoading(false));
  }, [params?.id, user, authLoading, router]);

  const updateCaso = async () => {
    if (!editTitulo.trim() || !caso) return;
    await fetch(`/api/casos/${caso.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titulo: editTitulo }),
    });
    setCaso({ ...caso, titulo: editTitulo });
    setEditing(false);
  };

  if (authLoading || loading) {
    return (
      <div className="flex flex-1 items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!caso) {
    return (
      <div className="flex flex-1 items-center justify-center bg-background">
        <p className="text-text-muted text-sm">Caso no encontrado</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 bg-background">
      <div className="bg-primary px-3 py-2">
        <div className="flex items-center">
          <Link href="/casos" className="w-8 h-8 rounded-md bg-white/10 flex items-center justify-center mr-2 hover:bg-white/20 transition-colors">
            <ChevronLeft size={20} className="text-white" />
          </Link>
          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="flex gap-1">
                <input
                  className="flex-1 text-sm text-white bg-white/20 rounded px-2 py-1 outline-none"
                  value={editTitulo}
                  onChange={e => setEditTitulo(e.target.value)}
                  autoFocus
                />
                <button onClick={updateCaso} className="text-[10px] bg-accent text-primary px-2 rounded font-bold">OK</button>
                <button onClick={() => setEditing(false)} className="text-[10px] bg-white/20 text-white px-2 rounded">X</button>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <h1 className="text-white font-bold text-sm truncate">{caso.titulo}</h1>
                <button onClick={() => setEditing(true)} className="text-[10px] text-accent underline flex-shrink-0">editar</button>
              </div>
            )}
            <p className="text-[#C9D1DD] text-[10px]">
              {caso.cliente && `Cliente: ${caso.cliente} · `}
              {caso.calculos.length} cálculo{caso.calculos.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <div className="max-w-2xl mx-auto">
          {caso.calculos.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-text-muted">
              <Calculator size={48} className="mb-2 opacity-50" />
              <p className="font-bold text-base text-text">Sin cálculos</p>
              <p className="text-sm mb-4">Realiza un cálculo desde la calculadora y guárdalo en este caso.</p>
              <Link
                href="/calculadora"
                className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-light transition-colors"
              >
                Ir a la calculadora
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {caso.calculos.map(calc => (
                <div key={calc.id} className="bg-surface border border-border-light rounded-lg p-3 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Gavel size={14} className="text-accent" />
                    <p className="font-bold text-sm text-text flex-1">
                      {calc.resultado?.pena_principal || 'Cálculo'}
                    </p>
                    <span className="text-[10px] text-text-muted">
                      {new Date(calc.creadoEn).toLocaleDateString('es-ES')}
                    </span>
                  </div>
                  <div className="text-xs text-text-muted leading-4 line-clamp-3">
                    {calc.resultado?.analisis_juridico?.split('\n').slice(0, 5).join(' · ')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="sticky bottom-0 bg-surface border-t border-border-light px-3 py-2">
        <Link
          href="/calculadora"
          className="flex items-center justify-center gap-2 py-2.5 rounded-md bg-primary text-white font-bold text-sm hover:bg-primary-light transition-colors"
        >
          <Calculator size={16} />
          Nuevo cálculo
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
