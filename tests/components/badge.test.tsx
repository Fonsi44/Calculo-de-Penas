// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from '../../components/ui/badge';

describe('Badge', () => {
  it('renderiza el texto', () => {
    render(<Badge>Test</Badge>);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('aplica tone neutral por defecto', () => {
    const { container } = render(<Badge>Neutral</Badge>);
    expect(container.firstChild).toHaveClass('bg-surface-alt');
  });

  it('aplica tone aggravation', () => {
    const { container } = render(<Badge tone="aggravation">Agrave</Badge>);
    expect(container.firstChild).toHaveClass('bg-aggravation-bg');
  });

  it('aplica tone mitigation', () => {
    const { container } = render(<Badge tone="mitigation">Atenua</Badge>);
    expect(container.firstChild).toHaveClass('bg-mitigation-bg');
  });

  it('aplica tone exemption', () => {
    const { container } = render(<Badge tone="exemption">Exime</Badge>);
    expect(container.firstChild).toHaveClass('bg-exemption-bg');
  });

  it('aplica variant outline', () => {
    const { container } = render(<Badge variant="outline">Outline</Badge>);
    expect(container.firstChild).toHaveClass('border');
  });

  it('aplica variant solid', () => {
    const { container } = render(<Badge variant="solid">Solid</Badge>);
    expect(container.firstChild).toHaveClass('text-white');
  });

  it('aplica size sm por defecto', () => {
    const { container } = render(<Badge>Small</Badge>);
    expect(container.firstChild).toHaveClass('text-[11px]');
  });
});
