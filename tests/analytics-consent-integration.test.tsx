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

function flushEffects() {
  act(() => { vi.advanceTimersByTime(0); });
}

describe('Analytics consent integration', () => {
  beforeEach(() => {
    localStorage.clear();
    document.head.innerHTML = '';
    document.body.innerHTML = '';
    window.dataLayer = [];
    window.gtag = undefined;
    window.clarity = undefined;
    currentPath = '/';
    document.title = 'Test Page';
    vi.useFakeTimers();
  });

  afterEach(() => vi.useRealTimers());

  it('blocks GA4 and Clarity before analytics consent', () => {
    const view = render(<AnalyticsScripts {...props} />);
    expect(view.container.querySelector('#ga4-init')).toBeNull();
    expect(document.querySelector('script[src*="googletagmanager"]')).toBeNull();
    expect(document.querySelector('script[src*="clarity.ms"]')).toBeNull();
  });

  it('keeps advertising pixel disabled after analytics acceptance', () => {
    const view = render(<AnalyticsScripts {...props} fbPixelId="123456789" />);
    act(() => { persistConsent({ analytics: true, functionality: true }); });
    expect(view.container.querySelector('#fb-pixel')).toBeNull();
    expect(document.querySelector('script[src*="connect.facebook.net"]')).toBeNull();
  });

  it('mounts one GA config with send_page_view:false and loads gtag.js once', async () => {
    const view = render(<AnalyticsScripts {...props} />);
    act(() => { persistConsent({ analytics: true, functionality: false }); });
    expect(view.container.querySelectorAll('#ga4-init')).toHaveLength(1);
    // Verify send_page_view is false
    const script = view.container.querySelector('#ga4-init');
    expect(script?.textContent).toContain('send_page_view:false');
    expect(document.querySelectorAll('script[src*="clarity.ms/tag/"]')).toHaveLength(1);
    expect(typeof window.clarity).toBe('function');
    await act(async () => { vi.advanceTimersByTime(5000); });
    expect(document.querySelectorAll('script[src*="googletagmanager.com/gtag/js"]')).toHaveLength(1);
    await act(async () => { vi.advanceTimersByTime(5000); });
    expect(document.querySelectorAll('script[src*="googletagmanager.com/gtag/js"]')).toHaveLength(1);
  });

  it('sends initial page_view manually on first render with document.referrer', () => {
    persistConsent({ analytics: true, functionality: false });
    const gtag = vi.fn();
    window.gtag = gtag;
    document.title = 'Home Page';
    render(<AnalyticsScripts {...props} />);
    flushEffects();
    expect(gtag).toHaveBeenCalledTimes(1);
    expect(gtag).toHaveBeenCalledWith('event', 'page_view', expect.objectContaining({
      page_path: '/',
      page_title: 'Home Page',
      page_referrer: '',
    }));
  });

  it('sends one page_view per SPA navigation without duplicates', () => {
    persistConsent({ analytics: true, functionality: false });
    const gtag = vi.fn();
    window.gtag = gtag;
    document.title = 'Home';
    const view = render(<AnalyticsScripts {...props} />);
    // Initial page_view via effect
    flushEffects();
    const initialCalls = gtag.mock.calls.length;
    // Navigate
    currentPath = '/servicios-juridicos';
    document.title = 'Servicios Jurídicos';
    view.rerender(<AnalyticsScripts {...props} />);
    flushEffects();
    const afterNav = gtag.mock.calls.length;
    expect(afterNav - initialCalls).toBe(1);
    expect(gtag).toHaveBeenCalledWith('event', 'page_view', expect.objectContaining({
      page_path: '/servicios-juridicos',
      page_title: 'Servicios Jurídicos',
      page_referrer: '/',
    }));

    // Re-render with same pathname: no new page_view
    view.rerender(<AnalyticsScripts {...props} />);
    flushEffects();
    expect(gtag.mock.calls.length).toBe(afterNav);
  });

  it('does not render analytics on excluded private routes', () => {
    persistConsent({ analytics: true, functionality: false });
    currentPath = '/intranet/sgie';
    const view = render(<AnalyticsScripts {...props} />);
    expect(view.container.querySelector('#ga4-init')).toBeNull();
    expect(document.querySelector('script[src*="googletagmanager.com/gtag/js"]')).toBeNull();
  });

  it('sends no page_view events before consent is granted', () => {
    const gtag = vi.fn();
    window.gtag = gtag;
    render(<AnalyticsScripts {...props} />);
    flushEffects();
    expect(gtag).not.toHaveBeenCalled();
    expect(document.querySelector('#ga4-init')).toBeNull();
  });

  it('stops sending analytics at all on excluded paths', () => {
    persistConsent({ analytics: true, functionality: false });
    const gtag = vi.fn();
    window.gtag = gtag;
    currentPath = '/api/consulta';
    render(<AnalyticsScripts {...props} />);
    flushEffects();
    expect(gtag).not.toHaveBeenCalled();
    expect(document.querySelector('#ga4-init')).toBeNull();
  });
});
