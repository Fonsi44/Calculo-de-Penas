'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Scale, Calculator, BookOpen, PlusCircle, ArrowRight, ShieldCheck, Info, ClipboardList, Search } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArticuloAutocomplete } from '@/components/domain/articulo-autocomplete';

export default function Home() {
  const [stats, setStats] = useState({ total: 0, clasificaciones: 0 });

  useEffect(() => {
    Promise.all([
      fetch('/api/delitos/count').then(r => r.json()),
      fetch('/api/clasificaciones').then(r => r.json()),
    ])
      .then(([count, clas]) => {
        setStats({
          total: count.total ?? 0,
          clasificaciones: Array.isArray(clas) ? clas.length : 0,
        });
      })
      .catch(e => console.warn('Stats error', e));
  }, []);

  return (
    <div className="flex flex-col flex-1 bg-background">
      {/* Hero */}
      <div className="bg-primary px-4 pt-4 pb-6 rounded-b-xl shadow-lg relative overflow-hidden">
        <div className="absolute top-0 -right-5 w-48 h-48 rounded-full bg-primary-light/40" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-md bg-accent/20 border border-accent/40 flex items-center justify-center">
              <Scale size={20} className="text-accent" />
            </div>
            <div className="min-w-0">
              <h1 className="text-accent text-xs font-extrabold tracking-widest truncate">LEX HONDURAS</h1>
              <p className="text-[11px] text-text-inverse/70">Motor jurídico de cálculo de penas</p>
            </div>
          </div>

          <h2 className="text-text-inverse font-extrabold text-2xl leading-7 mb-1">
            Determine la pena con precisión técnica
          </h2>
          <p className="text-[11px] text-text-inverse/70">
            Código Penal de Honduras (Decreto 130-2017)
          </p>

          <div className="flex gap-1.5 mt-3">
            {[
              { value: stats.total, label: 'Delitos' },
              { value: stats.clasificaciones, label: 'Clasificaciones' },
              { value: 8, label: 'Pasos' },
            ].map((s, i) => (
              <div key={i} className="flex-1 bg-white/10 border border-white/15 rounded-md p-2 text-center">
                <p className="text-accent font-extrabold text-2xl tabular-nums">{s.value}</p>
                <p className="text-[11px] text-text-inverse/70 uppercase tracking-wider mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-3 max-w-2xl mx-auto w-full">
        <Card padding="md" className="mb-3 border-l-4 border-l-accent">
          <div className="flex items-center gap-2 mb-2">
            <Search size={14} className="text-accent" />
            <h2 className="font-bold text-sm text-primary">Búsqueda rápida de artículos</h2>
            <Badge tone="info">{stats.total > 0 ? '635' : '...'} arts.</Badge>
          </div>
          <p className="text-[11px] text-text-secondary mb-2 leading-4">
            Buscá por número (Art. 19), epígrafe (hurto) o tema (eximente).
          </p>
          <ArticuloAutocomplete />
        </Card>

        <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-2">Acciones principales</p>

        {/* Primary action */}
        <Link
          href="/calculadora"
          className="flex items-center bg-surface p-3 rounded-md border-l-4 border-l-accent shadow-sm mb-3 hover:shadow-md transition-shadow focus-visible:outline-none"
        >
          <div className="w-11 h-11 rounded-md bg-accent/15 flex items-center justify-center mr-3 flex-shrink-0">
            <Calculator size={22} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-text text-sm">Calcular pena</p>
            <p className="text-text-secondary text-[11px]">Flujo guiado de 8 pasos · concurso, agravantes, atenuantes</p>
          </div>
          <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center ml-2 flex-shrink-0">
            <ArrowRight size={16} className="text-text-inverse" />
          </div>
        </Link>

        {/* Secondary actions */}
        {[
          { title: 'Mis casos', desc: 'Gestiona tus casos y cálculos guardados', icon: ClipboardList, href: '/casos', tone: 'accent' as const },
          { title: 'Catálogo de delitos', desc: 'Buscar, crear, editar y eliminar tipos penales', icon: BookOpen, href: '/delitos', tone: 'success' as const },
          { title: 'Código Penal completo', desc: 'Biblioteca de artículos del CP hondureño (Decreto 130-2017)', icon: Scale, href: '/cp', tone: 'info' as const },
          { title: 'Registrar nuevo delito', desc: 'Añadir un tipo penal personalizado al catálogo', icon: PlusCircle, href: '/delito-form', tone: 'neutral' as const },
        ].map((item, i) => (
          <Link
            key={i}
            href={item.href}
            className="flex items-center bg-surface p-3 rounded-md border border-border-light shadow-sm mb-2 hover:shadow-md transition-shadow focus-visible:outline-none"
          >
            <div className={`w-10 h-10 rounded-md flex items-center justify-center mr-3 flex-shrink-0 ${
              item.tone === 'accent' ? 'bg-accent/15' :
              item.tone === 'success' ? 'bg-success-bg' :
              item.tone === 'info' ? 'bg-info-bg' : 'bg-surface-alt'
            }`}>
              <item.icon size={20} className={
                item.tone === 'accent' ? 'text-accent-dark' :
                item.tone === 'success' ? 'text-success' :
                item.tone === 'info' ? 'text-info' : 'text-text-secondary'
              } />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-text text-sm">{item.title}</p>
              <p className="text-text-secondary text-[11px]">{item.desc}</p>
            </div>
            <ArrowRight size={16} className="text-text-muted flex-shrink-0" />
          </Link>
        ))}

        {/* Info panel */}
        <Card padding="md" className="mt-3">
          <div className="flex items-center gap-1 px-2 py-0.5 bg-primary/10 rounded-full w-fit mb-2">
            <ShieldCheck size={12} className="text-accent-dark" />
            <span className="font-bold text-[11px] text-primary uppercase tracking-wider">Marco normativo</span>
          </div>
          <p className="font-bold text-text text-sm mb-1">Código Penal de Honduras</p>
          <p className="text-text-secondary text-xs leading-5">
            Aplica reglas técnicas: reducción por complicidad y tentativa, mitad superior por
            agravantes, mitad inferior por atenuantes, eximentes completas e incompletas, y
            concursos real, ideal y continuado.
          </p>
        </Card>

        {/* Disclaimer */}
        <div className="flex gap-2 p-3 mt-3 bg-warning-bg rounded-md border border-warning/30">
          <Info size={14} className="text-text-secondary flex-shrink-0 mt-0.5" />
          <p className="text-text-secondary text-[11px] leading-4 italic">
            Este cálculo es orientativo y no sustituye la función jurisdiccional.
          </p>
        </div>
      </div>
    </div>
  );
}
