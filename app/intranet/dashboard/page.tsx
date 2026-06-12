'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatHondurasDate, getHondurasClock } from '@/lib/datetime';
import {
  Scale,
  Calculator,
  BookOpen,
  PlusCircle,
  ArrowRight,
  ShieldCheck,
  ClipboardList,
  Search,
  Gavel,
  FileCheck,
  AlertTriangle,
  Sparkles,
  BookMarked,
  Layers,
  TrendingUp,
  Activity,
  Zap,
  Users,
} from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArticuloAutocomplete } from '@/components/domain/articulo-autocomplete';
import { site } from '@/lib/site';
import { useAuth } from '@/app/auth-context';

interface Feature {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  desc: string;
  href: string;
  cta: string;
  tone: 'accent' | 'success' | 'info' | 'warning' | 'neutral';
  badge?: string;
}

const FEATURES: Feature[] = [
  {
    icon: Calculator,
    title: 'Calcular pena',
    desc: 'Flujo guiado de 8 pasos: delito, participación, tentativa, concurso, agravantes, atenuantes, eximentes y resultado.',
    href: '/intranet/calculadora',
    cta: 'Iniciar cálculo',
    tone: 'accent',
    badge: 'Motor v1',
  },
  {
    icon: ClipboardList,
    title: 'Mis casos',
    desc: 'Guarda, organiza y consulta tus cálculos con fecha, cliente y PDF exportable.',
    href: '/intranet/casos',
    cta: 'Ver mis casos',
    tone: 'success',
  },
  {
    icon: BookOpen,
    title: 'Biblioteca del Código Penal',
    desc: 'Consulta los artículos del CP de Honduras (Decreto 130-2017 y reformas vigentes) con búsqueda por número, epígrafe o tema.',
    href: '/intranet/cp',
    cta: 'Abrir biblioteca',
    tone: 'info',
    badge: 'Decreto 130-2017 · Reformas 59-2024',
  },
  {
    icon: FileCheck,
    title: 'Catálogo de delitos',
    desc: 'Busca, crea y edita tipos penales con sus artículos y rangos de pena asociados.',
    href: '/intranet/delitos',
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

export default function IntranetDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ total: 0, clasificaciones: 0 });
  const [now, setNow] = useState<Date | null>(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    Promise.all([
      fetch('/api/delitos/count').then((r) => r.json()),
      fetch('/api/clasificaciones').then((r) => r.json()),
    ])
      .then(([count, clas]) => {
        setStats({
          total: count.total ?? 0,
          clasificaciones: Array.isArray(clas) ? clas.length : 0,
        });
      })
      .catch((e) => console.warn('Stats error', e));
    return () => clearInterval(t);
  }, []);

  const toneClasses: Record<Feature['tone'], { bg: string; icon: string; ring: string }> = {
    accent: { bg: 'bg-accent/15', icon: 'text-primary', ring: 'ring-accent/20' },
    success: { bg: 'bg-success-bg', icon: 'text-success', ring: 'ring-success/20' },
    info: { bg: 'bg-info-bg', icon: 'text-info', ring: 'ring-info/20' },
    warning: { bg: 'bg-warning-bg', icon: 'text-warning', ring: 'ring-warning/20' },
    neutral: { bg: 'bg-surface-alt', icon: 'text-text-secondary', ring: 'ring-border-light' },
  };

  const greeting = (() => {
    const h = getHondurasClock(now ?? new Date()).hour;
    if (h < 12) return 'Buenos días';
    if (h < 18) return 'Buenas tardes';
    return 'Buenas noches';
  })();

  const dateStr = formatHondurasDate(now ?? new Date(), {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <AppShell title={site.name} subtitle="Intranet · Motor jurídico de cálculo de penas">
      <div className="p-4 max-w-3xl mx-auto w-full space-y-4">
        {/* Hero / bienvenida */}
        <Card padding="lg" className="relative overflow-hidden border-l-4 border-l-accent">
          <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-accent/8 blur-3xl pointer-events-none" />
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-primary/5 blur-2xl pointer-events-none" />
          <div className="flex items-start gap-4 relative">
            <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/20">
              <Scale size={24} className="text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                <p className="text-xxs font-bold uppercase tracking-widest text-accent-dark">
                  {greeting}
                </p>
              </div>
              <h2 className="font-extrabold text-xl text-primary leading-tight">
                Bienvenido al panel del bufete
              </h2>
              <p className="text-sm text-text-secondary mt-1.5 leading-5 capitalize">
                {dateStr} · {site.address.city}, {site.address.department}
              </p>
            </div>
            <Badge tone="success" className="hidden sm:inline-flex shadow-sm">
              <Activity size={10} className="mr-1" /> Sesión activa
            </Badge>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
            {[
              { value: stats.total, label: 'Delitos tipificados', icon: FileCheck, accent: 'border-l-accent bg-accent/5' },
              { value: '635', label: 'Artículos del CP', icon: BookOpen, accent: 'border-l-info bg-info/5' },
              { value: stats.clasificaciones, label: 'Ramas jurídicas', icon: Layers, accent: 'border-l-accent-dark bg-accent-dark/5' },
              { value: '8', label: 'Pasos del cálculo', icon: Zap, accent: 'border-l-warning bg-warning/5' },
            ].map((s, i) => (
              <div
                key={i}
                className={`relative bg-surface rounded-lg p-3 border-l-2 ${s.accent} shadow-sm hover:shadow-md transition-shadow overflow-hidden`}
              >
                <s.icon size={14} className="text-text-muted mb-1.5" aria-hidden="true" />
                <p className="text-primary font-extrabold text-xl tabular-nums leading-none">
                  {s.value}
                </p>
                <p className="text-xxs text-text-muted mt-1">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </Card>

        {/* Quick search */}
        <Card padding="lg" className="border-l-4 border-l-accent">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-md bg-accent/15 flex items-center justify-center">
              <Search size={15} className="text-accent-dark" />
            </div>
            <h2 className="font-bold text-base text-primary">Búsqueda rápida de artículos</h2>
            <Badge tone="info" size="sm">CP Honduras</Badge>
          </div>
          <p className="text-sm text-text-secondary mb-3 leading-5">
            Buscá por número (Art. 19), epígrafe (hurto) o tema (eximente).
          </p>
          <ArticuloAutocomplete />
        </Card>

        {/* Features */}
        <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-accent/15 flex items-center justify-center">
                  <TrendingUp size={12} className="text-accent-dark" />
                </div>
                <p className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                  Funcionalidades
                </p>
              </div>
              <Badge tone="accent" size="sm">4 módulos</Badge>
            </div>
            <div className="space-y-2.5">
              {FEATURES.map((f) => {
                const tone = toneClasses[f.tone];
                return (
                  <Link
                    key={f.href}
                    href={f.href}
                    className={`group flex items-center bg-surface p-4 rounded-lg border border-border-light shadow-sm hover:shadow-md hover:border-accent/30 hover:-translate-y-0.5 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 ${tone.ring}`}
                  >
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center mr-4 flex-shrink-0 ${tone.bg} transition-transform group-hover:scale-105`}
                    >
                      <f.icon size={22} className={tone.icon} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-text text-sm">{f.title}</p>
                        {f.badge && (
                          <Badge tone="accent" size="sm">{f.badge}</Badge>
                        )}
                      </div>
                      <p className="text-text-secondary text-xs leading-5 mt-1">{f.desc}</p>
                    </div>
                    <div className="flex items-center gap-1.5 ml-3 flex-shrink-0">
                      <span className="text-xs font-semibold text-accent-dark hidden sm:inline group-hover:text-primary transition-colors">
                        {f.cta}
                      </span>
                      <ArrowRight
                        size={16}
                        className="text-text-muted group-hover:translate-x-1 group-hover:text-accent-dark transition-all"
                      />
                    </div>
                  </Link>
                );
              })}
            </div>
        </div>

        {/* Rules applied */}
        <Card padding="lg">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-accent/10 rounded-full w-fit mb-3">
            <ShieldCheck size={14} className="text-accent-dark" />
            <span className="font-bold text-xs text-primary uppercase tracking-wider">
              Reglas técnicas del motor
            </span>
          </div>
          <ul className="space-y-2">
            {RULES.map((r, i) => (
              <li
                key={i}
                className="flex items-center gap-3 text-sm text-text-secondary p-2 rounded-md hover:bg-surface-alt transition-colors"
              >
                <r.icon size={16} className="text-accent-dark flex-shrink-0" />
                <span>{r.label}</span>
              </li>
            ))}
          </ul>
        </Card>

        {/* Marco normativo */}
        <Card padding="lg" className="border-l-4 border-l-info">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-md bg-info/15 flex items-center justify-center">
              <BookOpen size={15} className="text-info" />
            </div>
            <h2 className="font-bold text-base text-primary">Marco normativo</h2>
            <Badge tone="info" size="sm">Vigente</Badge>
          </div>
          <p className="text-sm text-text leading-6">
            El cálculo se basa en el <strong>Código Penal de Honduras</strong> (Decreto 130-2017,
            publicado en el Diario Oficial el 18 de enero de 2018) y sus reformas vigentes
            (Decretos 119-2019, 46-2020, 93-2021 y 59-2024).
            Los tipos penales, rangos de pena, atenuantes, agravantes y eximentes están
            codificados en el motor conforme a los artículos 1 a 635.
          </p>
          <Link
            href="/derecho-penal"
            className="inline-flex items-center gap-1.5 mt-3 text-sm font-semibold text-primary hover:text-accent-dark transition-colors"
          >
            Ver marco normativo completo <ArrowRight size={14} />
          </Link>
        </Card>

        {/* Equipo */}
        <Link
          href="/despacho"
          className="flex items-center bg-surface p-4 rounded-lg border border-border-light shadow-sm hover:shadow-md hover:border-accent/30 hover:-translate-y-0.5 transition-all duration-200 focus-visible:outline-none group"
        >
          <div className="w-11 h-11 rounded-xl bg-surface-alt flex items-center justify-center mr-4 flex-shrink-0 group-hover:bg-accent/10 transition-colors">
            <Users size={22} className="text-text-secondary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-text text-sm">El Despacho</p>
            <p className="text-text-secondary text-xs mt-0.5">
              Conoce a {site.name} y al equipo detrás del bufete
            </p>
          </div>
          <ArrowRight size={16} className="text-text-muted group-hover:translate-x-1 transition-all flex-shrink-0" />
        </Link>

        {/* Admin Panel */}
        {user?.rol === 'admin' && (
          <Link
            href="/intranet/admin"
            className="flex items-center bg-surface p-4 rounded-lg border border-accent/20 shadow-sm hover:shadow-md hover:border-accent hover:-translate-y-0.5 transition-all duration-200 focus-visible:outline-none group"
          >
            <div className="w-11 h-11 rounded-xl bg-accent/10 flex items-center justify-center mr-4 flex-shrink-0 group-hover:bg-accent/20 transition-colors">
              <ShieldCheck size={22} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-text text-sm">Panel de Administración</p>
              <p className="text-text-secondary text-xs mt-0.5">
                Gestionar usuarios, blog, FAQ y configuración del sitio
              </p>
            </div>
            <ArrowRight size={16} className="text-text-muted group-hover:translate-x-1 transition-all flex-shrink-0" />
          </Link>
        )}

        {/* Add custom delito */}
        <Link
          href="/delito-form"
          className="flex items-center bg-surface p-4 rounded-lg border border-border-light shadow-sm hover:shadow-md hover:border-border hover:-translate-y-0.5 transition-all duration-200 focus-visible:outline-none group"
        >
          <div className="w-11 h-11 rounded-xl bg-surface-alt flex items-center justify-center mr-4 flex-shrink-0 group-hover:bg-accent/10 transition-colors">
            <PlusCircle size={22} className="text-text-secondary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-text text-sm">Registrar nuevo delito</p>
            <p className="text-text-secondary text-xs mt-0.5">
              Añadir un tipo penal personalizado al catálogo
            </p>
          </div>
          <ArrowRight size={16} className="text-text-muted group-hover:translate-x-1 transition-all flex-shrink-0" />
        </Link>

        {/* Disclaimer */}
        <div className="flex gap-3 p-4 bg-warning/5 rounded-lg border border-warning/20">
          <AlertTriangle
            size={16}
            className="text-warning flex-shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <p className="text-text-secondary text-xs leading-5 italic">
            Este cálculo es <strong>orientativo y técnico</strong>. No sustituye la función
            jurisdiccional ni la valoración de pruebas que realiza el juez competente.
            Cualquier aplicación práctica debe ser supervisada por un abogado habilitado.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
