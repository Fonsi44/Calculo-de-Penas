'use client';

import { ChevronLeft, Home, FileEdit, Scale } from 'lucide-react';
import { IconButton } from '@/components/ui/icon-button';
import { UserActions } from '@/components/layout/user-actions';
import { Stepper, type StepperStep } from '@/components/ui/stepper';
import { useRouter } from 'next/navigation';

interface Props {
  step: number;
  pasoActual: StepperStep;
  steps: StepperStep[];
  modificandoCaso: { casoTitulo: string } | null;
  onGoPrev: () => void;
  onExit: () => void;
  onSalirModificacion: () => void;
}

export function CalculadoraHeader({ step, pasoActual, steps, modificandoCaso, onGoPrev, onExit, onSalirModificacion }: Props) {
  return (
    <>
      <header className="bg-primary px-3 py-2 no-print">
        <div className="flex items-center">
          <IconButton label="Paso anterior" variant="solid" onClick={onGoPrev} disabled={step === 1}>
            <ChevronLeft size={18} />
          </IconButton>
          <div className="flex-1 ml-2">
            <h1 className="text-text-inverse font-bold text-sm">Calculadora de Penas</h1>
            <p className="text-[11px] text-text-inverse/70">Paso {step} de 8 · {pasoActual.label}</p>
          </div>
          <UserActions />
          <IconButton label="Salir al inicio" variant="solid" onClick={onExit} className="ml-1">
            <Home size={18} />
          </IconButton>
        </div>
        <div className="lg:hidden mt-2">
          <Stepper steps={steps} current={step} />
        </div>
      </header>

      {modificandoCaso && (
        <div className="bg-accent/15 border-b border-accent/30 px-3 py-2 no-print">
          <div className="flex items-center gap-2 max-w-3xl mx-auto">
            <FileEdit size={16} className="text-primary flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-primary">Modificando cálculo del caso</p>
              <p className="text-[11px] text-text-secondary truncate">
                {modificandoCaso.casoTitulo || 'Caso'} — al guardar se creará un nuevo cálculo en este caso
              </p>
            </div>
            <button
              type="button"
              onClick={onSalirModificacion}
              className="text-[11px] font-semibold text-text-secondary hover:text-text underline flex-shrink-0"
            >
              Salir
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export function CalculadoraSidebar({ step, steps, onSelect }: { step: number; steps: StepperStep[]; onSelect: (n: number) => void }) {
  return (
    <aside className="hidden lg:flex lg:flex-col desktop-sidebar bg-primary px-3 py-4 overflow-y-auto">
      <div className="flex items-center gap-2 mb-4">
        <Scale size={16} className="text-accent" />
        <span className="text-[11px] font-bold text-accent tracking-widest">PASO {step} DE 8</span>
      </div>
      <Stepper steps={steps} current={step} variant="vertical" onSelect={onSelect} />
    </aside>
  );
}
