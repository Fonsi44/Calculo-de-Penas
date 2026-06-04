// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../../components/ui/button';

describe('Button', () => {
  it('renderiza el texto', () => {
    render(<Button>Click</Button>);
    expect(screen.getByText('Click')).toBeInTheDocument();
  });

  it('aplica variant primary por defecto', () => {
    const { container } = render(<Button>Primary</Button>);
    expect(container.firstChild).toHaveClass('bg-primary');
  });

  it('aplica variant secondary', () => {
    const { container } = render(<Button variant="secondary">Sec</Button>);
    expect(container.firstChild).toHaveClass('border-border');
  });

  it('aplica variant danger', () => {
    const { container } = render(<Button variant="danger">Danger</Button>);
    expect(container.firstChild).toHaveClass('bg-danger');
  });

  it('aplica fullWidth', () => {
    const { container } = render(<Button fullWidth>Full</Button>);
    expect(container.firstChild).toHaveClass('w-full');
  });

  it('renderiza loading spinner en lugar de iconLeft', () => {
    const { container } = render(<Button loading iconLeft={<span>icon</span>}>Load</Button>);
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('disabled cuando loading', () => {
    render(<Button loading>Load</Button>);
    expect(screen.getByText('Load').closest('button')).toBeDisabled();
  });

  it('disabled por prop', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByText('Disabled').closest('button')).toBeDisabled();
  });

  it('llama onClick al hacer click', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click</Button>);
    await userEvent.click(screen.getByText('Click'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('no llama onClick cuando disabled', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick} disabled>Click</Button>);
    await userEvent.click(screen.getByText('Click'));
    expect(onClick).not.toHaveBeenCalled();
  });
});
