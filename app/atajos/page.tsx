'use client';

import { useEffect } from 'react';
import { Keyboard, Calculator, FileText, Eye, Moon, Sun, ArrowLeft, ArrowRight, CornerDownLeft, X, Command, Layers, Sparkles } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { useTheme } from '@/app/theme-context';

interface ShortcutGroup {
  title: string;
  description: string;
  icon: React.ReactNode;
  shortcuts: Array<{ keys: string[]; label: string; description: string }>;
}

const Kbd = ({ children }: { children: React.ReactNode }) => (
  <kbd className="inline-flex items-center justify-center min-w-[1.75rem] h-7 px-1.5 text-xs font-mono font-semibold rounded border border-border bg-surface-alt text-text shadow-[0_1px_0_var(--color-border)]">
    {children}
  </kbd>
);

export default function AtajosPage() {
  const { theme, toggle } = useTheme();

  useKeyboardShortcuts([
    { key: 'd', ctrl: true, shift: true, handler: () => toggle() },
  ]);

  const groups: ShortcutGroup[] = [
    {
      title: 'Calculadora de penas',
      description: 'Navegación y acciones durante el cálculo',
      icon: <Calculator size={18} />,
      shortcuts: [
        { keys: ['←'], label: 'Paso anterior', description: 'Volver al paso previo (1-7)' },
        { keys: ['→'], label: 'Paso siguiente', description: 'Avanzar al siguiente paso' },
        { keys: ['Ctrl', 'Enter'], label: 'Calcular pena', description: 'Ejecuta el cálculo en el paso 7' },
        { keys: ['Esc'], label: 'Cerrar modal', description: 'Cierra artículos o diálogos abiertos' },
      ],
    },
    {
      title: 'Interfaz',
      description: 'Atajos globales del sistema',
      icon: <Layers size={18} />,
      shortcuts: [
        { keys: ['Ctrl', 'Shift', 'D'], label: 'Cambiar tema', description: `Alterna claro/oscuro (actual: ${theme})` },
        { keys: ['Tab'], label: 'Avanzar foco', description: 'Mueve el foco al siguiente elemento' },
        { keys: ['Shift', 'Tab'], label: 'Retroceder foco', description: 'Mueve el foco al elemento anterior' },
        { keys: ['Tab'] /* desde top */, label: 'Saltar al contenido', description: 'Skip-link visible al inicio de la página' },
      ],
    },
    {
      title: 'Lectura de artículos',
      description: 'En la biblioteca del Código Penal',
      icon: <FileText size={18} />,
      shortcuts: [
        { keys: ['Esc'], label: 'Cerrar artículo', description: 'Cierra el detalle del artículo' },
        { keys: ['/'], label: 'Buscar', description: 'Enfoca el campo de búsqueda (próximamente)' },
      ],
    },
    {
      title: 'Casos y exportación',
      description: 'Gestión de casos guardados',
      icon: <Sparkles size={18} />,
      shortcuts: [
        { keys: ['Esc'], label: 'Cerrar diálogo', description: 'Cierra el modal de guardar caso' },
      ],
    },
  ];

  return (
    <AppShell
      title="Atajos de teclado"
      subtitle="Referencia rápida para trabajar más rápido"
    >
      <div className="p-3 max-w-3xl mx-auto space-y-3">
        <Card padding="md" className="bg-accent border-accent">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-md bg-primary flex items-center justify-center shrink-0">
              <Keyboard size={20} className="text-accent" />
            </div>
            <div>
              <h2 className="font-bold text-primary text-sm mb-1">Atajos de teclado</h2>
              <p className="text-xs text-text-secondary leading-5">
                LEX HONDURAS expone un conjunto reducido pero potente de atajos. La mayoría respeta el contexto: solo se activan en pantallas donde tienen sentido. Los atajos con <Kbd>Ctrl</Kbd> funcionan también como <Kbd>⌘</Kbd> en macOS.
              </p>
            </div>
          </div>
        </Card>

        {groups.map((g) => (
          <section key={g.title} aria-labelledby={`g-${g.title}`}>
            <div className="flex items-center gap-2 mb-2 px-1">
              <div className="w-7 h-7 rounded-md bg-accent flex items-center justify-center text-primary">
                {g.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 id={`g-${g.title}`} className="font-bold text-sm text-text">{g.title}</h3>
                <p className="text-[11px] text-text-muted leading-4">{g.description}</p>
              </div>
            </div>

            <Card padding="none">
              <ul className="divide-y divide-border-light">
                {g.shortcuts.map((s, i) => (
                  <li key={i} className="flex items-center gap-3 p-3">
                    <div className="flex items-center gap-1 shrink-0 min-w-[120px]">
                      {s.keys.map((k, j) => (
                        <span key={j} className="flex items-center gap-1">
                          <Kbd>{k}</Kbd>
                          {j < s.keys.length - 1 && <span className="text-text-muted text-[11px]">+</span>}
                        </span>
                      ))}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-text">{s.label}</div>
                      <div className="text-[11px] text-text-muted leading-4">{s.description}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          </section>
        ))}

        <Card padding="md">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-md bg-accent flex items-center justify-center shrink-0">
              <Eye size={18} className="text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-text mb-1">Accesibilidad</h3>
              <p className="text-xs text-text-secondary leading-5">
                Todos los controles son navegables con teclado. Los botones se activan con <Kbd>Enter</Kbd> o <Kbd>Espacio</Kbd>. Los <em>radio</em> y <em>select</em> usan <Kbd>←</Kbd> / <Kbd>→</Kbd>. El foco siempre es visible (anillo azul) y se mantiene dentro de los modales abiertos.
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                <Badge tone="info">WCAG AA</Badge>
                <Badge tone="info">Focus visible</Badge>
                <Badge tone="info">Skip link</Badge>
                <Badge tone="info">Reduced motion</Badge>
              </div>
            </div>
          </div>
        </Card>

        <p className="text-[11px] text-text-muted text-center py-2 italic">
          Sugerencias de atajos adicionales son bienvenidas. Esta página se actualizará con cada release.
        </p>
      </div>
    </AppShell>
  );
}
