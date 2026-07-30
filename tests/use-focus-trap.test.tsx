// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
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

describe('useFocusTrap unit tests', () => {
  it('enfoca el primer elemento cuando se activa', () => {
    render(<TestComponent active={true} />);
    const btn1 = screen.getByTestId('btn1');
    expect(document.activeElement).toBe(btn1);
  });

  it('llama a onEscape al presionar la tecla Escape', () => {
    const onEscape = vi.fn();
    render(<TestComponent active={true} onEscape={onEscape} />);
    
    const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
    document.dispatchEvent(event);
    
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

    // Durante la actividad, el foco pasa al interior
    const btn1 = screen.getByTestId('btn1');
    expect(document.activeElement).toBe(btn1);

    // Al desmontar, debe restaurarse al trigger
    unmount();
    expect(document.activeElement).toBe(trigger);

    document.body.removeChild(trigger);
  });
});
