'use client';

import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/ui';

interface Props {
  open: boolean;
  onClose: () => void;
  casosList: { id: string; titulo: string }[];
  selectedCaso: string;
  onSelectCaso: (id: string) => void;
  saving: boolean;
  onSave: () => void;
}

export function SaveModal({ open, onClose, casosList, selectedCaso, onSelectCaso, saving, onSave }: Props) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Guardar en caso"
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" loading={saving} onClick={onSave}>
            {selectedCaso ? 'Guardar en caso seleccionado' : 'Crear nuevo caso y guardar'}
          </Button>
        </>
      }
    >
      {casosList.length > 0 ? (
        <div className="space-y-1">
          <p className="text-xs font-semibold text-text-secondary mb-2">Selecciona un caso existente</p>
          {casosList.map(c => (
            <button
              key={c.id}
              type="button"
              onClick={() => onSelectCaso(c.id)}
              className={cn(
                'w-full text-left p-2.5 rounded-md text-sm transition-all focus-visible:outline-none',
                selectedCaso === c.id
                  ? 'bg-accent/10 border border-accent'
                  : 'bg-surface-alt border border-border hover:border-accent/50',
              )}
            >
              {c.titulo}
            </button>
          ))}
          <button
            type="button"
            onClick={() => onSelectCaso('')}
            className="w-full text-left p-2.5 rounded-md text-sm text-text-muted hover:bg-surface-alt border border-dashed border-border"
          >
            + Crear caso nuevo con la fecha actual
          </button>
        </div>
      ) : (
        <p className="text-sm text-text-secondary">
          Se creará un nuevo caso con la fecha actual y se guardará este cálculo en él.
        </p>
      )}
    </Modal>
  );
}
