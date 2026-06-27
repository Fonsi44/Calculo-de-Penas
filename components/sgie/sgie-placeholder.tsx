'use client';

import type { ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';

/**
 * Página placeholder reutilizable para módulos SGIE que se activarán en fases
 * posteriores (documentos, alertas, tareas, agenda, correos).
 *
 * Muestra un estado vacío profesional (no mocks falsos) indicando qué hará el
 * módulo y en qué fase se activará, conforme al plan SGIE (pinedayasociados.md).
 */
export function SgiePlaceholderPage({
  icon,
  title,
  subtitle,
  descripcion,
  fase,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  descripcion: string;
  fase: string;
}) {
  return (
    <div className="space-y-4">
      <PageHeader title={title} subtitle={subtitle} icon={icon} />
      <Card padding="md">
        <EmptyState
          icon={icon}
          title="Módulo en preparación"
          description={descripcion}
        />
        <div className="text-center pb-2">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xxs font-semibold bg-accent/10 text-accent-dark border border-accent/20">
            {fase}
          </span>
        </div>
      </Card>
    </div>
  );
}
