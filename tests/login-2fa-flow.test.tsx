// @vitest-environment jsdom
/**
 * Login & 2FA Flow Tests
 *
 * Tests the intranet login page: credentials form, 2FA verification flow,
 * recovery code mode, error handling, and loading/disabled states.
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastProvider } from '@/components/ui/toast';
import IntranetLoginPage from '@/app/intranet/login/page';

// ── Mock fetch ──────────────────────────────────────────────────────────────
const { mockFetch } = vi.hoisted(() => ({ mockFetch: vi.fn() }));
vi.stubGlobal('fetch', mockFetch);

function mockResp(status: number, data: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: 'OK',
    json: async () => data,
    text: async () => JSON.stringify(data),
  };
}

// ── Mock window.location ────────────────────────────────────────────────────
const originalLocation = window.location;

beforeEach(() => {
  const locationMock = {
    href: '',
    assign: vi.fn(),
    replace: vi.fn(),
    reload: vi.fn(),
    ancestorOrigins: {} as DOMStringList,
    origin: 'https://example.test',
    host: 'example.test',
    hostname: 'example.test',
    port: '',
    pathname: '/intranet/login',
    search: '',
    hash: '',
    protocol: 'https:',
  } as Location;
  Object.defineProperty(window, 'location', {
    value: locationMock,
    writable: true,
  });
});

afterEach(() => {
  vi.clearAllMocks();
  Object.defineProperty(window, 'location', {
    value: originalLocation,
    writable: true,
  });
});

function renderPage() {
  return render(
    <ToastProvider>
      <IntranetLoginPage />
    </ToastProvider>,
  );
}

// ── Selector helpers for confidence ─────────────────────────────────────────
const emailInput = () => screen.getByPlaceholderText(/usuario@pinedayasociadoshn\.com/i);
const passwordInput = () => document.getElementById('password') as HTMLInputElement;
const loginButton = () => screen.getByRole('button', { name: /iniciar sesión/i });
const showPasswordBtn = () => screen.getByRole('button', { name: /mostrar contraseña/i });
const hidePasswordBtn = () => screen.getByRole('button', { name: /ocultar contraseña/i });
const codeInput = () => document.getElementById('codigo') as HTMLInputElement;
const verifyButton = () => screen.getByRole('button', { name: /verificar código/i });

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────
describe('Login & 2FA flow', () => {
  describe('Step 1 — Credentials form', () => {
    // ── 1. Login form renders email and password fields ──
    it('renders email and password fields', () => {
      renderPage();

      expect(emailInput()).toBeInTheDocument();
      expect(passwordInput()).toBeInTheDocument();
      expect(loginButton()).toBeInTheDocument();
    });

    it('renders the email field with the correct placeholder', () => {
      renderPage();
      expect(emailInput()).toHaveAttribute('type', 'email');
    });

    it('renders the password field as password type by default', () => {
      renderPage();
      expect(passwordInput()).toHaveAttribute('type', 'password');
    });

    it('toggles password visibility', async () => {
      const user = userEvent.setup();
      renderPage();

      expect(passwordInput()).toHaveAttribute('type', 'password');
      await user.click(showPasswordBtn());

      expect(passwordInput()).toHaveAttribute('type', 'text');
      expect(hidePasswordBtn()).toBeInTheDocument();
    });

    // ── 2. Submitting credentials sends POST to /api/auth/login ──
    it('submits credentials to /api/auth/login', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce(mockResp(200, { ok: true, user: { rol: 'abogado' } }));

      renderPage();

      await user.type(emailInput(), 'test@example.test');
      await user.type(passwordInput(), 'password123');
      await user.click(loginButton());

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.test', password: 'password123' }),
      });
    });

    it('shows error message on failed login', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce(mockResp(401, { error: 'Credenciales inválidas' }));

      renderPage();

      await user.type(emailInput(), 'bad@test.com');
      await user.type(passwordInput(), 'wrong');
      await user.click(loginButton());

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Credenciales inválidas');
      });
    });

    it('shows generic error when response has no error message', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce(mockResp(500, {}));

      renderPage();

      await user.type(emailInput(), 'test@test.com');
      await user.type(passwordInput(), 'pass');
      await user.click(loginButton());

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Credenciales inválidas');
      });
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Step 2 — 2FA flow
  // ───────────────────────────────────────────────────────────────────────────
  describe('Step 2 — 2FA verification', () => {
    async function navigateTo2fa(user: ReturnType<typeof userEvent.setup>) {
      mockFetch.mockResolvedValueOnce(
        mockResp(200, { requiere2fa: true, challenge: 'challenge-token-123' }),
      );
      renderPage();
      await user.type(emailInput(), 'test@example.test');
      await user.type(passwordInput(), 'password123');
      await user.click(loginButton());
      await waitFor(() => {
        expect(screen.getByText(/verificación en dos pasos/i)).toBeInTheDocument();
      });
    }

    // ── 3. Backend returns requiere2fa → UI switches to 2FA code input ──
    it('switches to 2FA code input when backend requires 2FA', async () => {
      const user = userEvent.setup();
      await navigateTo2fa(user);

      expect(codeInput()).toBeInTheDocument();
      expect(verifyButton()).toBeInTheDocument();
    });

    // ── 4. 2FA form renders code input and verify button ──
    it('renders code input and verify button in 2FA step', async () => {
      const user = userEvent.setup();
      await navigateTo2fa(user);

      expect(screen.getByLabelText(/código de verificación/i)).toBeInTheDocument();
      expect(verifyButton()).toBeInTheDocument();
    });

    // ── 5. Submitting correct TOTP code sends POST to /api/auth/2fa/verify ──
    it('sends TOTP code to /api/auth/2fa/verify', async () => {
      const user = userEvent.setup();
      mockFetch
        .mockResolvedValueOnce(mockResp(200, { requiere2fa: true, challenge: 'ch-123' }))
        .mockResolvedValueOnce(
          mockResp(200, { ok: true, user: { rol: 'abogado' } }),
        );

      renderPage();

      // Step 1: login
      await user.type(emailInput(), 'test@example.test');
      await user.type(passwordInput(), 'password123');
      await user.click(loginButton());

      // Step 2: 2FA
      await waitFor(() => {
        expect(codeInput()).toBeInTheDocument();
      });

      await user.type(codeInput(), '123456');
      await user.click(verifyButton());

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/auth/2fa/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ challenge: 'ch-123', codigo: '123456', usarRecuperacion: false }),
        });
      });
    });

    // ── 6. Wrong TOTP code shows error message ──
    it('shows error message on wrong TOTP code', async () => {
      const user = userEvent.setup();
      mockFetch
        .mockResolvedValueOnce(mockResp(200, { requiere2fa: true, challenge: 'ch-123' }))
        .mockResolvedValueOnce(mockResp(401, { error: 'Código inválido' }));

      renderPage();

      await user.type(emailInput(), 'test@example.test');
      await user.type(passwordInput(), 'password123');
      await user.click(loginButton());

      await waitFor(() => {
        expect(codeInput()).toBeInTheDocument();
      });

      await user.type(codeInput(), '000000');
      await user.click(verifyButton());

      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert).toHaveTextContent('Código inválido');
      });
    });

    // ── 7. "Volver al inicio de sesión" returns to credentials form ──
    it('returns to credentials form when clicking "Volver al inicio de sesión"', async () => {
      const user = userEvent.setup();
      await navigateTo2fa(user);

      await user.click(screen.getByText(/volver al inicio de sesión/i));

      await waitFor(() => {
        expect(emailInput()).toBeInTheDocument();
        expect(passwordInput()).toBeInTheDocument();
        expect(loginButton()).toBeInTheDocument();
      });
    });

    // ── 8. "Usar código de recuperación" toggles the mode ──
    it('toggles to recovery code mode', async () => {
      const user = userEvent.setup();
      await navigateTo2fa(user);

      // Click "Usar código de recuperación"
      await user.click(screen.getByText(/usar código de recuperación/i));

      await waitFor(() => {
        expect(screen.getByText(/código de recuperación/i)).toBeInTheDocument();
      });

      // Can toggle back
      await user.click(screen.getByText(/usar código de aplicación autenticadora/i));

      await waitFor(() => {
        expect(screen.getByText(/código de verificación/i)).toBeInTheDocument();
      });
    });

    it('sends usarRecuperacion: true when in recovery mode', async () => {
      const user = userEvent.setup();
      mockFetch
        .mockResolvedValueOnce(mockResp(200, { requiere2fa: true, challenge: 'ch-123' }))
        .mockResolvedValueOnce(mockResp(200, { ok: true, user: { rol: 'abogado' } }));

      renderPage();

      await user.type(emailInput(), 'test@example.test');
      await user.type(passwordInput(), 'password123');
      await user.click(loginButton());

      await waitFor(() => {
        expect(screen.getByText(/usar código de recuperación/i)).toBeInTheDocument();
      });
      await user.click(screen.getByText(/usar código de recuperación/i));

      await waitFor(() => {
        expect(codeInput()).toBeInTheDocument();
      });

      await user.type(codeInput(), 'ABCD-EFGH-IJ');
      await user.click(verifyButton());

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/auth/2fa/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ challenge: 'ch-123', codigo: 'ABCD-EFGH-IJ', usarRecuperacion: true }),
        });
      });
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Loading and disabled states
  // ───────────────────────────────────────────────────────────────────────────
  describe('Loading and disabled states', () => {
    // ── 9. Verify button is disabled while loading ──
    it('disables verify button while loading on 2FA step', async () => {
      const user = userEvent.setup();
      mockFetch
        .mockResolvedValueOnce(mockResp(200, { requiere2fa: true, challenge: 'ch-123' }))
        .mockImplementationOnce(() => new Promise(() => {})); // pending forever

      renderPage();

      await user.type(emailInput(), 'test@example.test');
      await user.type(passwordInput(), 'password123');
      await user.click(loginButton());

      await waitFor(() => {
        expect(codeInput()).toBeInTheDocument();
      });

      await user.type(codeInput(), '123456');

      const vBtn = verifyButton();
      await user.click(vBtn);

      // After click, the button should be disabled and show "Verificando..."
      await waitFor(() => {
        const loadingBtn = screen.getByRole('button', { name: /verificando/i });
        expect(loadingBtn).toBeDisabled();
      });
    });

    // ── 10. Double submission is prevented (button disabled during request) ──
    it('prevents double submission on credentials form', async () => {
      const user = userEvent.setup();
      mockFetch.mockImplementationOnce(() => new Promise(() => {}));

      renderPage();

      await user.type(emailInput(), 'test@example.test');
      await user.type(passwordInput(), 'password123');

      const lBtn = loginButton();
      await user.click(lBtn);

      // Button should be disabled and show loading text
      await waitFor(() => {
        const btn = screen.getByRole('button', { name: /verificando/i });
        expect(btn).toBeDisabled();
      });

      // Only one fetch call
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('disables login button while loading on credentials step', async () => {
      const user = userEvent.setup();
      mockFetch.mockImplementationOnce(() => new Promise(() => {}));

      renderPage();

      await user.type(emailInput(), 'test@example.test');
      await user.type(passwordInput(), 'password123');
      await user.click(loginButton());

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /verificando/i })).toBeDisabled();
      });
    });

    it('disables "Solicitar nuevo código" button while loading on 2FA step', async () => {
      const user = userEvent.setup();
      mockFetch
        .mockResolvedValueOnce(mockResp(200, { requiere2fa: true, challenge: 'ch-123' }))
        .mockImplementationOnce(() => new Promise(() => {}));

      renderPage();

      await user.type(emailInput(), 'test@example.test');
      await user.type(passwordInput(), 'password123');
      await user.click(loginButton());

      await waitFor(() => {
        expect(codeInput()).toBeInTheDocument();
      });

      await user.type(codeInput(), '123456');
      await user.click(verifyButton());

      // The verify button is disabled
      await waitFor(() => {
        const btn = screen.getByRole('button', { name: /verificando/i });
        expect(btn).toBeDisabled();
      });

      // The "Solicitar nuevo código" button should be disabled while loading
      const resendBtn = screen.getByText(/solicitar nuevo código/i);
      expect(resendBtn).toBeDisabled();
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Edge cases
  // ───────────────────────────────────────────────────────────────────────────
  describe('Edge cases', () => {
    it('shows error when 2FA code is too short (less than 6 chars)', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce(
        mockResp(200, { requiere2fa: true, challenge: 'ch-123' }),
      );

      renderPage();

      await user.type(emailInput(), 'test@example.test');
      await user.type(passwordInput(), 'password123');
      await user.click(loginButton());

      await waitFor(() => {
        expect(codeInput()).toBeInTheDocument();
      });

      // Type only 3 digits and submit
      await user.type(codeInput(), '123');
      await user.click(verifyButton());

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/código válido/i);
      });

      // No fetch to /2fa/verify should have been made
      const twoFaCalls = mockFetch.mock.calls.filter(
        (call: string[]) => call[0] === '/api/auth/2fa/verify',
      );
      expect(twoFaCalls).toHaveLength(0);
    });

    it('clears 2FA error when user types a new code', async () => {
      const user = userEvent.setup();
      mockFetch
        .mockResolvedValueOnce(mockResp(200, { requiere2fa: true, challenge: 'ch-123' }))
        .mockResolvedValueOnce(mockResp(401, { error: 'Código inválido' }));

      renderPage();

      await user.type(emailInput(), 'test@example.test');
      await user.type(passwordInput(), 'password123');
      await user.click(loginButton());

      await waitFor(() => {
        expect(codeInput()).toBeInTheDocument();
      });

      await user.type(codeInput(), '000000');
      await user.click(verifyButton());

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Código inválido');
      });

      // Type a new digit — error should clear (onChange clears codigoError)
      await user.type(codeInput(), '1');

      await waitFor(() => {
        expect(screen.queryByRole('alert')).toBeNull();
      });
    });

    it('shows "Solicitar nuevo código" button in 2FA step', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce(
        mockResp(200, { requiere2fa: true, challenge: 'ch-123' }),
      );

      renderPage();

      await user.type(emailInput(), 'test@example.test');
      await user.type(passwordInput(), 'password123');
      await user.click(loginButton());

      await waitFor(() => {
        expect(screen.getByText(/solicitar nuevo código/i)).toBeInTheDocument();
      });
    });
  });
});
