// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import { TurnstileWidget, type TurnstileStatus } from '../../components/marketing/turnstile-widget';

/**
 * Tests del widget Turnstile: estados, callbacks, resiliencia de UI y
 * cleanup al desmontar. No se renderiza Cloudflare real; se simula la API.
 */

// Simular la API global de Turnstile inyectada por el script de Cloudflare.
type RenderOpts = {
  sitekey: string;
  callback: (token: string) => void;
  'error-callback'?: () => void;
  'expired-callback'?: () => void;
  theme?: string;
  size?: string;
};

function mockTurnstileApi() {
  const renders: Array<{ id: string; opts: RenderOpts }> = [];
  let renderCount = 0;
  const api = {
    render: vi.fn((el: HTMLElement, opts: RenderOpts) => {
      const id = `widget-${++renderCount}`;
      renders.push({ id, opts });
      return id;
    }),
    reset: vi.fn(),
    remove: vi.fn(),
    _renders: renders,
  };
  (window as unknown as { turnstile: typeof api }).turnstile = api;
  return api;
}

describe('TurnstileWidget', () => {
  beforeEach(() => {
    // Limpiar estado global entre tests.
    delete (window as unknown as { turnstile?: unknown }).turnstile;
    // Eliminar scripts inyectados de tests anteriores.
    document.querySelectorAll('script[src*="challenges.cloudflare.com"]').forEach((s) => s.remove());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('estado unconfigured cuando NEXT_PUBLIC_TURNSTILE_SITE_KEY está vacía', async () => {
    const original = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = '';

    const onStatusChange = vi.fn<(s: TurnstileStatus) => void>();
    const { container } = render(
      <TurnstileWidget onToken={vi.fn()} onStatusChange={onStatusChange} />,
    );

    // Con site key vacía → no renderiza nada y notifica unconfigured.
    expect(container.firstChild).toBeNull();
    expect(onStatusChange).toHaveBeenCalledWith('unconfigured');

    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = original;
  });

  it('intenta obtener site key del API cuando no está en el bundle', async () => {
    const original = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    delete process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

    // Mock fetch para devolver la site key desde el API.
    const fetchMock = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ turnstileSiteKey: '0xTEST_FROM_API' }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;
    mockTurnstileApi();

    render(<TurnstileWidget onToken={vi.fn()} />);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/public-config'));

    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = original;
  });

  it('muestra el contenedor con aria-label cuando la site key está configurada', async () => {
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = '0xTEST_SITE_KEY';
    mockTurnstileApi();

    await act(async () => {
      render(<TurnstileWidget onToken={vi.fn()} />);
    });

    expect(screen.getByLabelText('Verificación antispam')).toBeInTheDocument();
  });

  it('notifica estado verified y pasa el token al resolver el widget', async () => {
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = '0xTEST_SITE_KEY';
    const api = mockTurnstileApi();
    const onToken = vi.fn();
    const onStatusChange = vi.fn<(s: TurnstileStatus) => void>();

    render(<TurnstileWidget onToken={onToken} onStatusChange={onStatusChange} />);

    // Esperar a que se renderice el widget.
    await waitFor(() => expect(api.render).toHaveBeenCalled());

    // Simular que Cloudflare invoca el callback con un token.
    const renderOpts = api._renders[0].opts;
    act(() => {
      renderOpts.callback('dummy-token-123');
    });

    expect(onToken).toHaveBeenCalledWith('dummy-token-123');
    expect(onStatusChange).toHaveBeenCalledWith('verified');
  });

  it('notifica estado error y limpia el token en error-callback', async () => {
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = '0xTEST_SITE_KEY';
    const api = mockTurnstileApi();
    const onToken = vi.fn();
    const onStatusChange = vi.fn<(s: TurnstileStatus) => void>();

    render(<TurnstileWidget onToken={onToken} onStatusChange={onStatusChange} />);

    await waitFor(() => expect(api.render).toHaveBeenCalled());

    const renderOpts = api._renders[0].opts;
    act(() => {
      renderOpts['error-callback']?.();
    });

    expect(onToken).toHaveBeenCalledWith('');
    expect(onStatusChange).toHaveBeenCalledWith('error');
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('notifica estado ready y limpia el token en expired-callback', async () => {
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = '0xTEST_SITE_KEY';
    const api = mockTurnstileApi();
    const onToken = vi.fn();
    const onStatusChange = vi.fn<(s: TurnstileStatus) => void>();

    render(<TurnstileWidget onToken={onToken} onStatusChange={onStatusChange} />);

    await waitFor(() => expect(api.render).toHaveBeenCalled());

    const renderOpts = api._renders[0].opts;
    act(() => {
      renderOpts['expired-callback']?.();
    });

    expect(onToken).toHaveBeenCalledWith('');
    expect(onStatusChange).toHaveBeenCalledWith('ready');
  });

  it('elimina el widget al desmontar', async () => {
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = '0xTEST_SITE_KEY';
    const api = mockTurnstileApi();

    const { unmount } = render(<TurnstileWidget onToken={vi.fn()} />);

    await waitFor(() => expect(api.render).toHaveBeenCalled());
    const widgetId = api._renders[0].id;

    unmount();

    expect(api.remove).toHaveBeenCalledWith(widgetId);
  });
});
