'use client';

import { Suspense, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { useCalculadoraState } from './state';
import { Paso1Delito } from './paso1-delito';
import { Paso2Variantes } from './paso2-variantes';
import { Paso3Participacion } from './paso3-participacion';
import { Paso5DelitosList } from './paso5-delitos-list';
import { Paso6Concurso } from './paso6-concurso';
import { Paso7Resumen } from './paso7-resumen';
import { Paso8Resultado } from './paso8-resultado';
import { CalculadoraHeader, CalculadoraSidebar } from './calculadora-header';
import { SaveModal } from './save-modal';
import { ComparadorView } from './comparador';
import { CircunstanciaPicker } from '@/components/domain/circunstancia-picker';
import { ArticleModal } from '../article-modal';
import { Button } from '@/components/ui/button';
import { CenteredSpinner } from '@/components/ui/spinner';
import { ErrorState } from '@/components/ui/empty-state';

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

export default function CalculadoraPage() {
  return (
    <Suspense fallback={<CenteredSpinner label="Cargando calculadora..." />}>
      <CalculadoraShell />
    </Suspense>
  );
}

function CalculadoraShell() {
  const s = useCalculadoraState();
  const router = useRouter();
  const pasoActual = STEPS.find(p => p.num === s.step)!;
  const [mostrarComparador, setMostrarComparador] = useState(false);

  if (s.loading) return <CenteredSpinner label="Cargando catálogos jurídicos..." />;
  if (s.fetchError) {
    return (
      <div className="flex flex-1 items-center justify-center bg-background p-4">
        <ErrorState title="Error de conexión" description={s.fetchError} onRetry={() => s.loader.refetch()} />
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 bg-background">
      <CalculadoraHeader
        step={s.step}
        pasoActual={pasoActual}
        steps={STEPS}
        modificandoCaso={s.modificandoCaso}
        onGoPrev={s.goPrev}
        onExit={s.exitCalculadora}
        onSalirModificacion={() => {
          s.setModificandoCaso(null);
          s.setSelectedCaso('');
          router.replace('/calculadora');
        }}
      />

      <div className="flex flex-1 overflow-hidden">
        <CalculadoraSidebar
          step={s.step}
          steps={STEPS}
          onSelect={(n) => { if (n < s.step) s.setStep(n as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8); }}
        />

        <div className="flex-1 overflow-y-auto p-3 max-w-lg mx-auto w-full lg:mx-0 lg:max-w-none lg:px-6 lg:py-4">
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

      {s.step < 8 && (
        <div className="sticky bottom-0 bg-surface border-t border-border-light px-3 py-2 flex gap-3 no-print">
          <Button variant="secondary" fullWidth onClick={s.goPrev} disabled={s.step === 1}>
            Atrás
          </Button>
          {s.step === 7 ? (
            <Button variant="primary" fullWidth loading={s.calculating} onClick={s.calcular}>
              {s.calculating ? 'Calculando...' : 'Calcular pena'}
            </Button>
          ) : (
            <Button variant="primary" fullWidth onClick={s.goNext} disabled={s.step === 1 && !s.current} iconRight={<ChevronLeft size={16} className="rotate-180" />}>
              Continuar
            </Button>
          )}
          <div className="hidden sm:flex items-center text-xxs text-text-muted gap-2">
            <span>← →</span><span>Esc</span>
            {s.step === 7 && <span>⌘↵</span>}
          </div>
        </div>
      )}

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
