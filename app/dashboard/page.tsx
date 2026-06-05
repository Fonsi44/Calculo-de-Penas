'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Scale, Calculator, BookOpen, PlusCircle, ArrowRight, ShieldCheck, ClipboardList, Search, Gavel, FileCheck, AlertTriangle, Sparkles, BookMarked, Layers } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArticuloAutocomplete } from '@/components/domain/articulo-autocomplete';

interface Feature {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  desc: string;
  href: string;
  cta: string;
  tone: 'accent' | 'success' | 'info' | 'warning' | 'neutral';
}

const FEATURES: Feature[] = [
  {
    icon: Calculator,
    title: 'Calcular pena',
    desc: 'Flujo guiado de 8 pasos: delito, participación, tentativa, concurso, agravantes, atenuantes, eximentes y resultado.',
    href: '/calculadora',
    cta: 'Iniciar cálculo',
    tone: 'accent',
  },
  {
    icon: ClipboardList,
    title: 'Mis casos',
    desc: 'Guarda, organiza y consulta tus cálculos con fecha, cliente y PDF exportable.',
    href: '/casos',
    cta: 'Ver mis casos',
    tone: 'success',
  },
  {
    icon: BookOpen,
    title: 'Biblioteca del Código Penal',
    desc: 'Consulta los 635 artículos del CP de Honduras (Decreto 130-2017) con búsqueda por número, epígrafe o tema.',
    href: '/cp',
    cta: 'Abrir biblioteca',
    tone: 'info',
  },
  {
    icon: FileCheck,
    title: 'Catálogo de delitos',
    desc: 'Busca, crea y edita tipos penales con sus artículos y rangos de pena asociados.',
    href: '/delitos',
    cta: 'Explorar catálogo',
    tone: 'neutral',
  },
];

const RULES = [
  { icon: Gavel, label: 'Concurso real, ideal y continuado' },
  { icon: Layers, label: 'Mitad superior e inferior' },
  { icon: Sparkles, label: 'Agravantes y atenuantes' },
  { icon: ShieldCheck, label: 'Eximentes completas e incompletas' },
  { icon: BookMarked, label: 'Tentativa y complicidad' },
];

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

  const toneClasses: Record<Feature['tone'], { bg: string; icon: string }> = {
    accent: { bg: 'bg-accent/15', icon: 'text-primary' },
    success: { bg: 'bg-success-bg', icon: 'text-success' },
    info: { bg: 'bg-info-bg', icon: 'text-info' },
    warning: { bg: 'bg-warning-bg', icon: 'text-warning' },
    neutral: { bg: 'bg-surface-alt', icon: 'text-text-secondary' },
  };

  return (
    <AppShell title="LEX HONDURAS" subtitle="Motor jurídico de cálculo de penas">
      <div className="p-3 max-w-3xl mx-auto w-full space-y-3">
        {/* Hero / intro */}
        <Card padding="md" className="border-l-4 border-l-accent">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-md bg-primary flex items-center justify-center flex-shrink-0">
              <Scale size={22} className="text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-extrabold text-base text-primary leading-tight">
                Determine la pena con precisión técnica
              </h2>
              <p className="text-xs text-text-secondary mt-1 leading-5">
                LEX HONDURAS es un motor jurídico que aplica las reglas técnicas del Código Penal
                de Honduras (Decreto 130-2017) para calcular la pena aplicable a uno o varios hechos
                delictivos, considerando participación, tentativa, concurso de delitos, agravantes,
                atenuantes y eximentes.
              </p>
            </div>
          </div>

          <div className="flex gap-1.5 mt-3">
            {[
              { value: stats.total, label: 'Delitos' },
              { value: '635', label: 'Arts. CP' },
              { value: stats.clasificaciones, label: 'Ramas' },
              { value: '8', label: 'Pasos' },
            ].map((s, i) => (
              <div key={i} className="flex-1 bg-surface-alt rounded-md p-2 text-center">
                <p className="text-primary font-extrabold text-lg tabular-nums">{s.value}</p>
                <p className="text-[10px] text-text-muted uppercase tracking-wider mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Quick search */}
        <Card padding="md" className="border-l-4 border-l-accent">
          <div className="flex items-center gap-2 mb-2">
            <Search size={14} className="text-accent" />
            <h2 className="font-bold text-sm text-primary">Búsqueda rápida de artículos</h2>
            <Badge tone="info">635 arts.</Badge>
          </div>
          <p className="text-[11px] text-text-secondary mb-2 leading-4">
            Buscá por número (Art. 19), epígrafe (hurto) o tema (eximente).
          </p>
          <ArticuloAutocomplete />
        </Card>

        {/* Features */}
        <div>
          <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-2 px-1">
            Funcionalidades
          </p>
          <div className="space-y-2">
            {FEATURES.map((f) => {
              const tone = toneClasses[f.tone];
              return (
                <Link
                  key={f.href}
                  href={f.href}
                  className="flex items-center bg-surface p-3 rounded-md border border-border-light shadow-sm hover:shadow-md transition-shadow focus-visible:outline-none"
                >
                  <div className={`w-11 h-11 rounded-md flex items-center justify-center mr-3 flex-shrink-0 ${tone.bg}`}>
                    <f.icon size={20} className={tone.icon} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-text text-sm">{f.title}</p>
                    <p className="text-text-secondary text-[11px] leading-4">{f.desc}</p>
                  </div>
                  <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                    <span className="text-[11px] font-semibold text-accent-dark hidden sm:inline">{f.cta}</span>
                    <ArrowRight size={16} className="text-text-muted" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Rules applied */}
        <Card padding="md">
          <div className="flex items-center gap-1 px-2 py-0.5 bg-primary/10 rounded-full w-fit mb-2">
            <ShieldCheck size={12} className="text-accent-dark" />
            <span className="font-bold text-[11px] text-primary uppercase tracking-wider">
              Reglas técnicas que aplica el motor
            </span>
          </div>
          <ul className="space-y-1.5">
            {RULES.map((r, i) => (
              <li key={i} className="flex items-center gap-2 text-xs text-text-secondary">
                <r.icon size={14} className="text-accent-dark flex-shrink-0" />
                <span>{r.label}</span>
              </li>
            ))}
          </ul>
        </Card>

        {/* Legal framework */}
        <Card padding="md" className="border-l-4 border-l-info">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen size={14} className="text-info" />
            <h2 className="font-bold text-sm text-primary">Marco normativo</h2>
          </div>
          <p className="text-xs text-text leading-5">
            El cálculo se basa en el <strong>Código Penal de Honduras</strong> (Decreto 130-2017,
            publicado en el Diario Oficial el 18 de enero de 2018), con sus reformas vigentes.
            Los tipos penales, rangos de pena, atenuantes, agravantes y eximentes están
            codificados en el motor conforme a los artículos 1 a 635.
          </p>
        </Card>

        {/* Add custom delito */}
        <Link
          href="/delito-form"
          className="flex items-center bg-surface p-3 rounded-md border border-border-light shadow-sm hover:shadow-md transition-shadow focus-visible:outline-none"
        >
          <div className="w-10 h-10 rounded-md bg-surface-alt flex items-center justify-center mr-3 flex-shrink-0">
            <PlusCircle size={20} className="text-text-secondary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-text text-sm">Registrar nuevo delito</p>
            <p className="text-text-secondary text-[11px]">Añadir un tipo penal personalizado al catálogo</p>
          </div>
          <ArrowRight size={16} className="text-text-muted flex-shrink-0" />
        </Link>

        {/* Disclaimer */}
        <div className="flex gap-2 p-3 bg-warning-bg rounded-md border border-warning/30">
          <AlertTriangle size={14} className="text-text-secondary flex-shrink-0 mt-0.5" />
          <p className="text-text-secondary text-[11px] leading-4 italic">
            Este cálculo es <strong>orientativo y técnico</strong>. No sustituye la función
            jurisdiccional ni la valoración de pruebas que realiza el juez competente.
            Cualquier aplicación práctica debe ser supervisada por un abogado habilitado.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
