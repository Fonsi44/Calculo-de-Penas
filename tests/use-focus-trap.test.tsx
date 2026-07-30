// @vitest-environment jsdom
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { useFocusTrap } from '@/hooks/use-focus-trap';

function TestComponent({
  active,
  onEscape,
  returnFocusRef,
}: {
  active: boolean;
  onEscape?: () => void;
  returnFocusRef?: React.RefObject<HTMLElement | null>;
}) {
  const ref = useFocusTrap<HTMLDivElement>(active, { onEscape, returnFocusRef });
  return (
    <div ref={ref}>
      <button data-testid="btn1">Button 1</button>
      <button data-testid="btn2">Button 2</button>
    </div>
  );
}

function DynamicTestComponent({ active }: { active: boolean }) {
  const ref = useFocusTrap<HTMLDivElement>(active);
  const [showExtra, setShowExtra] = useState(false);
  return (
    <div ref={ref}>
      <button data-testid="btn1">Button 1</button>
      {showExtra && <button data-testid="btn-extra">Extra Button</button>}
      <button data-testid="btn-trigger" onClick={() => setShowExtra(true)}>Show Extra</button>
    </div>
  );
}

function ZeroElementComponent({ active }: { active: boolean }) {
  const ref = useFocusTrap<HTMLDivElement>(active);
  return <div ref={ref}>No focusable items here</div>;
}

function OneElementComponent({ active }: { active: boolean }) {
  const ref = useFocusTrap<HTMLDivElement>(active);
  return (
    <div ref={ref}>
      <button data-testid="single">Single Button</button>
    </div>
  );
}

function HiddenElementComponent({ active }: { active: boolean }) {
  const ref = useFocusTrap<HTMLDivElement>(active);
  return (
    <div ref={ref}>
      <button data-testid="visible-1">Visible 1</button>
      <button data-testid="hidden" style={{ display: 'none' }}>Hidden</button>
      <button data-testid="aria-hidden" aria-hidden="true">Aria Hidden</button>
      <button data-testid="inert" inert={true}>Inert</button>
      <button data-testid="visible-2">Visible 2</button>
    </div>
  );
}

describe('useFocusTrap unit tests', () => {
  beforeAll(() => {
    Object.defineProperty(HTMLElement.prototype, 'getBoundingClientRect', {
      configurable: true,
      value: () => ({
        width: 100,
        height: 100,
        top: 0,
        left: 0,
        bottom: 100,
        right: 100,
      }),
    });
  });

  it('enfoca el primer elemento cuando se activa', () => {
    render(<TestComponent active={true} />);
    const btn1 = screen.getByTestId('btn1');
    expect(document.activeElement).toBe(btn1);
  });

  it('llama a onEscape al presionar la tecla Escape', async () => {
    const user = userEvent.setup();
    const onEscape = vi.fn();
    render(<TestComponent active={true} onEscape={onEscape} />);
    
    await user.keyboard('{Escape}');
    expect(onEscape).toHaveBeenCalledTimes(1);
  });

  it('restaura el foco al elemento returnFocusRef cuando se desmonta', () => {
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    trigger.focus();
    expect(document.activeElement).toBe(trigger);

    const triggerRef = { current: trigger };

    const { unmount } = render(
      <TestComponent active={true} returnFocusRef={triggerRef} />
    );

    const btn1 = screen.getByTestId('btn1');
    expect(document.activeElement).toBe(btn1);

    unmount();
    expect(document.activeElement).toBe(trigger);

    document.body.removeChild(trigger);
  });

  it('se desactiva sin desmontar correctamente', () => {
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    trigger.focus();

    const triggerRef = { current: trigger };

    const { rerender } = render(
      <TestComponent active={true} returnFocusRef={triggerRef} />
    );

    const btn1 = screen.getByTestId('btn1');
    expect(document.activeElement).toBe(btn1);

    rerender(<TestComponent active={false} returnFocusRef={triggerRef} />);

    expect(document.activeElement).toBe(trigger);

    document.body.removeChild(trigger);
  });

  it('soporta 0 elementos enfocables', () => {
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    trigger.focus();

    render(<ZeroElementComponent active={true} />);
    expect(document.activeElement).toBe(trigger);

    document.body.removeChild(trigger);
  });

  it('soporta 1 elemento enfocables (vuelve a enfocar el mismo con Tab)', async () => {
    const user = userEvent.setup();
    render(<OneElementComponent active={true} />);
    const single = screen.getByTestId('single');
    expect(document.activeElement).toBe(single);

    await user.tab();
    expect(document.activeElement).toBe(single);
  });

  it('hace wrap del ultimo al primer elemento con Tab', async () => {
    const user = userEvent.setup();
    render(<TestComponent active={true} />);
    const btn2 = screen.getByTestId('btn2');
    btn2.focus();

    await user.tab();

    const btn1 = screen.getByTestId('btn1');
    expect(document.activeElement).toBe(btn1);
  });

  it('hace wrap del primero al ultimo elemento con Shift+Tab', async () => {
    const user = userEvent.setup();
    render(<TestComponent active={true} />);
    const btn1 = screen.getByTestId('btn1');
    expect(document.activeElement).toBe(btn1);

    await user.tab({ shift: true });

    const btn2 = screen.getByTestId('btn2');
    expect(document.activeElement).toBe(btn2);
  });

  it('excluye elementos ocultos, aria-hidden e inert de la trampa', async () => {
    const user = userEvent.setup();
    render(<HiddenElementComponent active={true} />);
    const visible1 = screen.getByTestId('visible-1');
    const visible2 = screen.getByTestId('visible-2');

    expect(document.activeElement).toBe(visible1);

    await user.tab();
    expect(document.activeElement).toBe(visible2);
  });

  it('recalcula elementos dinámicamente cuando cambia el DOM', async () => {
    const user = userEvent.setup();
    render(<DynamicTestComponent active={true} />);
    const trigger = screen.getByTestId('btn-trigger');
    
    await user.click(trigger);
    
    const extra = screen.getByTestId('btn-extra');
    expect(extra).toBeDefined();
    
    trigger.focus();
    await user.tab();
    expect(document.activeElement).toBe(screen.getByTestId('btn1'));
  });

  it('no reinstala listeners defectuosamente cuando cambia el callback onEscape', async () => {
    const user = userEvent.setup();
    const onEscape1 = vi.fn();
    const onEscape2 = vi.fn();

    const { rerender } = render(<TestComponent active={true} onEscape={onEscape1} />);
    
    rerender(<TestComponent active={true} onEscape={onEscape2} />);
    
    await user.keyboard('{Escape}');
    
    expect(onEscape1).not.toHaveBeenCalled();
    expect(onEscape2).toHaveBeenCalledTimes(1);
  });
});
