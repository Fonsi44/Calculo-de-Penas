// @vitest-environment jsdom
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AiReviewNotice } from '@/components/blog/ai-review-notice';

describe('AiReviewNotice — semántica de estados (§9)', () => {
  // ─── Estados que SÍ muestran aviso ─────────────────────────────────────────
  it('muestra aviso de contraste documental completo para completed', () => {
    render(
      <AiReviewNotice
        aiReviewStatus="completed"
        aiReviewedAt="2026-07-26T10:00:00Z"
      />,
    );
    const el = screen.queryByText(/contrastado documentalmente/i);
    expect(el).not.toBeNull();
    expect(el?.textContent).toMatch(/no sustituye el análisis jurídico/);
    expect(el?.getAttribute('data-ai-review-status')).toBe('completed');
  });

  it('muestra aviso prudente para source_checked', () => {
    render(
      <AiReviewNotice
        aiReviewStatus="source_checked"
        aiReviewedAt="2026-07-26T10:00:00Z"
      />,
    );
    const el = screen.queryByText(/Parte de la información/i);
    expect(el).not.toBeNull();
    expect(el?.textContent).toMatch(/pueden requerir comprobación adicional/);
    expect(el?.getAttribute('data-ai-review-status')).toBe('source_checked');
  });

  it('muestra aviso de revisión pendiente para needs_human_review', () => {
    render(
      <AiReviewNotice
        aiReviewStatus="needs_human_review"
        aiReviewedAt="2026-07-26T10:00:00Z"
      />,
    );
    const el = screen.queryByText(/cuestiones pendientes de revisión jurídica/i);
    expect(el).not.toBeNull();
    expect(el?.textContent).toMatch(/No debe utilizarse como sustituto/);
  });

  // ─── Estados que NO muestran nada (no falsear confianza) ───────────────────
  it('no renderiza nada para blocked', () => {
    const { container } = render(
      <AiReviewNotice aiReviewStatus="blocked" aiReviewedAt={null} />,
    );
    expect(container.querySelector('[data-ai-review-status]')).toBeNull();
  });

  it('no renderiza nada para in_progress', () => {
    const { container } = render(
      <AiReviewNotice aiReviewStatus="in_progress" aiReviewedAt={null} />,
    );
    expect(container.querySelector('[data-ai-review-status]')).toBeNull();
  });

  it('no renderiza nada para not_started', () => {
    const { container } = render(
      <AiReviewNotice aiReviewStatus="not_started" aiReviewedAt={null} />,
    );
    expect(container.querySelector('[data-ai-review-status]')).toBeNull();
  });

  it('no renderiza nada para corrected (transitorio)', () => {
    const { container } = render(
      <AiReviewNotice aiReviewStatus="corrected" aiReviewedAt={null} />,
    );
    expect(container.querySelector('[data-ai-review-status]')).toBeNull();
  });

  it('no renderiza nada para status null o undefined', () => {
    const { container: c1 } = render(
      <AiReviewNotice aiReviewStatus={null} aiReviewedAt={null} />,
    );
    const { container: c2 } = render(
      // @ts-expect-error undefined no es válido pero se prueba defensivamente
      <AiReviewNotice aiReviewStatus={undefined} aiReviewedAt={null} />,
    );
    expect(c1.querySelector('[data-ai-review-status]')).toBeNull();
    expect(c2.querySelector('[data-ai-review-status]')).toBeNull();
  });

  // ─── Nunca menciona al proveedor (DeepSeek) ────────────────────────────────
  it('nunca menciona "DeepSeek" ni nombres de modelos en ningún estado', () => {
    const { container } = render(
      <>
        <AiReviewNotice aiReviewStatus="completed" aiReviewedAt="2026-07-26T10:00:00Z" />
        <AiReviewNotice aiReviewStatus="source_checked" aiReviewedAt="2026-07-26T10:00:00Z" />
        <AiReviewNotice aiReviewStatus="needs_human_review" aiReviewedAt="2026-07-26T10:00:00Z" />
      </>,
    );
    expect(container.textContent).not.toMatch(/deepseek/i);
    expect(container.textContent).not.toMatch(/gpt-4o/i);
    expect(container.textContent).not.toMatch(/gemini/i);
  });

  // ─── Fecha de revisión ─────────────────────────────────────────────────────
  it('incluye la fecha de revisión cuando aiReviewedAt está presente', () => {
    render(
      <AiReviewNotice
        aiReviewStatus="completed"
        aiReviewedAt="2026-07-26T10:00:00Z"
      />,
    );
    // Formateado en es-HN; el año debe aparecer
    const el = screen.getByText(/Revisión documental:/);
    expect(el.textContent).toMatch(/2026/);
  });

  it('no incluye fecha cuando aiReviewedAt es null', () => {
    render(
      <AiReviewNotice aiReviewStatus="source_checked" aiReviewedAt={null} />,
    );
    expect(screen.queryByText(/Revisión documental:/)).toBeNull();
  });

  // ─── Semántica: completed exige contraste documental ───────────────────────
  it('completed dice "contrastado documentalmente con las fuentes oficiales"', () => {
    render(
      <AiReviewNotice aiReviewStatus="completed" aiReviewedAt="2026-07-26T10:00:00Z" />,
    );
    expect(screen.getByText(/fuentes oficiales indicadas/i)).toBeDefined();
  });

  // ─── source_checked NO afirma contraste completo ───────────────────────────
  it('source_checked dice "Parte de la información" (no contraste completo)', () => {
    render(
      <AiReviewNotice aiReviewStatus="source_checked" aiReviewedAt="2026-07-26T10:00:00Z" />,
    );
    expect(screen.getByText(/Parte de la información/i)).toBeDefined();
    // No debe afirmar "contrastado documentalmente con las fuentes oficiales indicadas"
    const all = document.body.textContent ?? '';
    expect(all).not.toMatch(/contrastado documentalmente con las fuentes oficiales indicadas/);
  });
});
