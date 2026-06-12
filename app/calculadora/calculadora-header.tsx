'use client';

import { ChevronLeft, Home, FileEdit, Scale } from 'lucide-react';
import { IconButton } from '@/components/ui/icon-button';
import { UserActions } from '@/components/layout/user-actions';
import { Stepper, type StepperStep } from '@/components/ui/stepper';

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
      <header className="bg-hero-gradient px-3 py-2.5 no-print border-b border-primary-light/40 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.45)]">
        <div className="flex items-center">
          <IconButton label="Paso anterior" variant="solid" onClick={onGoPrev} disabled={step === 1}>
            <ChevronLeft size={18} />
          </IconButton>
          <div className="flex-1 ml-3">
            <div className="flex items-center gap-2">
              <h1 className="text-text-inverse font-bold text-sm">Calculadora de Penas</h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-accent/15 border border-accent/30 text-accent text-[10px] font-bold uppercase tracking-wider">
                Motor v1
              </span>
            </div>
            <p className="text-xxs text-text-inverse/70 mt-0.5">Paso {step} de 8 · {pasoActual.label}</p>
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
            <div className="w-7 h-7 rounded-md bg-accent/20 flex items-center justify-center flex-shrink-0">
              <FileEdit size={14} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-primary">Modificando cálculo del caso</p>
              <p className="text-xxs text-text-secondary truncate">
                {modificandoCaso.casoTitulo || 'Caso'} — al guardar se creará un nuevo cálculo en este caso
              </p>
            </div>
            <button
              type="button"
              onClick={onSalirModificacion}
              className="text-xxs font-semibold text-text-secondary hover:text-text underline flex-shrink-0"
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
    <aside className="hidden lg:flex lg:flex-col desktop-sidebar bg-hero-gradient px-4 py-5 overflow-y-auto relative">
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background: 'radial-gradient(60% 50% at 0% 0%, rgba(201,165,92,0.10) 0%, transparent 60%)',
        }}
      />
      <div className="relative flex items-center gap-2 mb-5">
        <div className="w-7 h-7 rounded-md bg-accent/15 border border-accent/30 flex items-center justify-center flex-shrink-0">
          <Scale size={14} className="text-accent" />
        </div>
        <div>
          <p className="text-xxs font-bold text-accent tracking-widest">PASO {step} DE 8</p>
          <p className="text-[10px] text-text-inverse/50 uppercase tracking-wider">Calculadora</p>
        </div>
      </div>
      <div className="relative">
        <Stepper steps={steps} current={step} variant="vertical" onSelect={onSelect} />
      </div>
    </aside>
  );
}
