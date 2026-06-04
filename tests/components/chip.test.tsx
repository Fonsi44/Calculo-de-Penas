// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Chip } from '../../components/ui/chip';

describe('Chip', () => {
  it('renderiza el texto', () => {
    render(<Chip>Test</Chip>);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('tiene role switch y aria-checked=false por defecto', () => {
    render(<Chip>Default</Chip>);
    const btn = screen.getByRole('switch');
    expect(btn).toHaveAttribute('aria-checked', 'false');
  });

  it('aria-checked=true cuando selected', () => {
    render(<Chip selected>Selected</Chip>);
    const btn = screen.getByRole('switch');
    expect(btn).toHaveAttribute('aria-checked', 'true');
  });

  it('llama onClick al hacer click', async () => {
    const onClick = vi.fn();
    render(<Chip onClick={onClick}>Click</Chip>);
    await userEvent.click(screen.getByText('Click'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('aplica tone mitigation cuando selected', () => {
    const { container } = render(<Chip tone="mitigation" selected>Mit</Chip>);
    expect(container.firstChild).toHaveClass('bg-mitigation-bg');
  });

  it('aplica tone aggravation cuando selected', () => {
    const { container } = render(<Chip tone="aggravation" selected>Agg</Chip>);
    expect(container.firstChild).toHaveClass('bg-aggravation-bg');
  });
});
