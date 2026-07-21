'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  FileSignature, Plus, Lock, XCircle, RotateCcw, ShieldCheck,
  AlertTriangle, CheckCircle2, FileText, ChevronRight, ChevronLeft,
  Trash2, Hash,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { useToast } from '@/components/ui/toast';
import { useConfirm } from '@/components/ui/confirm';
import { usePromptDialog } from '@/components/ui/prompt-dialog';
import { cn } from '@/lib/ui';

interface SignerInput {
  nombre: string;
  email?: string;
  identificador?: string;
  rolDocumento: string;
  orden: number;
  obligatorio: boolean;
  metodoFuturo?: string;
}

interface DocItem {
  id: string;
  nombreOriginal: string;
  estado: string;
  tipoDocumento?: string | null;
  version?: number;
  hashSha256?: string | null;
  aprobadoPor?: string | null;
}

interface PackageItem {
  documentId: string;
  nombre: string;
  tipoDocumento: string | null;
  version: number;
  hashSha256: string;
  aprobadoPor: string | null;
  aprobadoEn: string | null;
  elegible: boolean;
  codigoNoElegible?: string;
  motivoNoElegible?: string;
}

interface PackageSummary {
  packageId: string;
  expedienteId: string;
  estado: string;
  version: number;
  titulo: string;
  proposito?: string;
  manifestHash: string | null;
  manifestSchemaVersion?: string;
  documentosCount?: number;
  signersCount?: number;
  creadoEn: string;
  congeladoEn?: string | null;
  actorId?: string;
}

interface ManifestEntry {
  documentId: string;
  nombreNormalizado: string;
  versionFrozen: number;
  mime: string | null;
  tamanoBytes: number | null;
  hashSha256: string;
  aprobadoPor: string | null;
  aprobadoEn: string | null;
  orden: number;
  tipoDocumento: string | null;
}

interface PackageDetail {
  pkg: {
    id: string; expedienteId: string; estado: string; version: number;
    titulo: string; proposito?: string; manifestHash: string | null;
    manifestSchemaVersion: string; hashAlgorithm: string;
    manifestJson?: PackageManifest | null;
    congeladoEn: string | null; expiracionEn: string | null;
    canceladoMotivo?: string | null; creadoEn: string;
  };
  items: Array<{
    id: string; documentId: string; nombreNormalizado: string;
    versionFrozen: number; mime: string | null; tamanoBytes: number | null;
    hashSha256: string; aprobadoPor: string | null; orden: number;
    tipoDocumento: string | null;
  }>;
  signers: Array<{
    id: string; nombre: string; email?: string | null;
    rolDocumento: string; orden: number; obligatorio: boolean;
    metodoFuturo?: string | null; estadoValidacion: string;
  }>;
}

interface PackageManifest {
  packageId: string; version: number; expedienteId: string;
  titulo: string; proposito?: string; schemaVersion: string;
  congeladoEn: string; hashAlgorithm: string;
  entries: ManifestEntry[];
  signers: Array<{ nombre: string; email?: string; rolDocumento: string; orden: number; obligatorio: boolean }>;
}

interface IntegrityResult {
  packageId: string; valido: boolean;
  manifestHash: string; computedHash: string;
  entriesOk: number; entriesFail: number;
}

export function SignaturePackagesExp({ expedienteId }: { expedienteId: string }) {
  const toast = useToast();
  const confirm = useConfirm();
  const prompt = usePromptDialog();

  const [packages, setPackages] = useState<PackageSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPkg, setSelectedPkg] = useState<PackageDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [integrity, setIntegrity] = useState<IntegrityResult | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Create flow states
  const [showCreate, setShowCreate] = useState(false);
  const [step, setStep] = useState<'select' | 'signers' | 'preview' | 'confirming'>('select');
  const [docs, setDocs] = useState<DocItem[]>([]);
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());
  const [signers, setSigners] = useState<SignerInput[]>([{ nombre: '', rolDocumento: 'otorgante', orden: 0, obligatorio: true }]);
  const [titulo, setTitulo] = useState('');
  const [previewData, setPreviewData] = useState<{
    packageId: string; previewHash: string; caducidad: string;
    documentos: PackageItem[]; totalElegibles: number; totalNoElegibles: number; advertencias: string[];
  } | null>(null);
  const [createError, setCreateError] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);
  const [docsLoading, setDocsLoading] = useState(false);

  // Fetch packages list
  const fetchPackages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/sgie/expedientes/${expedienteId}/signature-packages`);
      if (res.ok) setPackages(await res.json());
    } catch { /* */ }
    finally { setLoading(false); }
  }, [expedienteId]);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/sgie/expedientes/${expedienteId}/signature-packages`)
      .then(async (res) => {
        if (!cancelled && res.ok) setPackages(await res.json());
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [expedienteId]);

  // Fetch package detail
  const fetchDetail = async (packageId: string) => {
    setDetailLoading(true);
    setIntegrity(null);
    try {
      const res = await fetch(`/api/sgie/expedientes/${expedienteId}/signature-packages/${packageId}`);
      if (res.ok) setSelectedPkg(await res.json());
      else throw new Error((await res.json()).error);
    } catch (e) { toast.danger(e instanceof Error ? e.message : 'Error'); }
    finally { setDetailLoading(false); }
  };

  // Verify integrity
  const handleVerify = async (packageId: string) => {
    setActionLoading(`verify-${packageId}`);
    try {
      const res = await fetch(`/api/sgie/expedientes/${expedienteId}/signature-packages/${packageId}/verify`);
      const data = await res.json();
      setIntegrity(data);
      if (data.valido) toast.success('Integridad verificada');
      else toast.danger('Integridad fallida — el manifiesto fue alterado');
    } catch { toast.danger('Error al verificar'); }
    finally { setActionLoading(null); }
  };

  // Lock
  const handleLock = async (packageId: string) => {
    const ok = await confirm({ title: 'Bloquear paquete', description: 'El paquete quedará bloqueado y listo para entrega a P2-09. No podrá modificarse.', tone: 'warning' });
    if (!ok) return;
    setActionLoading(`lock-${packageId}`);
    try {
      const res = await fetch(`/api/sgie/expedientes/${expedienteId}/signature-packages/${packageId}/lock`, { method: 'POST' });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success('Paquete bloqueado');
      fetchPackages();
      if (selectedPkg) fetchDetail(packageId);
    } catch (e) { toast.danger(e instanceof Error ? e.message : 'Error'); }
    finally { setActionLoading(null); }
  };

  // Cancel
  const handleCancel = async (packageId: string) => {
    const motivo = await prompt({ title: 'Cancelar paquete', description: 'Indique el motivo de cancelación.', confirmLabel: 'Cancelar paquete', tone: 'danger', minLength: 10, maxLength: 500, multiline: true });
    if (!motivo) return;
    setActionLoading(`cancel-${packageId}`);
    try {
      const res = await fetch(`/api/sgie/expedientes/${expedienteId}/signature-packages/${packageId}/cancel`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motivo }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success('Paquete cancelado');
      fetchPackages();
      if (selectedPkg) fetchDetail(packageId);
    } catch (e) { toast.danger(e instanceof Error ? e.message : 'Error'); }
    finally { setActionLoading(null); }
  };

  // Supersede
  const handleSupersede = async (packageId: string) => {
    const motivo = await prompt({ title: 'Crear nueva versión', description: 'Se creará una copia del paquete en estado draft con versión incrementada. Indique el motivo.', confirmLabel: 'Crear nueva versión', tone: 'primary', minLength: 10, maxLength: 500, multiline: true });
    if (!motivo) return;
    setActionLoading(`supersede-${packageId}`);
    try {
      const res = await fetch(`/api/sgie/expedientes/${expedienteId}/signature-packages/${packageId}/supersede`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motivo }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success('Nueva versión creada');
      fetchPackages();
    } catch (e) { toast.danger(e instanceof Error ? e.message : 'Error'); }
    finally { setActionLoading(null); }
  };

  // ─── Create flow ──────────────────────────────────────────────────────────

  const fetchDocs = async () => {
    setDocsLoading(true);
    try {
      const res = await fetch(`/api/sgie/documentos?expedienteId=${expedienteId}&limit=100`);
      if (res.ok) {
        const data = await res.json();
        setDocs((data.documentos ?? []).filter((d: DocItem) => d.estado === 'aprobado'));
      }
    } catch { /* */ }
    finally { setDocsLoading(false); }
  };

  const openCreate = () => {
    setShowCreate(true);
    setStep('select');
    setSelectedDocs(new Set());
    setSigners([{ nombre: '', rolDocumento: 'otorgante', orden: 0, obligatorio: true }]);
    setTitulo('');
    setPreviewData(null);
    setCreateError('');
    fetchDocs();
  };

  const generatePreview = async () => {
    if (!titulo.trim() || titulo.length < 3) { setCreateError('Título requerido (mín. 3 caracteres)'); return; }
    if (selectedDocs.size === 0) { setCreateError('Seleccione al menos un documento'); return; }
    const validSigners = signers.filter(s => s.nombre.trim());
    for (const s of validSigners) {
      if (!s.rolDocumento.trim()) { setCreateError('Todos los firmantes necesitan un rol'); return; }
    }
    const nombres = validSigners.map(s => s.nombre.trim().toLowerCase());
    if (new Set(nombres).size !== nombres.length) { setCreateError('Hay firmantes duplicados'); return; }

    setStep('preview');
    setCreateError('');

    try {
      const res = await fetch(`/api/sgie/expedientes/${expedienteId}/signature-packages/preview`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentIds: Array.from(selectedDocs),
          titulo: titulo.trim(),
          signers: validSigners.map((s, i) => ({
            nombre: s.nombre.trim(),
            email: s.email?.trim() || undefined,
            identificador: s.identificador?.trim() || undefined,
            rolDocumento: s.rolDocumento.trim(),
            orden: i,
            obligatorio: s.obligatorio,
            metodoFuturo: s.metodoFuturo?.trim() || undefined,
          })),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        setCreateError(err.error || 'Error al generar preview');
        setStep('select');
        return;
      }
      setPreviewData(await res.json());
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : 'Error');
      setStep('select');
    }
  };

  const confirmPackage = async () => {
    if (!previewData) return;
    setIsConfirming(true);
    try {
      const idemKey = `ui-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      const res = await fetch(`/api/sgie/expedientes/${expedienteId}/signature-packages/confirm`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId: previewData.packageId, idempotencyKey: idemKey, previewHash: previewData.previewHash }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success('Paquete creado y congelado');
      setShowCreate(false);
      fetchPackages();
    } catch (e) {
      toast.danger(e instanceof Error ? e.message : 'Error');
      setStep('preview');
    } finally { setIsConfirming(false); }
  };

  const toggleDoc = (docId: string) => {
    const next = new Set(selectedDocs);
    if (next.has(docId)) next.delete(docId); else next.add(docId);
    setSelectedDocs(next);
  };

  const updateSigner = (idx: number, field: string, value: string | boolean) => {
    setSigners(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  };

  const removeSigner = (idx: number) => {
    setSigners(prev => prev.filter((_, i) => i !== idx).map((s, i) => ({ ...s, orden: i })));
  };

  const addSigner = () => {
    setSigners(prev => [...prev, { nombre: '', rolDocumento: 'testigo', orden: prev.length, obligatorio: false }]);
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  const pkg = selectedPkg?.pkg;
  const pkgItems = selectedPkg?.items ?? [];
  const pkgSigners = selectedPkg?.signers ?? [];

  return (
    <Card padding="none">
      <div className="flex items-center justify-between p-3 border-b border-border-light">
        <div className="flex items-center gap-2">
          <FileSignature size={16} className="text-accent-dark" />
          <h2 className="text-sm font-bold text-text">Paquetes para firma ({packages.length})</h2>
        </div>
        <Button variant="secondary" size="sm" onClick={openCreate}>
          <Plus size={14} /> Nuevo paquete
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Spinner size="sm" /></div>
      ) : packages.length === 0 ? (
        <div className="p-4">
          <EmptyState icon={<FileSignature size={24} />} title="Sin paquetes de firma"
            description="Cree un paquete seleccionando documentos aprobados y configurando firmantes."
            action={<Button variant="primary" size="sm" onClick={openCreate}><Plus size={14} /> Nuevo paquete</Button>} />
        </div>
      ) : (
        <div>
          {/* Package list */}
          <div className="divide-y divide-border-light max-h-96 overflow-y-auto">
            {packages.map((sp) => (
              <div key={sp.packageId}
                className={cn('p-3 cursor-pointer hover:bg-surface-alt/50 transition-colors',
                  selectedPkg?.pkg?.id === sp.packageId && 'bg-surface-alt')}
                onClick={() => fetchDetail(sp.packageId)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={cn('text-xs font-semibold', estadoColor(sp.estado))}>{estadoLabel(sp.estado)}</span>
                    <span className="text-sm text-text truncate">{sp.titulo}</span>
                    <span className="text-xxs text-text-muted">v{sp.version}</span>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {sp.manifestHash && (
                      <span className="text-xxs text-text-muted font-mono" title={sp.manifestHash}>
                        #{sp.manifestHash.slice(0, 8)}
                      </span>
                    )}
                    <ChevronRight size={14} className="text-text-muted" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Package detail */}
          {selectedPkg && (
            <div className="border-t border-border-light p-3 bg-surface-alt/30">
              {detailLoading ? (
                <div className="flex justify-center py-4"><Spinner size="sm" /></div>
              ) : pkg ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className={cn('text-xs font-semibold', estadoColor(pkg.estado))}>{estadoLabel(pkg.estado)}</span>
                      <span className="text-sm text-text ml-2">{pkg.titulo}</span>
                      <span className="text-xxs text-text-muted ml-1">v{pkg.version}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleVerify(pkg.id)}
                        loading={actionLoading === `verify-${pkg.id}`} title="Verificar integridad">
                        <ShieldCheck size={12} />
                      </Button>
                      {pkg.estado === 'ready' && (
                        <Button variant="ghost" size="sm" onClick={() => handleLock(pkg.id)}
                          loading={actionLoading === `lock-${pkg.id}`} title="Bloquear para entrega">
                          <Lock size={12} />
                        </Button>
                      )}
                      {(pkg.estado === 'ready' || pkg.estado === 'locked') && (
                        <>
                          <Button variant="ghost" size="sm" onClick={() => handleCancel(pkg.id)}
                            loading={actionLoading === `cancel-${pkg.id}`} title="Cancelar">
                            <XCircle size={12} />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleSupersede(pkg.id)}
                            loading={actionLoading === `supersede-${pkg.id}`} title="Nueva versión">
                            <RotateCcw size={12} />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Integrity result */}
                  {integrity && integrity.packageId === pkg.id && (
                    <div className={cn('flex items-center gap-2 p-2 rounded text-xs', integrity.valido ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger')}>
                      {integrity.valido ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                      {integrity.valido ? 'Manifiesto íntegro — hash coincide' : `Integridad fallida: ${integrity.manifestHash.slice(0, 12)}… ≠ ${integrity.computedHash.slice(0, 12)}…`}
                    </div>
                  )}

                  {/* Docs */}
                  <div>
                    <p className="text-xxs text-text-muted mb-1 font-semibold uppercase">Documentos congelados ({pkgItems.length})</p>
                    <div className="space-y-1">
                      {pkgItems.map((item) => (
                        <div key={item.id} className="flex items-center gap-2 text-xs text-text">
                          <FileText size={12} className="text-text-muted flex-shrink-0" />
                          <span className="truncate">{item.nombreNormalizado}</span>
                          <span className="text-text-muted">v{item.versionFrozen}</span>
                          <span className="text-xxs text-text-muted font-mono">{item.hashSha256?.slice(0, 8)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Signers */}
                  <div>
                    <p className="text-xxs text-text-muted mb-1 font-semibold uppercase">Firmantes ({pkgSigners.length})</p>
                    <div className="space-y-1">
                      {pkgSigners.map((s) => (
                        <div key={s.id} className="flex items-center gap-2 text-xs text-text">
                          <span>{s.nombre}</span>
                          <span className="text-text-muted">· {s.rolDocumento}</span>
                          {s.obligatorio && <span className="text-xxs text-warning">obligatorio</span>}
                          <span className="text-xxs text-text-muted">#{s.orden}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Manifest hash */}
                  {pkg.manifestHash && (
                    <div className="flex items-center gap-2 text-xxs text-text-muted">
                      <Hash size={10} />
                      <span className="font-mono">{pkg.manifestHash}</span>
                      <span className="text-text-muted">({pkg.hashAlgorithm})</span>
                    </div>
                  )}

                  {pkg.canceladoMotivo && (
                    <p className="text-xxs text-text-muted">Cancelado: {pkg.canceladoMotivo}</p>
                  )}
                </div>
              ) : null}
            </div>
          )}
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={(e) => { if (e.target === e.currentTarget) setShowCreate(false); }}
          onKeyDown={(e) => { if (e.key === 'Escape') setShowCreate(false); }}>
          <div className="bg-surface rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4 p-6" role="dialog" aria-label="Crear paquete de firma">
            <h3 className="text-lg font-bold text-text mb-4">
              {step === 'select' && 'Seleccionar documentos'}
              {step === 'signers' && 'Configurar firmantes'}
              {step === 'preview' && 'Revisar manifiesto'}
              {step === 'confirming' && 'Confirmando...'}
            </h3>

            {step === 'select' && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-text-secondary block mb-1">Título del paquete</label>
                  <input className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-surface text-text" placeholder="Ej: Poder notarial para trámite registral" value={titulo} onChange={e => setTitulo(e.target.value)} />
                </div>
                {docsLoading ? <Spinner size="sm" /> : docs.length === 0 ? (
                  <p className="text-sm text-text-secondary">No hay documentos aprobados en este expediente.</p>
                ) : (
                  <div className="space-y-1 max-h-64 overflow-y-auto">
                    {docs.map(d => (
                      <div key={d.id} className={cn('flex items-center gap-2 p-2 rounded cursor-pointer border', selectedDocs.has(d.id) ? 'bg-accent/10 border-accent' : 'border-border hover:bg-surface-alt')}
                        onClick={() => toggleDoc(d.id)}>
                        <input type="checkbox" checked={selectedDocs.has(d.id)} onChange={() => {}} className="w-4 h-4" />
                        <FileText size={14} className="text-text-muted flex-shrink-0" />
                        <span className="text-sm text-text flex-1 truncate">{d.nombreOriginal}</span>
                        {d.tipoDocumento && <span className="text-xxs text-text-muted">{d.tipoDocumento}</span>}
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex justify-between">
                  <Button variant="ghost" size="sm" onClick={() => setShowCreate(false)}>Cancelar</Button>
                  <Button variant="primary" size="sm" onClick={() => setStep('signers')} disabled={selectedDocs.size === 0 || !titulo.trim()}>
                    Continuar <ChevronRight size={14} />
                  </Button>
                </div>
              </div>
            )}

            {step === 'signers' && (
              <div className="space-y-4">
                {signers.map((s, idx) => (
                  <div key={idx} className="flex items-start gap-2 p-2 border border-border rounded-lg">
                    <div className="flex-1 space-y-2">
                      <input className="w-full text-sm border border-border rounded px-2 py-1 bg-surface text-text" placeholder="Nombre completo" value={s.nombre} onChange={e => updateSigner(idx, 'nombre', e.target.value)} />
                      <div className="flex gap-2">
                        <input className="flex-1 text-xs border border-border rounded px-2 py-1 bg-surface text-text" placeholder="Email (opcional)" value={s.email ?? ''} onChange={e => updateSigner(idx, 'email', e.target.value)} />
                        <input className="flex-1 text-xs border border-border rounded px-2 py-1 bg-surface text-text" placeholder="Rol (ej: otorgante)" value={s.rolDocumento} onChange={e => updateSigner(idx, 'rolDocumento', e.target.value)} />
                      </div>
                      <label className="flex items-center gap-1 text-xs text-text-secondary">
                        <input type="checkbox" checked={s.obligatorio} onChange={e => updateSigner(idx, 'obligatorio', e.target.checked)} />
                        Obligatorio
                      </label>
                    </div>
                    {signers.length > 1 && (
                      <button onClick={() => removeSigner(idx)} className="p-1 text-danger hover:bg-danger/10 rounded"><Trash2 size={14} /></button>
                    )}
                  </div>
                ))}
                <Button variant="ghost" size="sm" onClick={addSigner}><Plus size={12} /> Añadir firmante</Button>
                <div className="flex justify-between">
                  <Button variant="ghost" size="sm" onClick={() => setStep('select')}><ChevronLeft size={14} /> Volver</Button>
                  <Button variant="primary" size="sm" onClick={generatePreview}>Generar preview</Button>
                </div>
              </div>
            )}

            {step === 'preview' && previewData && (
              <div className="space-y-4">
                {createError && <div className="text-xs text-danger bg-danger/10 p-2 rounded">{createError}</div>}
                <div className="text-xs text-text-secondary">
                  <p>{previewData.totalElegibles} documentos elegibles, {previewData.totalNoElegibles} no elegibles</p>
                  {previewData.advertencias.map((a, i) => <p key={i} className="text-warning">⚠ {a}</p>)}
                </div>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {previewData.documentos.map(d => (
                    <div key={d.documentId} className={cn('flex items-center gap-2 p-2 rounded text-xs', d.elegible ? 'bg-success/5 text-text' : 'bg-warning/5 text-text-muted')}>
                      <FileText size={12} />
                      <span className="flex-1 truncate">{d.nombre}</span>
                      {!d.elegible && <span className="text-xxs text-warning">{d.motivoNoElegible}</span>}
                    </div>
                  ))}
                </div>
                <p className="text-xxs text-text-muted">Preview hash: {previewData.previewHash.slice(0, 16)}…</p>
                <div className="flex justify-between">
                  <Button variant="ghost" size="sm" onClick={() => setStep('signers')}><ChevronLeft size={14} /> Volver</Button>
                  <Button variant="primary" size="sm" onClick={confirmPackage} loading={isConfirming}
                    disabled={previewData.totalElegibles === 0}>
                    <CheckCircle2 size={14} /> Confirmar y congelar
                  </Button>
                </div>
            </div>
          )}
          </div>
        </div>
      )}
    </Card>
  );
}

function estadoLabel(estado: string): string {
  const map: Record<string, string> = { draft: 'Borrador', ready: 'Preparado', locked: 'Bloqueado', cancelled: 'Cancelado', superseded: 'Sustituido' };
  return map[estado] || estado;
}

function estadoColor(estado: string): string {
  const map: Record<string, string> = { draft: 'text-text-muted', ready: 'text-success', locked: 'text-accent-dark', cancelled: 'text-danger', superseded: 'text-warning' };
  return map[estado] || 'text-text-muted';
}
