'use client';

import { Printer, Save, Copy, GitCompare } from 'lucide-react';
import Link from 'next/link';
import type { ResultadoCalculo } from '@/lib/calculo';
import { ErrorBoundary } from '../error-boundary';
import { PenaltyResultPanel } from '@/components/domain/penalty-result-panel';
import { Button } from '@/components/ui/button';

interface Props {
  resultado: ResultadoCalculo;
  reset: () => void;
  onOpenArticle: (ref: string | null) => void;
  onSaveClick: () => void;
  onDuplicate?: () => void;
  escenariosCount?: number;
  onComparar?: () => void;
}

export function Paso8Resultado({ resultado, reset, onOpenArticle, onSaveClick, onDuplicate, escenariosCount = 0, onComparar }: Props) {
  return (
    <ErrorBoundary fallback={
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="font-bold text-danger text-sm mb-2">Error al mostrar resultados</p>
        <p className="text-xs text-text-muted mb-4">Ocurrió un error al renderizar el cálculo. Intente nuevamente.</p>
        <Button variant="primary" onClick={reset}>Nueva consulta</Button>
      </div>
    }>
      <div className="print-area">
        <PenaltyResultPanel
          resultado={resultado}
          onOpenArticle={onOpenArticle}
        />
      </div>

      <div className="grid grid-cols-2 gap-2 mt-4 no-print">
        <Button variant="secondary" iconLeft={<Printer size={16} />} onClick={() => window.print()}>
          Exportar PDF
        </Button>
        <Button variant="primary" iconLeft={<Save size={16} />} onClick={onSaveClick}>
          Guardar caso
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-2 no-print">
        {onDuplicate && (
          <Button variant="tertiary" iconLeft={<Copy size={14} />} onClick={onDuplicate}>
            Duplicar escenario
          </Button>
        )}
        {onComparar && escenariosCount >= 1 && (
          <Button variant="tertiary" iconLeft={<GitCompare size={14} />} onClick={onComparar}>
            Comparar ({escenariosCount + 1})
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 mt-2 no-print">
        <Button variant="secondary" onClick={reset}>Nueva consulta</Button>
        <Link href="/" className="contents">
          <Button variant="primary">Inicio</Button>
        </Link>
      </div>
    </ErrorBoundary>
  );
}
