// @vitest-environment jsdom
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  CookieConsent,
  CookiePreferencesButton,
} from '@/components/cookie-consent';
import { persistConsent } from '@/lib/cookie-consent';

describe('diálogo de consentimiento', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = '';
  });

  afterEach(() => {
    delete document.body.dataset.consentDialogOpen;
  });

  it('muestra un aviso inferior no modal y no bloquea los widgets', async () => {
    const floating = document.createElement('div');
    floating.dataset.floatingWidget = '';
    document.body.appendChild(floating);

    render(<CookieConsent />);

    expect(screen.getByRole('region', { name: 'Preferencias de privacidad' })).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.body.dataset.consentDialogOpen).toBeUndefined();
    expect(floating).not.toHaveAttribute('inert');
  });

  it('al configurar mueve el foco al diálogo y desactiva widgets flotantes', async () => {
    const user = userEvent.setup();
    const floating = document.createElement('div');
    floating.dataset.floatingWidget = '';
    document.body.appendChild(floating);

    render(<CookieConsent />);
    await user.click(screen.getByRole('button', { name: 'Configurar' }));

    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Aceptar opcionales' })).toHaveFocus(),
    );
    expect(document.body.dataset.consentDialogOpen).toBe('true');
    expect(floating).toHaveAttribute('inert');
    expect(floating).toHaveAttribute('aria-hidden', 'true');
  });

  it('cierra después de guardar una decisión y restaura los widgets', async () => {
    const user = userEvent.setup();
    const floating = document.createElement('div');
    floating.dataset.floatingWidget = '';
    document.body.appendChild(floating);

    render(<CookieConsent />);
    await user.click(screen.getByRole('button', { name: 'Rechazar opcionales' }));

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.body.dataset.consentDialogOpen).toBeUndefined();
    expect(floating).not.toHaveAttribute('inert');
    expect(floating).not.toHaveAttribute('aria-hidden');
  });

  it('permite cerrar con Escape al reabrir y devuelve el foco al activador', async () => {
    persistConsent({ analytics: false, functionality: false });
    const user = userEvent.setup();

    render(
      <>
        <CookiePreferencesButton />
        <CookieConsent />
      </>,
    );

    const trigger = screen.getByRole('button', { name: 'Preferencias de cookies' });
    await user.click(trigger);
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(trigger).toHaveFocus();
  });
});
