'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Scale, Calculator, BookOpen, PlusCircle, ChevronRight, ArrowRight, ShieldCheck, Info, FileText, ClipboardList } from 'lucide-react';

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
      <div className="bg-primary px-4 pt-3 pb-5 rounded-b-xl shadow-lg relative overflow-hidden">
        <div className="absolute top-0 -right-5 w-48 h-48 rounded-full bg-primary-light/40" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-9 h-9 rounded-md bg-accent/20 border border-accent/40 flex items-center justify-center">
              <Scale size={18} className="text-accent" />
            </div>
            <div className="min-w-0">
              <h1 className="text-accent text-xs font-extrabold tracking-widest truncate">LEX HONDURAS</h1>
              <p className="text-[#D5DDEA] text-[10px]">Motor juridico de calculo de penas</p>
            </div>
          </div>

          <h2 className="text-white font-extrabold text-xl leading-6 mb-1">
            Determine la pena con precision tecnica
          </h2>
          <p className="text-[#C9D1DD] text-xs mb-2">
            Codigo Penal de Honduras (Decreto 130-2017)
          </p>

          <div className="flex gap-1.5 mt-1">
            {[
              { value: stats.total, label: 'Delitos' },
              { value: stats.clasificaciones, label: 'Clasificaciones' },
              { value: 8, label: 'Pasos' },
            ].map((s, i) => (
              <div key={i} className="flex-1 bg-white/10 border border-white/15 rounded-md p-2 text-center">
                <p className="text-accent font-extrabold text-xl">{s.value}</p>
                <p className="text-[#C9D1DD] text-[10px] uppercase tracking-wider mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-3 max-w-2xl mx-auto w-full">
        <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">Acciones principales</p>

        {/* Primary action */}
        <Link
          href="/calculadora"
          className="flex items-center bg-surface p-3 rounded-lg border-l-4 border-l-accent shadow-md mb-2.5 hover:shadow-lg transition-shadow"
        >
          <div className="w-11 h-11 rounded-md bg-accent/15 flex items-center justify-center mr-2.5 flex-shrink-0">
            <Calculator size={22} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-text text-sm">Calcular pena</p>
            <p className="text-text-secondary text-[11px]">Flujo guiado de 8 pasos · concurso, agravantes, atenuantes</p>
          </div>
          <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center ml-2 flex-shrink-0">
            <ArrowRight size={16} className="text-white" />
          </div>
        </Link>

        {/* Secondary actions */}
        {[
          { title: 'Mis casos', desc: 'Gestiona tus casos y cálculos guardados', icon: ClipboardList, href: '/casos' },
          { title: 'Catalogo de delitos', desc: 'Buscar, crear, editar y eliminar tipos penales', icon: BookOpen, href: '/delitos' },
          { title: 'Codigo Penal completo', desc: 'Biblioteca de articulos del CP hondureno (Decreto 130-2017)', icon: Scale, href: '/cp' },
          { title: 'Registrar nuevo delito', desc: 'Anadir un tipo penal personalizado al catalogo', icon: PlusCircle, href: '/delito-form' },
        ].map((item, i) => (
          <Link
            key={i}
            href={item.href}
            className="flex items-center bg-surface p-2.5 rounded-lg border border-border-light shadow-sm mb-2 hover:shadow-md transition-shadow"
          >
            <div className={`w-10 h-10 rounded-md flex items-center justify-center mr-2.5 flex-shrink-0 ${i === 0 ? 'bg-accent/15' : 'bg-success/15'}`}>
              <item.icon size={20} className={i === 0 ? 'text-accent' : 'text-success'} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-text text-sm">{item.title}</p>
              <p className="text-text-secondary text-[11px]">{item.desc}</p>
            </div>
            <ChevronRight size={18} className="text-text-muted flex-shrink-0" />
          </Link>
        ))}

        {/* Info panel */}
        <div className="bg-surface rounded-lg p-3 mt-2.5 border border-border-light shadow-sm">
          <div className="flex items-center gap-1 px-2 py-0.5 bg-primary/5 rounded-full w-fit mb-1.5">
            <ShieldCheck size={12} className="text-accent" />
            <span className="font-bold text-[9px] text-primary uppercase tracking-wider">Marco normativo</span>
          </div>
          <p className="font-bold text-text text-sm">Codigo Penal de Honduras</p>
          <p className="text-text-secondary text-xs leading-4 mt-1">
            Aplica reglas tecnicas: reduccion por complicidad y tentativa, mitad superior por
            agravantes, mitad inferior por atenuantes, eximentes completas e incompletas, y
             concursos real, ideal y continuado.
          </p>
        </div>

        {/* Disclaimer */}
        <div className="flex gap-2 p-2.5 mt-2.5 bg-warning/10 rounded-md border border-warning/30">
          <Info size={14} className="text-text-muted flex-shrink-0 mt-0.5" />
          <p className="text-text-secondary text-[10px] leading-3.5 italic">
            Este calculo es orientativo y no sustituye la funcion jurisdiccional.
          </p>
        </div>
      </div>
    </div>
  );
}
