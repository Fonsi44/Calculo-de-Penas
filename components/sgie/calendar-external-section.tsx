'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Calendar,
  Copy,
  Check,
  Link,
  RotateCw,
  Trash2,
  Shield,
  Server,
  RefreshCw,
  AlertTriangle,
  Unlink,
  ChevronDown,
} from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner, CenteredSpinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import { useConfirm } from '@/components/ui/confirm';
import { usePromptDialog } from '@/components/ui/prompt-dialog';
import { cn } from '@/lib/ui';

// ─── Tipos ──────────────────────────────────────────────────────────────────

interface FeedData {
  token: string;
  url: string;
  estado: 'activo' | 'revocado';
}

interface SandboxConnection {
  id: string;
  provider: string;
  estado: 'activo' | 'desconectado' | 'error';
  lastSyncAt: string | null;
  lastSuccessfulSyncAt: string | null;
}

interface ConflictItem {
  id: string;
  internalEventId: string;
  eventoTitulo: string;
  campo: string;
  valorSgie: string;
  valorExterno: string;
  conflictState: string;
}

type PrivacyMode = 'minimo' | 'ampliado';

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatTimestamp(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('es-HN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

const PRIVACY_LABELS: Record<PrivacyMode, string> = {
  minimo: 'Mínimo — solo títulos',
  ampliado: 'Ampliado — títulos + descripción',
};

// ─── Componente ─────────────────────────────────────────────────────────────

export function CalendarExternalSection({ userId }: { userId: string }) {
  const toast = useToast();
  const confirm = useConfirm();
  const prompt = usePromptDialog();

  // ICS Feed
  const [feed, setFeed] = useState<FeedData | null>(null);
  const [feedLoading, setFeedLoading] = useState(true);
  const [feedAction, setFeedAction] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Privacy
  const [privacy, setPrivacy] = useState<PrivacyMode>('minimo');
  const [privacySaving, setPrivacySaving] = useState(false);

  // Sandbox
  const [sandbox, setSandbox] = useState<SandboxConnection | null>(null);
  const [sandboxLoading, setSandboxLoading] = useState(true);
  const [sandboxAction, setSandboxAction] = useState<string | null>(null);

  // Conflicts
  const [conflicts, setConflicts] = useState<ConflictItem[]>([]);
  const [conflictsLoading, setConflictsLoading] = useState(true);
  const [conflictAction, setConflictAction] = useState<string | null>(null);

  // ─── Carga inicial ───────────────────────────────────────────────────────

  const cargarFeed = useCallback(async () => {
    setFeedLoading(true);
    try {
      const res = await fetch(`/api/sgie/agenda/ics/feed/status`);
      if (res.ok) {
        const data = await res.json();
        setFeed(data);
      }
    } catch {
      // Sin feed
    } finally {
      setFeedLoading(false);
    }
  }, []);

  const cargarPrivacy = useCallback(async () => {
    try {
      const res = await fetch(`/api/sgie/agenda/ics/privacy`);
      if (res.ok) {
        const data = await res.json();
        setPrivacy(data.mode ?? 'minimo');
      }
    } catch {
      // default
    }
  }, []);

  const cargarSandbox = useCallback(async () => {
    setSandboxLoading(true);
    try {
      const res = await fetch(`/api/sgie/agenda/sandbox/status`);
      if (res.ok) {
        const data = await res.json();
        setSandbox(data.connection ?? null);
      }
    } catch {
      // Sin conexión
    } finally {
      setSandboxLoading(false);
    }
  }, []);

  const cargarConflictos = useCallback(async () => {
    setConflictsLoading(true);
    try {
      const res = await fetch(`/api/sgie/agenda/conflicts`);
      if (res.ok) {
        const data = await res.json();
        setConflicts(data.conflicts ?? []);
      }
    } catch {
      setConflicts([]);
    } finally {
      setConflictsLoading(false);
    }
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect -- carga inicial */
  useEffect(() => {
    cargarFeed();
    cargarPrivacy();
    cargarSandbox();
    cargarConflictos();
  }, [cargarFeed, cargarPrivacy, cargarSandbox, cargarConflictos]);

  // ─── Acciones ICS Feed ───────────────────────────────────────────────────

  async function crearFeed() {
    setFeedAction('create');
    try {
      const res = await fetch('/api/sgie/agenda/ics/feed', { method: 'POST' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Error al crear el feed' }));
        throw new Error(err.error);
      }
      const data = await res.json();
      setFeed({ token: data.token, url: data.url, estado: 'activo' });
      toast.success('Feed ICS activado', 'El feed está disponible para suscripción externa.');
    } catch (err) {
      toast.danger('Error', (err as Error).message);
    } finally {
      setFeedAction(null);
    }
  }

  async function rotarFeed() {
    const ok = await confirm({
      title: 'Rotar token del feed',
      description: 'El token actual será invalidado y se generará uno nuevo. Los suscriptores deberán actualizar la URL.',
      confirmLabel: 'Rotar',
      tone: 'warning',
    });
    if (!ok) return;

    setFeedAction('rotate');
    try {
      const res = await fetch('/api/sgie/agenda/ics/feed', { method: 'POST' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Error al rotar el token' }));
        throw new Error(err.error);
      }
      const data = await res.json();
      setFeed({ token: data.token, url: data.url, estado: 'activo' });
      toast.success('Token rotado', 'El nuevo feed está activo. Actualiza la URL en tus calendarios.');
    } catch (err) {
      toast.danger('Error', (err as Error).message);
    } finally {
      setFeedAction(null);
    }
  }

  async function revocarFeed() {
    const ok = await confirm({
      title: 'Revocar feed ICS',
      description: 'El feed será desactivado permanentemente. Los suscriptores externos perderán el acceso.',
      confirmLabel: 'Revocar',
      tone: 'danger',
    });
    if (!ok) return;

    setFeedAction('revoke');
    try {
      const res = await fetch('/api/sgie/agenda/ics/feed', { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Error al revocar el feed' }));
        throw new Error(err.error);
      }
      setFeed({ ...feed!, estado: 'revocado' });
      toast.info('Feed revocado', 'El feed externo ha sido desactivado.');
    } catch (err) {
      toast.danger('Error', (err as Error).message);
    } finally {
      setFeedAction(null);
    }
  }

  function copiarUrl(url: string) {
    navigator.clipboard.writeText(`${window.location.origin}${url}`).then(() => {
      setCopied(true);
      toast.success('Copiado', 'URL del feed copiada al portapapeles.');
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      toast.danger('Error', 'No se pudo copiar la URL.');
    });
  }

  // ─── Acciones Privacy ────────────────────────────────────────────────────

  async function cambiarPrivacy(mode: PrivacyMode) {
    setPrivacy(mode);
    setPrivacySaving(true);
    try {
      const res = await fetch('/api/sgie/agenda/ics/privacy', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Error al guardar' }));
        throw new Error(err.error);
      }
      toast.success('Privacidad actualizada', PRIVACY_LABELS[mode]);
    } catch (err) {
      toast.danger('Error', (err as Error).message);
    } finally {
      setPrivacySaving(false);
    }
  }

  // ─── Acciones Sandbox ────────────────────────────────────────────────────

  async function conectarSandbox() {
    setSandboxAction('connect');
    try {
      const res = await fetch('/api/sgie/agenda/sandbox/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'sandbox' }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Error al conectar' }));
        throw new Error(err.error);
      }
      const data = await res.json();
      setSandbox(data.connection ?? null);
      toast.success('Conexión sandbox creada', 'El entorno de desarrollo está sincronizado.');
    } catch (err) {
      toast.danger('Error', (err as Error).message);
    } finally {
      setSandboxAction(null);
    }
  }

  async function sincronizarSandbox() {
    setSandboxAction('sync');
    try {
      const res = await fetch('/api/sgie/agenda/sandbox/sync', { method: 'POST' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Error al sincronizar' }));
        throw new Error(err.error);
      }
      setSandbox(prev => prev ? { ...prev, lastSyncAt: new Date().toISOString(), lastSuccessfulSyncAt: new Date().toISOString() } : prev);
      toast.success('Sincronización completada', 'Los eventos fueron sincronizados con el sandbox.');
      cargarConflictos();
    } catch (err) {
      toast.danger('Error', (err as Error).message);
    } finally {
      setSandboxAction(null);
    }
  }

  async function desconectarSandbox() {
    const ok = await confirm({
      title: 'Desconectar sandbox',
      description: 'Se eliminará la conexión con el calendario sandbox de desarrollo.',
      confirmLabel: 'Desconectar',
      tone: 'danger',
    });
    if (!ok) return;

    setSandboxAction('disconnect');
    try {
      const res = await fetch('/api/sgie/agenda/sandbox/disconnect', { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Error al desconectar' }));
        throw new Error(err.error);
      }
      setSandbox(null);
      toast.info('Sandbox desconectado', 'La conexión de desarrollo ha sido eliminada.');
    } catch (err) {
      toast.danger('Error', (err as Error).message);
    } finally {
      setSandboxAction(null);
    }
  }

  // ─── Acciones Conflictos ─────────────────────────────────────────────────

  async function resolverConflicto(conflictId: string, resolution: 'accept_external' | 'keep_internal' | 'ignore') {
    const labels = {
      accept_external: 'Aceptando cambio externo…',
      keep_internal: 'Restaurando versión SGIE…',
      ignore: 'Ignorando conflicto…',
    };

    setConflictAction(conflictId);
    try {
      let motivo: string | undefined;
      if (resolution === 'ignore') {
        const motivoInput = await prompt({
          title: 'Motivo para ignorar el conflicto',
          description: 'Indica por qué se ignora este conflicto de sincronización.',
          placeholder: 'Ej. Confirmado con el cliente por teléfono…',
          confirmLabel: 'Ignorar con motivo',
          tone: 'warning',
          maxLength: 500,
        });
        if (motivoInput === null) return;
        motivo = motivoInput;
      }

      const res = await fetch(`/api/sgie/agenda/conflicts/${conflictId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolution, motivo }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Error al resolver conflicto' }));
        throw new Error(err.error);
      }

      setConflicts(prev => prev.filter(c => c.id !== conflictId));
      toast.success(
        resolution === 'accept_external' ? 'Cambio externo aceptado' :
        resolution === 'keep_internal' ? 'Versión SGIE restaurada' :
        'Conflicto ignorado'
      );
    } catch (err) {
      if ((err as Error).message) {
        toast.danger('Error', (err as Error).message);
      }
    } finally {
      setConflictAction(null);
    }
  }

  // ─── JSX ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* ── ICS Feed ──────────────────────────────────────────────────── */}
      <Card>
        <CardHeader
          title={
            <span className="flex items-center gap-2">
              <Link size={16} className="text-text-secondary" />
              Feed ICS externo
            </span>
          }
          subtitle="Suscripción a tu agenda desde Google Calendar, Outlook u otras apps."
        />

        {feedLoading ? (
          <CenteredSpinner label="Cargando configuración del feed…" />
        ) : !feed ? (
          <EmptyState
            icon={<Calendar size={32} />}
            title="Sin feed ICS"
            description="Activa el feed para suscribir tus eventos desde aplicaciones externas."
            action={
              <Button
                variant="primary"
                size="sm"
                loading={feedAction === 'create'}
                iconLeft={<Calendar size={14} />}
                onClick={crearFeed}
              >
                Activar feed ICS
              </Button>
            }
          />
        ) : feed.estado === 'revocado' ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-md bg-danger-bg border border-danger/20">
              <AlertTriangle size={18} className="text-danger flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-danger">Feed revocado</p>
                <p className="text-xs text-text-secondary mt-0.5">
                  Los suscriptores externos ya no pueden acceder a este feed.
                </p>
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              loading={feedAction === 'create'}
              onClick={crearFeed}
            >
              Reactivar feed
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge tone="success" variant="soft" size="sm">Activo</Badge>
            </div>

            <div className="flex items-center gap-2 p-2 rounded-md bg-surface-alt border border-border-light">
              <code className="text-xs text-text-secondary flex-1 truncate select-all">
                {typeof window !== 'undefined' ? `${window.location.origin}${feed.url}` : feed.url}
              </code>
              <Button
                variant="ghost"
                size="sm"
                iconLeft={copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                onClick={() => copiarUrl(feed.url)}
              >
                {copied ? 'Copiado' : 'Copiar'}
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                size="sm"
                loading={feedAction === 'rotate'}
                iconLeft={<RotateCw size={14} />}
                onClick={rotarFeed}
              >
                Rotar token
              </Button>
              <Button
                variant="danger"
                size="sm"
                loading={feedAction === 'revoke'}
                iconLeft={<Trash2 size={14} />}
                onClick={revocarFeed}
              >
                Revocar feed
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* ── Privacidad ────────────────────────────────────────────────── */}
      <Card>
        <CardHeader
          title={
            <span className="flex items-center gap-2">
              <Shield size={16} className="text-text-secondary" />
              Política de privacidad del feed
            </span>
          }
          subtitle="Controla cuánta información se comparte en el feed externo."
        />

        <div className="relative">
          <select
            value={privacy}
            disabled={privacySaving}
            onChange={(e) => cambiarPrivacy(e.target.value as PrivacyMode)}
            className="w-full h-10 rounded-md border border-border bg-surface px-3 pr-9 text-sm text-text outline-none transition-all appearance-none cursor-pointer hover:border-border-strong focus:border-accent focus:shadow-[0_0_0_3px_rgba(212,175,55,0.18)] disabled:opacity-60"
          >
            <option value="minimo">{PRIVACY_LABELS.minimo}</option>
            <option value="ampliado">{PRIVACY_LABELS.ampliado}</option>
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            {privacySaving ? (
              <Spinner size="sm" />
            ) : (
              <ChevronDown size={14} className="text-text-muted" />
            )}
          </div>
        </div>

        <p className="text-xs text-text-muted mt-2">
          {privacy === 'minimo'
            ? 'Solo se comparten los títulos de los eventos. Las descripciones permanecen privadas.'
            : 'Se comparten títulos y descripciones. Las notas internas no se incluyen.'}
        </p>
      </Card>

      {/* ── Sandbox (dev) ──────────────────────────────────────────────── */}
      <Card>
        <CardHeader
          title={
            <span className="flex items-center gap-2">
              <Server size={16} className="text-text-secondary" />
              Conexión sandbox
            </span>
          }
          subtitle="Entorno de desarrollo para pruebas de sincronización externa."
        />

        {sandboxLoading ? (
          <CenteredSpinner label="Cargando conexión sandbox…" />
        ) : !sandbox ? (
          <EmptyState
            icon={<Server size={32} />}
            title="Sin conexión sandbox"
            description="Conecta un calendario sandbox para probar la sincronización en desarrollo."
            action={
              <Button
                variant="secondary"
                size="sm"
                loading={sandboxAction === 'connect'}
                iconLeft={<Server size={14} />}
                onClick={conectarSandbox}
              >
                Conectar sandbox
              </Button>
            }
          />
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-xs text-text-muted">Proveedor</span>
                <p className="font-medium text-text">{sandbox.provider}</p>
              </div>
              <div>
                <span className="text-xs text-text-muted">Estado</span>
                <p>
                  <Badge
                    tone={sandbox.estado === 'activo' ? 'success' : sandbox.estado === 'error' ? 'danger' : 'neutral'}
                    variant="soft"
                    size="sm"
                  >
                    {sandbox.estado === 'activo' ? 'Activo' : sandbox.estado === 'error' ? 'Error' : 'Desconectado'}
                  </Badge>
                </p>
              </div>
              <div>
                <span className="text-xs text-text-muted">Última sincronización</span>
                <p className="font-medium text-text">{formatTimestamp(sandbox.lastSyncAt)}</p>
              </div>
              <div>
                <span className="text-xs text-text-muted">Última exitosa</span>
                <p className="font-medium text-text">{formatTimestamp(sandbox.lastSuccessfulSyncAt)}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                size="sm"
                loading={sandboxAction === 'sync'}
                iconLeft={<RefreshCw size={14} />}
                onClick={sincronizarSandbox}
              >
                Sincronizar ahora
              </Button>
              <Button
                variant="danger"
                size="sm"
                loading={sandboxAction === 'disconnect'}
                iconLeft={<Trash2 size={14} />}
                onClick={desconectarSandbox}
              >
                Desconectar
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* ── Conflictos ─────────────────────────────────────────────────── */}
      {conflicts.length > 0 && (
        <Card>
          <CardHeader
            title={
              <span className="flex items-center gap-2">
                <AlertTriangle size={16} className="text-warning" />
                Conflictos de sincronización
              </span>
            }
            subtitle={`${conflicts.length} evento${conflicts.length === 1 ? '' : 's'} con conflicto${conflicts.length === 1 ? '' : 's'} de sincronización.`}
          />

          {conflictsLoading ? (
            <CenteredSpinner label="Cargando conflictos…" />
          ) : (
            <div className="space-y-3">
              {conflicts.map((c) => (
                <div
                  key={c.id}
                  className="rounded-md border border-warning/30 bg-warning-bg/50 p-3 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-text">{c.eventoTitulo}</p>
                      <p className="text-xs text-text-muted mt-0.5">
                        Conflicto en <span className="font-semibold">{c.campo}</span>
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded bg-surface p-2 border border-border-light">
                      <span className="text-text-muted">SGIE</span>
                      <p className="font-medium text-text mt-0.5 break-words">{c.valorSgie || '—'}</p>
                    </div>
                    <div className="rounded bg-surface p-2 border border-border-light">
                      <span className="text-text-muted">Externo</span>
                      <p className="font-medium text-text mt-0.5 break-words">{c.valorExterno || '—'}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={conflictAction === c.id}
                      onClick={() => resolverConflicto(c.id, 'keep_internal')}
                    >
                      {conflictAction === c.id ? (
                        <Spinner size="sm" />
                      ) : (
                        'Restaurar SGIE'
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={conflictAction === c.id}
                      onClick={() => resolverConflicto(c.id, 'ignore')}
                    >
                      Ignorar con motivo
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={conflictAction === c.id}
                      onClick={() => resolverConflicto(c.id, 'accept_external')}
                      iconLeft={<Unlink size={12} />}
                    >
                      Desvincular
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
