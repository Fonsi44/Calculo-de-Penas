'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatHondurasDate, getHondurasClock } from '@/lib/datetime';
import {
  Scale,
  Calculator,
  BookOpen,
  ArrowRight,
  FilePlus,
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
  {
    icon: FilePlus,
    title: 'Registrar nuevo delito',
    desc: 'Añadir un tipo penal personalizado al catálogo de delitos.',
    href: '/delito-form',
    cta: 'Añadir delito',
    tone: 'accent',
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
      <div className="p-3 max-w-3xl mx-auto w-full space-y-3">
        {/* Hero / bienvenida */}
        <Card padding="md" className="relative overflow-hidden border-l-4 border-l-accent">
          <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-accent/10 blur-2xl pointer-events-none" />
          <div className="flex items-start gap-3 relative">
            <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center flex-shrink-0 shadow-md">
              <Scale size={22} className="text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xxs font-bold uppercase tracking-widest text-accent-dark">
                {greeting}
              </p>
              <h2 className="font-extrabold text-lg text-primary leading-tight mt-0.5">
                Bienvenido al panel del bufete
              </h2>
              <p className="text-xs text-text-secondary mt-1 leading-5 capitalize">
                {dateStr} · {site.address.city}, {site.address.department}
              </p>
            </div>
            <Badge tone="success" className="hidden sm:inline-flex">
              <Activity size={10} className="mr-1" /> Sesión activa
            </Badge>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
            {[
              { value: stats.total, label: 'Delitos', icon: FileCheck, tone: 'text-primary' },
              { value: '635', label: 'Arts. CP', icon: BookOpen, tone: 'text-info' },
              { value: stats.clasificaciones, label: 'Ramas', icon: Layers, tone: 'text-accent-dark' },
              { value: '8', label: 'Pasos', icon: Zap, tone: 'text-aggravation' },
            ].map((s, i) => (
              <div
                key={i}
                className="relative bg-surface-alt rounded-md p-2.5 text-center overflow-hidden"
              >
                <s.icon size={14} className={`mx-auto mb-1 ${s.tone}`} aria-hidden="true" />
                <p className="text-primary font-extrabold text-lg tabular-nums leading-none">
                  {s.value}
                </p>
                <p className="text-xxs text-text-muted uppercase tracking-wider mt-1">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </Card>

        {/* Quick search */}
        <Card padding="md" className="border-l-4 border-l-accent">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-md bg-accent/15 flex items-center justify-center">
              <Search size={14} className="text-accent-dark" />
            </div>
            <h2 className="font-bold text-sm text-primary">Búsqueda rápida de artículos</h2>
            <Badge tone="info">CP Honduras</Badge>
          </div>
          <p className="text-xxs text-text-secondary mb-2 leading-4">
            Buscá por número (Art. 19), epígrafe (hurto) o tema (eximente).
          </p>
          <ArticuloAutocomplete />
        </Card>

        {/* Features */}
        <div>
          <div className="flex items-center justify-between mb-2 px-1">
            <p className="text-xxs font-bold text-text-muted uppercase tracking-wider">
              Funcionalidades
            </p>
            <p className="text-xxs text-text-muted inline-flex items-center gap-1">
              <TrendingUp size={10} /> 4 módulos activos
            </p>
          </div>
          <div className="space-y-2">
            {FEATURES.map((f) => {
              const tone = toneClasses[f.tone];
              return (
                <Link
                  key={f.href}
                  href={f.href}
                  className={`group flex items-center bg-surface p-3 rounded-md border border-border-light shadow-sm hover:shadow-md hover:border-accent/50 transition-all focus-visible:outline-none focus-visible:ring-2 ${tone.ring}`}
                >
                  <div
                    className={`w-11 h-11 rounded-md flex items-center justify-center mr-3 flex-shrink-0 ${tone.bg}`}
                  >
                    <f.icon size={20} className={tone.icon} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-bold text-text text-sm">{f.title}</p>
                      {f.badge && (
                        <span className="hidden sm:inline-block px-1.5 py-0.5 rounded-full bg-accent/15 text-accent-dark text-xxs font-bold uppercase tracking-wider">
                          {f.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-text-secondary text-xxs leading-4 mt-0.5">{f.desc}</p>
                  </div>
                  <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                    <span className="text-xxs font-semibold text-accent-dark hidden sm:inline group-hover:text-primary transition-colors">
                      {f.cta}
                    </span>
                    <ArrowRight
                      size={16}
                      className="text-text-muted group-hover:translate-x-0.5 group-hover:text-accent-dark transition-all"
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Rules applied */}
        <Card padding="md">
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-primary/10 rounded-full w-fit mb-2">
            <ShieldCheck size={12} className="text-accent-dark" />
            <span className="font-bold text-xxs text-primary uppercase tracking-wider">
              Reglas técnicas que aplica el motor
            </span>
          </div>
          <ul className="space-y-1.5">
            {RULES.map((r, i) => (
              <li
                key={i}
                className="flex items-center gap-2 text-xs text-text-secondary"
              >
                <r.icon size={14} className="text-accent-dark flex-shrink-0" />
                <span>{r.label}</span>
              </li>
            ))}
          </ul>
        </Card>

        {/* Marco normativo */}
        <Card padding="md" className="border-l-4 border-l-info">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen size={14} className="text-info" />
            <h2 className="font-bold text-sm text-primary">Marco normativo</h2>
            <Badge tone="info">Vigente</Badge>
          </div>
          <p className="text-xs text-text leading-5">
            El cálculo se basa en el <strong>Código Penal de Honduras</strong> (Decreto 130-2017,
            publicado en el Diario Oficial el 18 de enero de 2018) y sus reformas vigentes
            (Decretos 119-2019, 46-2020, 93-2021 y 59-2024).
            Los tipos penales, rangos de pena, atenuantes, agravantes y eximentes están
            codificados en el motor conforme a los artículos 1 a 635.
          </p>
          <Link
            href="/derecho-penal"
            className="inline-flex items-center gap-1 mt-2 text-xxs font-semibold text-primary hover:text-accent-dark"
          >
            Ver marco normativo completo <ArrowRight size={12} />
          </Link>
        </Card>

        {/* Equipo */}
        <Link
          href="/despacho"
          className="flex items-center bg-surface p-3 rounded-md border border-border-light shadow-sm hover:shadow-md transition-shadow focus-visible:outline-none"
        >
          <div className="w-10 h-10 rounded-md bg-surface-alt flex items-center justify-center mr-3 flex-shrink-0">
            <Users size={20} className="text-text-secondary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-text text-sm">El Despacho</p>
            <p className="text-text-secondary text-xxs">
              Conoce a {site.name} y al equipo detrás del bufete
            </p>
          </div>
          <ArrowRight size={16} className="text-text-muted flex-shrink-0" />
        </Link>

        {/* Admin Panel */}
        {user?.rol === 'admin' && (
          <Link
            href="/intranet/admin"
            className="flex items-center bg-surface p-3 rounded-md border border-accent/30 shadow-sm hover:shadow-md hover:border-accent transition-all focus-visible:outline-none"
          >
            <div className="w-10 h-10 rounded-md bg-accent/15 flex items-center justify-center mr-3 flex-shrink-0">
              <ShieldCheck size={20} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-text text-sm">Panel de Administración</p>
              <p className="text-text-secondary text-xxs">
                Gestionar usuarios, blog, FAQ y configuración del sitio
              </p>
            </div>
            <ArrowRight size={16} className="text-text-muted flex-shrink-0" />
          </Link>
        )}

        {/* Disclaimer */}
        <div className="flex gap-2 p-3 bg-warning-bg rounded-md border border-warning/30">
          <AlertTriangle
            size={14}
            className="text-text-secondary flex-shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <p className="text-text-secondary text-xxs leading-4 italic">
            Este cálculo es <strong>orientativo y técnico</strong>. No sustituye la función
            jurisdiccional ni la valoración de pruebas que realiza el juez competente.
            Cualquier aplicación práctica debe ser supervisada por un abogado habilitado.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
