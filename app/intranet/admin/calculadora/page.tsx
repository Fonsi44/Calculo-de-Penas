'use client';

import { Suspense, useState } from 'react';
import { ChevronLeft, Scale } from 'lucide-react';
import { useCalculadoraState } from '@/app/calculadora/state';
import { Paso1Delito } from '@/app/calculadora/paso1-delito';
import { Paso2Variantes } from '@/app/calculadora/paso2-variantes';
import { Paso3Participacion } from '@/app/calculadora/paso3-participacion';
import { Paso5DelitosList } from '@/app/calculadora/paso5-delitos-list';
import { Paso6Concurso } from '@/app/calculadora/paso6-concurso';
import { Paso7Resumen } from '@/app/calculadora/paso7-resumen';
import { Paso8Resultado } from '@/app/calculadora/paso8-resultado';
import { SaveModal } from '@/app/calculadora/save-modal';
import { ComparadorView } from '@/app/calculadora/comparador';
import { CircunstanciaPicker } from '@/components/domain/circunstancia-picker';
import { ArticleModal } from '@/app/article-modal';
import { CenteredSpinner } from '@/components/ui/spinner';
import { ErrorState } from '@/components/ui/empty-state';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/ui';

const STEPS = [
  { num: 1, label: 'Delito' },
  { num: 2, label: 'Variantes' },
  { num: 3, label: 'Participación' },
  { num: 4, label: 'Circunstancias' },
  { num: 5, label: 'Más delitos' },
  { num: 6, label: 'Concurso' },
  { num: 7, label: 'Resumen' },
  { num: 8, label: 'Resultado' },
];

function StepIndicator({
  step,
  steps,
  onSelect,
}: {
  step: number;
  steps: typeof STEPS;
  onSelect: (n: number) => void;
}) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
      {steps.map((s) => {
        const isActive = s.num === step;
        const isPast = s.num < step;
        return (
          <button
            key={s.num}
            type="button"
            onClick={() => isPast && onSelect(s.num)}
            disabled={!isPast}
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded-md text-xxs font-semibold whitespace-nowrap transition-all',
              isActive
                ? 'bg-accent/15 text-accent-dark'
                : isPast
                  ? 'bg-surface-alt text-text-secondary hover:bg-accent/10 hover:text-accent-dark cursor-pointer'
                  : 'text-text-muted',
            )}
          >
            <span
              className={cn(
                'w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold',
                isActive
                  ? 'bg-accent text-primary'
                  : isPast
                    ? 'bg-mitigation text-white'
                    : 'bg-surface-alt text-text-muted border border-border-light',
              )}
            >
              {isPast ? '✓' : s.num}
            </span>
            <span className="hidden sm:inline">{s.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function CalculadoraAdminShell() {
  const s = useCalculadoraState();
  const pasoActual = STEPS.find(p => p.num === s.step)!;
  const [mostrarComparador, setMostrarComparador] = useState(false);

  if (s.loading) return <CenteredSpinner label="Cargando catálogos jurídicos..." />;
  if (s.fetchError) {
    return (
      <div className="flex flex-1 items-center justify-center p-4">
        <ErrorState title="Error de conexión" description={s.fetchError} onRetry={() => s.loader.refetch()} />
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Compact header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center shadow-md flex-shrink-0">
          <Scale size={18} className="text-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-extrabold text-lg text-primary leading-tight">Calculadora de penas</h1>
          <p className="text-xs text-text-secondary">
            Paso {s.step} de 8 · {pasoActual.label}
            {s.modificandoCaso && <span className="ml-2 text-accent-dark font-semibold">· Modificando caso</span>}
          </p>
        </div>
        <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/15 border border-accent/30 text-accent-dark text-xxs font-bold uppercase tracking-wider">
          Motor v1
        </span>
      </div>

      {/* Step indicator */}
      <Card padding="sm" className="mb-4">
        <StepIndicator step={s.step} steps={STEPS} onSelect={(n) => { if (n < s.step) s.setStep(n as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8); }} />
      </Card>

      {/* Step content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="max-w-2xl mx-auto w-full space-y-4">
          {s.step === 1 && (
            <Paso1Delito
              filtered={s.filtered}
              search={s.search}
              setSearch={s.setSearch}
              configs={s.configs}
              current={s.current}
              selectDelito={s.selectDelito}
              removeDelito={s.removeDelito}
              pendientesConfirmados={s.pendientesConfirmados}
              setPendientesConfirmados={s.setPendientesConfirmados}
              onOpenArticle={s.setArticleRef}
            />
          )}

          {s.step === 2 && (
            <Paso2Variantes current={s.current} onChange={s.updateCurrent} onNext={() => s.setStep(3)} />
          )}

          {s.step === 3 && (
            <Paso3Participacion current={s.current} onChange={s.updateCurrent} />
          )}

          {s.step === 4 && s.current && (
            <CircunstanciaPicker current={s.current} onChange={s.updateCurrent} onOpenArticle={s.setArticleRef} />
          )}

          {s.step === 5 && (
            <Paso5DelitosList
              configs={s.configs}
              onAddAnother={s.addAnotherDelito}
              onRemove={s.removeDelito}
              onNext={(step) => s.setStep(step as 6 | 7)}
            />
          )}

          {s.step === 6 && (
            <Paso6Concurso tipoConcurso={s.tipoConcurso} onChange={s.setTipoConcurso} onOpenArticle={s.setArticleRef} />
          )}

          {s.step === 7 && (
            <Paso7Resumen
              configs={s.configs}
              tipoConcurso={s.tipoConcurso}
              error={s.error}
              calculating={s.calculating}
              onCalcular={s.calcular}
            />
          )}

          {s.step === 8 && s.resultado?.pena_principal && !mostrarComparador && (
            <Paso8Resultado
              resultado={s.resultado}
              reset={s.reset}
              onOpenArticle={s.setArticleRef}
              onSaveClick={s.handleSaveClick}
              onDuplicate={s.duplicateEscenario}
              escenariosCount={s.escenarios.length}
              onComparar={() => setMostrarComparador(true)}
            />
          )}

          {mostrarComparador && (
            <ComparadorView
              escenarios={s.escenarios}
              escenarioActivo={s.escenarioActivo}
              onSeleccionar={s.seleccionarEscenario}
              onDuplicar={s.duplicateEscenario}
              onEliminar={s.eliminarEscenario}
              onVolver={() => setMostrarComparador(false)}
            />
          )}
        </div>
      </div>

      {/* Bottom action bar */}
      {s.step < 8 && (
        <div className="sticky bottom-0 bg-surface border-t border-border-light mt-4 px-3 py-2 flex gap-3 rounded-md shadow-sm no-print">
          <Button variant="secondary" onClick={s.goPrev} disabled={s.step === 1}>
            Atrás
          </Button>
          {s.step === 7 ? (
            <Button variant="primary" loading={s.calculating} onClick={s.calcular}>
              {s.calculating ? 'Calculando...' : 'Calcular pena'}
            </Button>
          ) : (
            <Button variant="primary" onClick={s.goNext} disabled={s.step === 1 && !s.current} iconRight={<ChevronLeft size={16} className="rotate-180" />}>
              Continuar
            </Button>
          )}
          <div className="hidden sm:flex items-center text-xxs text-text-muted gap-2 ml-auto">
            <span>← →</span><span>Esc</span>
            {s.step === 7 && <span>⌘↵</span>}
          </div>
        </div>
      )}

      {/* Modals */}
      <ArticleModal articuloRef={s.articleRef} onClose={() => s.setArticleRef(null)} />
      <SaveModal
        open={s.showSaveModal}
        onClose={() => s.setShowSaveModal(false)}
        casosList={s.casosList}
        selectedCaso={s.selectedCaso}
        onSelectCaso={s.setSelectedCaso}
        saving={s.saving}
        onSave={s.handleSave}
      />
    </div>
  );
}

export default function AdminCalculadoraPage() {
  return (
    <Suspense fallback={<CenteredSpinner label="Cargando calculadora..." />}>
      <CalculadoraAdminShell />
    </Suspense>
  );
}
