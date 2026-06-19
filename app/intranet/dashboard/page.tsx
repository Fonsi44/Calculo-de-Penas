'use client';

import { useAuth } from '@/app/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Scale, Shield, BookOpen, ClipboardList, Calculator } from 'lucide-react';
import { site } from '@/lib/site';
import { Card } from '@/components/ui/card';
import Link from 'next/link';

const STATS = [
  { label: 'Delitos', value: '483', icon: Scale },
  { label: 'Arts. CP', value: '635', icon: BookOpen },
  { label: 'Ramas', value: '119', icon: Shield },
  { label: 'Pasos', value: '8', icon: ClipboardList },
];

const TOOLS = [
  { label: 'Calcular pena', href: '/intranet/calculadora', icon: Calculator, desc: 'Cálculo automatizado de penas según el Código Penal hondureño' },
  { label: 'Mis casos', href: '/intranet/casos', icon: ClipboardList, desc: 'Gestión de casos y expedientes' },
  { label: 'Biblioteca CP', href: '/intranet/cp', icon: BookOpen, desc: 'Artículos del Código Penal y marco normativo' },
  { label: 'Catálogo de delitos', href: '/intranet/delitos', icon: Scale, desc: 'Catálogo completo de tipos penales' },
];

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user?.rol === 'admin') {
      router.replace('/intranet/admin');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    router.replace('/intranet/login');
    return null;
  }

  if (user.rol === 'admin') return null;

  return (
    <div className="flex flex-col flex-1 bg-background">
      <div className="border-b border-border-light bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl font-bold text-primary">{site.shortName}</h1>
          <p className="text-sm text-text-secondary mt-1">Panel principal del bufete</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {STATS.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} padding="md" className="text-center">
                <Icon className="mx-auto h-6 w-6 text-accent mb-2" />
                <p className="text-2xl font-bold text-primary">{stat.value}</p>
                <p className="text-xs text-text-secondary mt-0.5">{stat.label}</p>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {TOOLS.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link key={tool.href} href={tool.href} className="group block">
                <Card padding="md" className="h-full hover:border-accent/40 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 group-hover:bg-accent/20 group-hover:text-accent-dark transition-colors">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-text group-hover:text-primary transition-colors">{tool.label}</p>
                      <p className="text-xs text-text-secondary mt-0.5">{tool.desc}</p>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
