/**
 * Grid premium de 3 columnas para los 13 servicios jurídicos generales.
 * Acepta un `query` opcional para filtrado client-side.
 */

'use client';

import { useState, useMemo } from 'react';
import { premiumServices, searchServices } from '@/lib/data/service-catalog';
import { PremiumServiceCard } from './premium-service-card';

export function PremiumServiceGrid() {
  const [query, setQuery] = useState('');
  const results = useMemo(() => searchServices(query), [query]);

  return (
    <div>
      <div className="mb-6 max-w-md">
        <label htmlFor="service-search" className="sr-only">
          Buscar servicio jurídico
        </label>
        <input
          id="service-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar área jurídica..."
          className="w-full h-11 px-4 rounded-lg border border-slate-200 bg-white text-sm text-text placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        />
      </div>
      {results.length === 0 ? (
        <p className="py-10 text-center text-text-secondary">
          No se encontraron servicios para «{query}».
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {results.map((s) => (
            <PremiumServiceCard
              key={s.slug}
              service={s}
              href={`/servicios-juridicos/${s.slug}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function PremiumServiceGridStatic() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {premiumServices.map((s) => (
        <PremiumServiceCard
          key={s.slug}
          service={s}
          href={`/servicios-juridicos/${s.slug}`}
        />
      ))}
    </div>
  );
}
