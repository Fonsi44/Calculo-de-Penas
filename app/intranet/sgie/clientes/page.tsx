'use client';

/**
 * SGIE — Módulo Clientes (Sprint 0).
 *
 * Listado con búsqueda + alta de cliente. Desbloquea el paso 2 del flujo
 * canónico (alta o detección de cliente existente, §8.1 del plan SGIE).
 *
 * Fuentes:
 *   - GET  /api/sgie/clientes?q=...  (listado con scope por abogado)
 *   - POST /api/sgie/clientes        (alta con detección de duplicados por hash)
 *
 * Diseño: design tokens del sistema (bg-surface, text-primary, border-border-light,
 * text-muted, bg-surface-alt). Sin colores crudos. Responsive.
 *
 * Acciones por fila:
 *   - Crear expediente para el cliente → /intranet/sgie/expedientes?clienteId=...
 *   - (Futuro) ver ficha/expedientes del cliente.
 */
import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Users, Plus, Search, FileSignature, Mail, Phone,
  Contact, Building2, RefreshCw, AlertTriangle, UserPlus,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Textarea, Field } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState, ErrorState } from '@/components/ui/empty-state';
import { TableSkeleton } from '@/components/ui/skeletons';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/app/auth-context';

interface ClienteItem {
  id: string;
  nombre: string;
  identidad: string | null;
  rtn: string | null;
  email: string | null;
  telefono: string | null;
  notas: string | null;
  creadoEn: string | null;
  expedientesCount: number;
}

// Esquema de validación frontend — coherente con POST /api/sgie/clientes.
const MAX = {
  nombre: 300,
  identidad: 50,
  rtn: 50,
  email: 255,
  telefono: 50,
  notas: 2000,
};

interface FormState {
  nombre: string;
  identidad: string;
  rtn: string;
  email: string;
  telefono: string;
  notas: string;
}

const EMPTY_FORM: FormState = {
  nombre: '',
  identidad: '',
  rtn: '',
  email: '',
  telefono: '',
  notas: '',
};

export default function SgieClientesPage() {
  const router = useRouter();
  const toast = useToast();
  const { user, loading: authLoading } = useAuth();
  const [clientes, setClientes] = useState<ClienteItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [q, setQ] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const mounted = useRef(false);

  const fetchClientes = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const params = new URLSearchParams({ limit: '50' });
      if (q) params.set('q', q);
      const res = await fetch(`/api/sgie/clientes?${params}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Error al cargar');
      const data = await res.json();
      setClientes(data.clientes ?? []);
      setTotal(data.total ?? 0);
    } catch {
      setError(true);
      toast.danger('No se pudieron cargar los clientes');
    } finally {
      setLoading(false);
    }
  }, [q, toast]);

  useEffect(() => {
    if (!authLoading && user && !mounted.current) {
      mounted.current = true;
      fetchClientes();
    }
  }, [authLoading, user, fetchClientes]);

  if (authLoading) {
    return <div className="py-6"><TableSkeleton rows={6} columns={5} /></div>;
  }
  if (!user || (user.rol !== 'abogado' && user.rol !== 'admin')) {
    return (
      <div className="text-center py-20">
        <p className="font-bold text-primary">Acceso restringido</p>
        <p className="text-sm text-text-secondary mt-2">Requiere rol de abogado o administrador.</p>
      </div>
    );
  }

  // ─── Validación frontend ────────────────────────────────────────────────
  const validate = (f: FormState): Partial<Record<keyof FormState, string>> => {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!f.nombre.trim()) e.nombre = 'El nombre es obligatorio.';
    else if (f.nombre.length > MAX.nombre) e.nombre = `Máximo ${MAX.nombre} caracteres.`;
    if (f.identidad && f.identidad.length > MAX.identidad) e.identidad = `Máximo ${MAX.identidad} caracteres.`;
    if (f.rtn && f.rtn.length > MAX.rtn) e.rtn = `Máximo ${MAX.rtn} caracteres.`;
    if (f.email) {
      if (f.email.length > MAX.email) e.email = `Máximo ${MAX.email} caracteres.`;
      // Validación simple de email coherente con z.string().email() del endpoint.
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) e.email = 'Email no válido.';
    }
    if (f.telefono && f.telefono.length > MAX.telefono) e.telefono = `Máximo ${MAX.telefono} caracteres.`;
    if (f.notas && f.notas.length > MAX.notas) e.notas = `Máximo ${MAX.notas} caracteres.`;
    return e;
  };

  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = validate(form);
    setErrors(v);
    if (Object.keys(v).length > 0) return;

    setSaving(true);
    try {
      const res = await fetch('/api/sgie/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: form.nombre.trim(),
          identidad: form.identidad.trim() || undefined,
          rtn: form.rtn.trim() || undefined,
          email: form.email.trim() || undefined,
          telefono: form.telefono.trim() || undefined,
          notas: form.notas.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Error al crear el cliente');
      }
      const data = await res.json();
      if (data.creado) {
        toast.success('Cliente creado', data.cliente?.id ? `«${form.nombre}» dado de alta` : undefined);
      } else {
        // El backend detectó duplicado por identidad/RTN y reutilizó el existente.
        toast.info('Cliente existente', `Ya existe un cliente con esa identidad/RTN. Se reutilizó el registro existente.`);
      }
      setShowForm(false);
      setForm(EMPTY_FORM);
      setErrors({});
      fetchClientes();
    } catch (err) {
      toast.danger(err instanceof Error ? err.message : 'Error al crear el cliente');
    } finally {
      setSaving(false);
    }
  };

  const actualizarCampo = (campo: keyof FormState, valor: string) => {
    setForm((f) => ({ ...f, [campo]: valor }));
    if (errors[campo]) setErrors((e) => ({ ...e, [campo]: undefined }));
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Clientes"
        subtitle={`${total} ${total === 1 ? 'cliente' : 'clientes'} ${user.rol === 'admin' ? '(vista administrador)' : 'asignados'}`}
        icon={<Users size={20} className="text-accent" />}
        actions={
          <Button variant="primary" size="sm" onClick={() => setShowForm(!showForm)}>
            <Plus size={14} /> Nuevo cliente
          </Button>
        }
      />

      {/* Formulario de alta */}
      {showForm && (
        <Card padding="md">
          <form onSubmit={handleCrear} className="space-y-1">
            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-border-light">
              <UserPlus size={16} className="text-accent-dark" />
              <h2 className="font-bold text-sm text-primary">Alta de cliente</h2>
            </div>
            <p className="text-xxs text-text-muted mb-3">
              Si la identidad o RTN ya existen, el sistema reutiliza el cliente existente (detección de duplicados).
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
              <Field label="Nombre o razón social" required htmlFor="cli-nombre" error={errors.nombre}>
                <Input
                  id="cli-nombre"
                  value={form.nombre}
                  onChange={(e) => actualizarCampo('nombre', e.target.value)}
                  placeholder="Ej.: María Pérez / Empresa S.A."
                  maxLength={MAX.nombre}
                  invalid={Boolean(errors.nombre)}
                  iconLeft={<Users size={14} />}
                />
              </Field>
              <Field label="Identidad (DNI)" htmlFor="cli-identidad" error={errors.identidad} hint="Persona natural. Se normaliza para detectar duplicados.">
                <Input
                  id="cli-identidad"
                  value={form.identidad}
                  onChange={(e) => actualizarCampo('identidad', e.target.value)}
                  placeholder="0801-1990-01234"
                  maxLength={MAX.identidad}
                  invalid={Boolean(errors.identidad)}
                  iconLeft={<Contact size={14} />}
                />
              </Field>
              <Field label="RTN" htmlFor="cli-rtn" error={errors.rtn} hint="Persona jurídica. Se normaliza para detectar duplicados.">
                <Input
                  id="cli-rtn"
                  value={form.rtn}
                  onChange={(e) => actualizarCampo('rtn', e.target.value)}
                  placeholder="08019998000123"
                  maxLength={MAX.rtn}
                  invalid={Boolean(errors.rtn)}
                  iconLeft={<Building2 size={14} />}
                />
              </Field>
              <Field label="Email" htmlFor="cli-email" error={errors.email}>
                <Input
                  id="cli-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => actualizarCampo('email', e.target.value)}
                  placeholder="cliente@correo.com"
                  maxLength={MAX.email}
                  invalid={Boolean(errors.email)}
                  iconLeft={<Mail size={14} />}
                />
              </Field>
              <Field label="Teléfono" htmlFor="cli-telefono" error={errors.telefono}>
                <Input
                  id="cli-telefono"
                  value={form.telefono}
                  onChange={(e) => actualizarCampo('telefono', e.target.value)}
                  placeholder="+504 9999-0000"
                  maxLength={MAX.telefono}
                  invalid={Boolean(errors.telefono)}
                  iconLeft={<Phone size={14} />}
                />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Notas internas" htmlFor="cli-notas" error={errors.notas}>
                  <Textarea
                    id="cli-notas"
                    value={form.notas}
                    onChange={(e) => actualizarCampo('notas', e.target.value)}
                    placeholder="Observaciones internas (no se envían al cliente)."
                    maxLength={MAX.notas}
                    invalid={Boolean(errors.notas)}
                  />
                </Field>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button type="submit" variant="primary" size="sm" loading={saving}>Crear cliente</Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => { setShowForm(false); setForm(EMPTY_FORM); setErrors({}); }}>
                Cancelar
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Buscador */}
      <form onSubmit={(e) => { e.preventDefault(); fetchClientes(); }} className="flex gap-2">
        <div className="flex-1">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre, identidad, RTN o email..."
            iconLeft={<Search size={14} />}
          />
        </div>
        <Button type="submit" variant="secondary" size="sm">Buscar</Button>
        <Button type="button" variant="ghost" size="sm" onClick={fetchClientes} aria-label="Refrescar">
          <RefreshCw size={14} />
        </Button>
      </form>

      {/* Listado */}
      {loading ? (
        <TableSkeleton rows={6} columns={5} />
      ) : error ? (
        <Card padding="md">
          <ErrorState
            title="No se pudieron cargar los clientes"
            description="Verifique su conexión y vuelva a intentarlo."
            onRetry={fetchClientes}
          />
        </Card>
      ) : clientes.length === 0 ? (
        <Card padding="md">
          <EmptyState
            icon={<Users size={28} />}
            title={q ? 'Sin resultados' : 'Aún no tiene clientes'}
            description={q
              ? 'Pruebe con otros términos de búsqueda.'
              : 'Cree su primer cliente para iniciar el flujo de expedientes.'}
            action={!q ? (
              <Button variant="primary" size="sm" onClick={() => setShowForm(true)}>
                <Plus size={14} /> Nuevo cliente
              </Button>
            ) : undefined}
          />
        </Card>
      ) : (
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-text-secondary">
                  <th className="text-left p-3 text-xxs font-bold uppercase tracking-wider">Nombre</th>
                  <th className="text-left p-3 text-xxs font-bold uppercase tracking-wider hidden sm:table-cell">Identidad / RTN</th>
                  <th className="text-left p-3 text-xxs font-bold uppercase tracking-wider hidden md:table-cell">Contacto</th>
                  <th className="text-left p-3 text-xxs font-bold uppercase tracking-wider hidden lg:table-cell">Creado</th>
                  <th className="text-right p-3 text-xxs font-bold uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {clientes.map((c) => (
                  <tr key={c.id} className="hover:bg-surface-alt transition-colors">
                    <td className="p-3">
                      <Link href={`/intranet/sgie/clientes/${c.id}`} className="flex items-center gap-2.5 min-w-0 group">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                          <Users size={14} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-text truncate group-hover:text-primary transition-colors">{c.nombre}</p>
                          {c.notas && (
                            <p className="text-xxs text-text-muted truncate max-w-[200px]" title={c.notas}>{c.notas}</p>
                          )}
                        </div>
                      </Link>
                    </td>
                    <td className="p-3 text-text-secondary hidden sm:table-cell">
                      <div className="space-y-0.5">
                        {c.identidad && <p className="text-xs font-mono">{c.identidad}</p>}
                        {c.rtn && <p className="text-xxs font-mono text-text-muted">RTN: {c.rtn}</p>}
                        {!c.identidad && !c.rtn && <span className="text-xxs text-text-muted">—</span>}
                      </div>
                    </td>
                    <td className="p-3 hidden md:table-cell">
                      <div className="space-y-0.5">
                        {c.email && (
                          <p className="text-xs text-text-secondary flex items-center gap-1 truncate max-w-[180px]">
                            <Mail size={11} className="text-text-muted flex-shrink-0" /> {c.email}
                          </p>
                        )}
                        {c.telefono && (
                          <p className="text-xxs text-text-muted flex items-center gap-1">
                            <Phone size={10} /> {c.telefono}
                          </p>
                        )}
                        {!c.email && !c.telefono && <span className="text-xxs text-text-muted">—</span>}
                      </div>
                    </td>
                    <td className="p-3 text-xxs text-text-muted hidden lg:table-cell">
                      {c.creadoEn ? formatFechaCortaSegura(c.creadoEn) : '—'}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/intranet/sgie/clientes/${c.id}`}>
                          <Button variant="ghost" size="sm" title={`Ver ficha de ${c.nombre}`}>
                            <span className="hidden sm:inline">Ver</span>
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/intranet/sgie/expedientes?clienteId=${c.id}&clienteNombre=${encodeURIComponent(c.nombre)}`)}
                          title={`Crear expediente para ${c.nombre}`}
                        >
                          <FileSignature size={14} /> <span className="hidden sm:inline">Expediente</span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <div>
        <Link href="/intranet/sgie" className="inline-flex items-center gap-1 text-xs text-text-secondary hover:text-text">
          <AlertTriangle size={12} className="rotate-180" /> Volver al cockpit
        </Link>
      </div>
    </div>
  );
}

/** Formatea una fecha ISO de forma segura sin lanzar. */
function formatFechaCortaSegura(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('es-HN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}
