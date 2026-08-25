// @vitest-environment jsdom
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { ServiceSearchEntry } from '@/lib/service-search-index';

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}));

import { HeaderServiceSearch } from '@/components/marketing/header-service-search';

const entries: readonly ServiceSearchEntry[] = [
  {
    title: 'Asesoría legal en la implementación de teletrabajo y jornadas mixtas',
    description: 'Trámite o defensa según el caso. Evaluación inicial confidencial.',
    aliases: ['teletrabajo'],
    areaSlug: 'derecho-laboral',
    areaLabel: 'Derecho Laboral',
    areaHref: '/servicios-juridicos/derecho-laboral',
    icon: 'briefcase',
  },
];

function SearchHarness() {
  const [open, setOpen] = React.useState(false);
  return <HeaderServiceSearch entries={entries} open={open} onOpenChange={setOpen} />;
}

describe('HeaderServiceSearch', () => {
  it('abre el panel al pulsar la lupa y muestra el campo de búsqueda', async () => {
    const user = userEvent.setup();
    render(<SearchHarness />);

    expect(screen.queryByRole('combobox')).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Buscar servicios jurídicos' }));
    expect(screen.getByRole('combobox', { name: 'Buscar servicios jurídicos' })).toBeInTheDocument();
  });

  it('muestra resultados de catálogo y el enlace al blog cuando está abierto', async () => {
    const user = userEvent.setup();
    render(<HeaderServiceSearch entries={entries} open onOpenChange={vi.fn()} />);

    const input = screen.getByRole('combobox', { name: 'Buscar servicios jurídicos' });
    await user.type(input, 'teletrabajo');

    const areaLink = await screen.findByRole('link', { name: /Derecho Laboral/i });
    expect(areaLink).toHaveAttribute('href', '/servicios-juridicos/derecho-laboral');
    expect(screen.getByRole('link', { name: 'Buscar en el blog' })).toHaveAttribute(
      'href',
      '/blog#buscar',
    );
  });
});
