// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CircunstanciaPicker } from '../../components/domain/circunstancia-picker';
import type { DelitoConfig } from '../../app/types';

const baseConfig: DelitoConfig = {
  delito: {
    id: 'd1',
    nombre: 'Hurto',
    articulo: 'Art. 363 CP',
    conducta: '',
    pena_minima_meses: 6,
    pena_maxima_meses: 24,
    pena_alternativa_min: 0,
    pena_alternativa_max: 0,
    tiene_pena_alternativa: false,
    penas_accesorias: [],
    es_grave: false,
  },
  pena_seleccionada: 'prision',
  variables_activas: [],
  grado_autoria: 'autor_directo',
  grado_ejecucion: 'consumado',
  reduccion_tentativa: 1,
  agravantes: [],
  atenuantes: [],
  eximentes: [],
  eximente_completa: null,
};

describe('CircunstanciaPicker', () => {
  it('renderiza todas las secciones', () => {
    const onChange = vi.fn();
    const onOpenArticle = vi.fn();
    render(<CircunstanciaPicker current={baseConfig} onChange={onChange} onOpenArticle={onOpenArticle} />);

    expect(screen.getAllByText('Eximentes').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Agravantes').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Atenuantes').length).toBeGreaterThanOrEqual(1);
  });

  it('muestra regla de compensación con conteo igual', () => {
    render(<CircunstanciaPicker current={baseConfig} onChange={vi.fn()} onOpenArticle={vi.fn()} />);
    expect(screen.getByText(/se compensan/i)).toBeInTheDocument();
  });

  it('muestra agravante sin compensar cuando hay más agravantes', () => {
    const cfg = { ...baseConfig, agravantes: ['alevosia'], atenuantes: [] };
    render(<CircunstanciaPicker current={cfg} onChange={vi.fn()} onOpenArticle={vi.fn()} />);
    expect(screen.getByText(/1 agravante.*sin compensar/i)).toBeInTheDocument();
  });

  it('permite toggle de agravante', async () => {
    const onChange = vi.fn();
    render(<CircunstanciaPicker current={baseConfig} onChange={onChange} onOpenArticle={vi.fn()} />);

    const chip = screen.getByText('Alevosía');
    await userEvent.click(chip);

    expect(onChange).toHaveBeenCalledWith({ agravantes: ['alevosia'] });
  });

  it('permite deseleccionar agravante', async () => {
    const onChange = vi.fn();
    const cfg = { ...baseConfig, agravantes: ['alevosia'] };
    render(<CircunstanciaPicker current={cfg} onChange={onChange} onOpenArticle={vi.fn()} />);

    const chip = screen.getByText('Alevosía');
    await userEvent.click(chip);

    expect(onChange).toHaveBeenCalledWith({ agravantes: [] });
  });

  it('seleccionar eximente completa asigna eximente_completa', async () => {
    const onChange = vi.fn();
    const cfg = { ...baseConfig, eximentes: ['inimputabilidad'], eximente_completa: null };
    render(<CircunstanciaPicker current={cfg} onChange={onChange} onOpenArticle={vi.fn()} />);

    const eximenteBtn = screen.getByText('Inimputabilidad');
    await userEvent.click(eximenteBtn);

    expect(onChange).toHaveBeenCalledWith({
      eximente_completa: 'inimputabilidad',
      eximentes: [],
    });
  });

  it('deseleccionar eximente completa', async () => {
    const onChange = vi.fn();
    const cfg = { ...baseConfig, eximentes: [], eximente_completa: 'legitima_defensa' };
    render(<CircunstanciaPicker current={cfg} onChange={onChange} onOpenArticle={vi.fn()} />);

    const eximenteBtn = screen.getByText('Legítima defensa');
    await userEvent.click(eximenteBtn);

    expect(onChange).toHaveBeenCalledWith({
      eximente_completa: null,
      eximentes: [],
    });
  });

  it('abre artículo al hacer click en Art. 30 CP', async () => {
    const onOpenArticle = vi.fn();
    render(<CircunstanciaPicker current={baseConfig} onChange={vi.fn()} onOpenArticle={onOpenArticle} />);

    const artBtn = screen.getByText('Art. 30 CP');
    await userEvent.click(artBtn);
    expect(onOpenArticle).toHaveBeenCalledWith('Art. 30 CP');
  });

  it('abre artículo al hacer click en Art. 32 CP', async () => {
    const onOpenArticle = vi.fn();
    render(<CircunstanciaPicker current={baseConfig} onChange={vi.fn()} onOpenArticle={onOpenArticle} />);

    const artBtn = screen.getByText('Art. 32 CP');
    await userEvent.click(artBtn);
    expect(onOpenArticle).toHaveBeenCalledWith('Art. 32 CP');
  });
});
