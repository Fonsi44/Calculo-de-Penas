// @vitest-environment jsdom
import React from 'react';
import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { persistConsent } from '@/lib/cookie-consent';

let currentPath = '/';
vi.mock('next/navigation', () => ({ usePathname: () => currentPath }));
vi.mock('next/script', () => ({ default: ({ id, children }: { id?: string; children?: React.ReactNode }) => <script id={id}>{children}</script> }));

import { AnalyticsScripts } from '@/components/analytics-scripts';

const props = { gaId: 'G-ABC1234567', gtmId: null, fbPixelId: null, clarityId: 'clarity123', analyticsEnabled: true };

describe('Analytics consent integration', () => {
  beforeEach(() => {
    localStorage.clear();
    document.head.innerHTML = '';
    document.body.innerHTML = '';
    window.dataLayer = [];
    window.gtag = undefined;
    window.clarity = undefined;
    currentPath = '/';
    vi.useFakeTimers();
  });

  afterEach(() => vi.useRealTimers());

  it('blocks GA4 and Clarity before analytics consent', () => {
    const view = render(<AnalyticsScripts {...props} />);
    expect(view.container.querySelector('#ga4-init')).toBeNull();
    expect(document.querySelector('script[src*="googletagmanager"]')).toBeNull();
    expect(document.querySelector('script[src*="clarity.ms"]')).toBeNull();
    expect(view.container.querySelector('#fb-pixel')).toBeNull();
  });

  it('keeps the advertising pixel disabled after analytics acceptance', () => {
    const view = render(<AnalyticsScripts {...props} fbPixelId="123456789" />);
    act(() => { persistConsent({ analytics: true, functionality: true }); });
    expect(view.container.querySelector('#fb-pixel')).toBeNull();
    expect(document.querySelector('script[src*="connect.facebook.net"]')).toBeNull();
  });

  it('mounts one GA config and loads each provider once after acceptance', async () => {
    const view = render(<AnalyticsScripts {...props} />);
    act(() => { persistConsent({ analytics: true, functionality: false }); });
    expect(view.container.querySelectorAll('#ga4-init')).toHaveLength(1);
    expect(document.querySelectorAll('script[src*="clarity.ms/tag/"]')).toHaveLength(1);
    expect(typeof window.clarity).toBe('function');
    await act(async () => { vi.advanceTimersByTime(5000); });
    expect(document.querySelectorAll('script[src*="googletagmanager.com/gtag/js"]')).toHaveLength(1);
    await act(async () => { vi.advanceTimersByTime(5000); });
    expect(document.querySelectorAll('script[src*="googletagmanager.com/gtag/js"]')).toHaveLength(1);
  });

  it('sends one pageview per SPA path change and none for the initial route', () => {
    persistConsent({ analytics: true, functionality: false });
    const gtag = vi.fn();
    window.gtag = gtag;
    const view = render(<AnalyticsScripts {...props} />);
    expect(gtag).not.toHaveBeenCalledWith('event', 'page_view', expect.anything());
    currentPath = '/servicios-juridicos';
    view.rerender(<AnalyticsScripts {...props} />);
    expect(gtag.mock.calls.filter((call) => call[0] === 'event' && call[1] === 'page_view')).toHaveLength(1);
    view.rerender(<AnalyticsScripts {...props} />);
    expect(gtag.mock.calls.filter((call) => call[0] === 'event' && call[1] === 'page_view')).toHaveLength(1);
  });

  it('does not render analytics on excluded private routes', () => {
    persistConsent({ analytics: true, functionality: false });
    currentPath = '/intranet/sgie';
    const view = render(<AnalyticsScripts {...props} />);
    expect(view.container.querySelector('#ga4-init')).toBeNull();
    expect(document.querySelector('script[src*="googletagmanager.com/gtag/js"]')).toBeNull();
  });
});
