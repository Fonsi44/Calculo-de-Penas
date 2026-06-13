'use client';

import { useState } from 'react';

export function LocalConsultForm({ location }: { location?: string }) {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ nombre: '', telefono: '', mensaje: '' });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch('/api/consulta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: form.nombre,
          telefono: form.telefono,
          motivo: 'consulta-local',
          resumen: form.mensaje + (location ? ` — Consulta desde: ${location}` : ''),
        }),
      });
      if (res.ok) setSent(true);
    } catch { /* */ }
  }

  if (sent) return (
    <div className="rounded-lg border border-success/30 bg-success/5 p-5 text-center">
      <p className="font-bold text-success">✓ Solicitud enviada</p>
      <p className="text-sm text-text-secondary mt-1">Le contactaremos pronto.</p>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-border/30 bg-surface p-5 space-y-4">
      <p className="font-bold text-text text-sm">Solicite una evaluación inicial{location ? ` en ${location}` : ''}</p>
      <div>
        <input
          type="text" placeholder="Su nombre" required
          value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })}
          className="w-full px-3 py-2 border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 bg-white"
        />
      </div>
      <div>
        <input
          type="tel" placeholder="Su teléfono" required
          value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })}
          className="w-full px-3 py-2 border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 bg-white"
        />
      </div>
      <div>
        <textarea
          placeholder="Describa brevemente su situación" rows={2} required
          value={form.mensaje} onChange={(e) => setForm({ ...form, mensaje: e.target.value })}
          className="w-full px-3 py-2 border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 bg-white resize-none"
        />
      </div>
      <button
        type="submit"
        className="w-full h-10 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary-light transition-colors"
      >
        Enviar solicitud
      </button>
    </form>
  );
}
