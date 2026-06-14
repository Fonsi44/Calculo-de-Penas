'use client';

import { Gavel, Scale, FileText, AlertCircle, CheckCircle2, ShieldAlert, ArrowRightLeft } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatFechaCompleta } from '@/lib/ui';

type ConfianzaDelito = 'verificado' | 'pendiente_revision' | 'rechazado';

interface DelitoAnalizado {
  nombre: string;
  articulo: string;
  confianza?: ConfianzaDelito;
  gravedad?: string;
  pena_base_texto?: string;
  pena_individual_texto?: string;
  modificaciones?: string[];
  agravantes_aplicadas?: string[];
  atenuantes_aplicadas?: string[];
  exento?: boolean;
  pena_por_remision_normativa?: boolean;
  articulos_remitidos_para_pena?: string | null;
  pena_base_resuelta_desde_articulo?: string | null;
  condicion_para_aplicar_pena_remitida?: string | null;
  agravacion_por_articulo_remitido?: string | null;
  formula_calculo_remision?: string | null;
  requiere_datos_economicos?: boolean;
  variables_necesarias_para_calculo?: string | null;
  observaciones_remision_normativa?: string | null;
}

export interface PenaltyResult {
  pena_principal: string;
  penas_accesorias?: string[];
  delitos_analizados?: DelitoAnalizado[];
  analisis_juridico: string;
  disclaimer: string;
}

interface Props {
  resultado: PenaltyResult;
  casoTitulo?: string;
  calculoNumero?: string;
  onOpenArticle: (ref: string) => void;
}

export function PenaltyResultPanel({ resultado, casoTitulo, calculoNumero, onOpenArticle }: Props) {
  const fecha = formatFechaCompleta(new Date());

  const delitosNoVerificados = (resultado.delitos_analizados || []).filter(d => d.confianza && d.confianza !== 'verificado');

  return (
    <div className="space-y-3 max-w-3xl mx-auto">
      {delitosNoVerificados.length > 0 && (
        <Card padding="md" tone="default" className="bg-danger-bg border-danger/40">
          <div className="flex gap-2">
            <ShieldAlert size={18} className="text-danger flex-shrink-0 mt-0.5" />
            <div className="text-xs text-text-secondary leading-5">
              <p className="font-bold text-danger text-sm mb-1">Atención: datos no verificados</p>
              <p>
                {delitosNoVerificados.length === 1
                  ? '1 delito en este cálculo tiene un artículo no verificado contra el Código Penal.'
                  : `${delitosNoVerificados.length} delitos en este cálculo tienen artículos no verificados contra el Código Penal.`}
                {' '}Los rangos de pena asociados pueden no ser correctos. Se recomienda verificar manualmente cada artículo en la biblioteca del CP antes de usar este cálculo como referencia legal.
              </p>
              <ul className="mt-2 space-y-1">
                {delitosNoVerificados.map((d, i) => (
                  <li key={i} className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-danger flex-shrink-0" />
                    <span className="font-semibold text-text">{d.nombre}</span>
                    <span className="text-text-muted">({d.articulo})</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      )}

      {/* Cabecera editorial */}
      <Card padding="md" tone="accent" className="text-center">
        <p className="text-xxs text-text-secondary uppercase tracking-widest mb-1">
          Informe de cálculo de pena
        </p>
        <p className="text-sm font-bold text-primary">LEX HONDURAS</p>
        <p className="text-xxs text-text-muted mt-1">Código Penal · Decreto 130-2017 y reformas vigentes</p>
        <div className="mt-3 pt-3 border-t border-border-light text-xxs text-text-secondary tabular-nums">
          <p>{fecha}</p>
          {casoTitulo && <p className="mt-0.5">Caso: <span className="font-semibold text-text">{casoTitulo}</span></p>}
          {calculoNumero && <p>N° de cálculo: <span className="font-semibold text-text">{calculoNumero}</span></p>}
        </div>
      </Card>

      {/* Pena principal */}
      {resultado.pena_principal === 'EXENTO' ? (
        <Card padding="md" tone="default" className="bg-warning-bg border-warning/40 text-center">
          <AlertCircle size={28} className="text-warning mx-auto mb-2" />
          <p className="text-xs text-text-secondary uppercase tracking-wider mb-1">Pena principal</p>
          <p className="text-2xl font-extrabold text-warning font-serif">EXENTO</p>
          <p className="text-xs text-text-secondary mt-2 max-w-md mx-auto">
            Se ha aplicado una eximente completa. El delito no conlleva pena.
          </p>
        </Card>
      ) : (
        <Card padding="md" tone="accent" className="text-center">
          <Scale size={28} className="text-accent mx-auto mb-2" />
          <p className="text-xs text-text-secondary uppercase tracking-wider mb-1">Pena principal</p>
          <p className="text-2xl font-extrabold text-primary font-serif leading-tight">
            {resultado.pena_principal}
          </p>
        </Card>
      )}

      {/* I. Delitos analizados */}
      {(resultado.delitos_analizados || []).length > 0 && (
        <Card padding="md">
          <SectionHeader numeral="I" title="Delitos analizados" icon={<Gavel size={14} />} />
          <div className="space-y-1.5">
            {(resultado.delitos_analizados || []).map((d, i) => (
              <div key={i} className="flex items-center gap-2 p-2 bg-surface-alt rounded-md">
                <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xxs font-bold text-primary flex-shrink-0">
                  {i + 1}
                </span>
                <p className="font-semibold text-sm text-text flex-1 truncate">{d.nombre}</p>
                <Badge tone="primary">{d.articulo}</Badge>
                {d.confianza === 'rechazado' && <Badge tone="danger" title="Artículo no verificado contra el CP">No verificado</Badge>}
                {d.confianza === 'pendiente_revision' && <Badge tone="warning" title="Pendiente de revisión manual">Pendiente</Badge>}
                {d.confianza === 'verificado' && <Badge tone="mitigation" title="Artículo validado contra el CP">Verificado</Badge>}
                {d.pena_por_remision_normativa && <Badge tone="warning" title="Pena obtenida por remisión a otros artículos">Remisión</Badge>}
                {d.exento && <Badge tone="exemption">EXENTO</Badge>}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* II. Detalle por delito */}
      {(resultado.delitos_analizados || []).map((d, i) => (
        <Card key={i} padding="md">
          <SectionHeader
            numeral={`II.${i + 1}`}
            title={d.nombre}
            icon={<Gavel size={14} />}
            action={d.exento ? <Badge tone="exemption">EXENTO</Badge> : null}
          />
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
            {d.articulo && (
              <>
                <dt className="text-text-muted">Artículo</dt>
                <dd className="text-text font-semibold tabular-nums">{d.articulo}</dd>
              </>
            )}
            {d.gravedad && (
              <>
                <dt className="text-text-muted">Gravedad</dt>
                <dd className="text-text">{d.gravedad}</dd>
              </>
            )}
            {d.pena_base_texto && (
              <>
                <dt className="text-text-muted">Pena base</dt>
                <dd className="text-text tabular-nums">{d.pena_base_texto}</dd>
              </>
            )}
            {d.pena_individual_texto && (
              <>
                <dt className="text-text-muted">Pena individual</dt>
                <dd className="text-text font-semibold tabular-nums">{d.pena_individual_texto}</dd>
              </>
            )}
          </dl>
          {d.modificaciones && d.modificaciones.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border-light">
              <p className="text-xxs font-bold text-text-secondary uppercase tracking-wider mb-1.5">
                Operación
              </p>
              <ol className="space-y-1">
                {d.modificaciones.map((mod, j) => (
                  <li key={j} className="text-xxs text-text-secondary font-serif leading-4 flex gap-1.5">
                    <span className="text-accent-dark font-bold">→</span>
                    <span>{mod}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
          {d.agravantes_aplicadas && d.agravantes_aplicadas.length > 0 && (
            <p className="text-xxs text-text-secondary mt-2">
              <span className="font-bold text-aggravation">Agravantes aplicadas:</span>{' '}
              {d.agravantes_aplicadas.join(', ')}
            </p>
          )}
          {d.atenuantes_aplicadas && d.atenuantes_aplicadas.length > 0 && (
            <p className="text-xxs text-text-secondary">
              <span className="font-bold text-mitigation">Atenuantes aplicadas:</span>{' '}
              {d.atenuantes_aplicadas.join(', ')}
            </p>
          )}

          {d.pena_por_remision_normativa && (
            <div className="mt-3 pt-3 border-t border-warning/40">
              <div className="flex items-center gap-1.5 mb-2">
                <ArrowRightLeft size={14} className="text-warning flex-shrink-0" />
                <p className="text-xxs font-bold text-warning uppercase tracking-wider">
                  Pena determinada por remisión normativa
                </p>
              </div>
              <dl className="grid grid-cols-1 gap-x-4 gap-y-1 text-xxs">
                {d.articulos_remitidos_para_pena && (
                  <>
                    <dt className="text-text-muted font-semibold">Artículos remitidos para pena</dt>
                    <dd className="text-text font-semibold">{d.articulos_remitidos_para_pena}</dd>
                  </>
                )}
                {d.pena_base_resuelta_desde_articulo && (
                  <>
                    <dt className="text-text-muted font-semibold">Pena base resuelta desde</dt>
                    <dd className="text-text">{d.pena_base_resuelta_desde_articulo}</dd>
                  </>
                )}
                {d.condicion_para_aplicar_pena_remitida && (
                  <>
                    <dt className="text-text-muted font-semibold">Condición para aplicar</dt>
                    <dd className="text-text italic">{d.condicion_para_aplicar_pena_remitida}</dd>
                  </>
                )}
                {d.agravacion_por_articulo_remitido && (
                  <>
                    <dt className="text-text-muted font-semibold">Agravación por artículo remitido</dt>
                    <dd className="text-text">{d.agravacion_por_articulo_remitido}</dd>
                  </>
                )}
                {d.formula_calculo_remision && (
                  <>
                    <dt className="text-text-muted font-semibold">Fórmula de cálculo</dt>
                    <dd className="text-text font-mono">{d.formula_calculo_remision}</dd>
                  </>
                )}
                {d.requiere_datos_economicos && (
                  <>
                    <dt className="text-text-muted font-semibold">Requiere datos económicos</dt>
                    <dd className="text-warning font-semibold">Sí — requiere datos adicionales</dd>
                  </>
                )}
                {d.variables_necesarias_para_calculo && (
                  <>
                    <dt className="text-text-muted font-semibold">Variables necesarias</dt>
                    <dd className="text-text">{d.variables_necesarias_para_calculo}</dd>
                  </>
                )}
                {d.observaciones_remision_normativa && (
                  <>
                    <dt className="text-text-muted font-semibold">Observaciones</dt>
                    <dd className="text-text">{d.observaciones_remision_normativa}</dd>
                  </>
                )}
              </dl>
              <p className="text-xxs text-warning mt-2 font-semibold italic">
                Advertencia: Este cálculo es orientativo y requiere revisión profesional. Los rangos mostrados dependen de la correcta determinación de las variables necesarias.
              </p>
            </div>
          )}
        </Card>
      ))}

      {/* III. Penas accesorias */}
      {Array.isArray(resultado.penas_accesorias) && resultado.penas_accesorias.length > 0 && (
        <Card padding="md">
          <SectionHeader numeral="III" title="Penas accesorias" icon={<Scale size={14} />} />
          <ul className="space-y-1">
            {resultado.penas_accesorias.map((p, i) => (
              <li key={i} className="text-xs text-text-secondary flex gap-2">
                <CheckCircle2 size={14} className="text-accent flex-shrink-0 mt-0.5" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* IV. Análisis jurídico completo */}
      <Card padding="md">
        <SectionHeader numeral="IV" title="Análisis jurídico" icon={<FileText size={14} />} />
        <pre className="text-xs text-text font-serif leading-5 whitespace-pre-wrap font-sans">
          {resultado.analisis_juridico}
        </pre>
      </Card>

      {/* V. Fundamento normativo */}
      <Card padding="md" tone="default" className="bg-surface-alt">
        <SectionHeader numeral="V" title="Fundamento normativo" icon={<FileText size={14} />} />
        <p className="text-xxs text-text-secondary mb-2">
          El presente cálculo se fundamenta en los siguientes artículos del Código Penal de Honduras (Decreto 130-2017 y reformas vigentes):
        </p>
        <div className="flex flex-wrap gap-1.5">
          {[
            { ref: 'Art. 19 CP', label: 'Consumación' },
            { ref: 'Art. 21 CP', label: 'Tentativa' },
            { ref: 'Art. 25 CP', label: 'Autoría' },
            { ref: 'Art. 26 CP', label: 'Participación' },
            { ref: 'Art. 30 CP', label: 'Eximentes' },
            { ref: 'Art. 31 CP', label: 'Atenuantes' },
            { ref: 'Art. 32 CP', label: 'Agravantes' },
            { ref: 'Art. 60 CP', label: 'Penas' },
            { ref: 'Art. 61 CP', label: 'Prisión' },
            { ref: 'Art. 62 CP', label: 'Reducción' },
            { ref: 'Art. 66 CP', label: 'Concurso real' },
            { ref: 'Art. 67 CP', label: 'Concurso ideal' },
            { ref: 'Art. 68 CP', label: 'Continuado' },
            { ref: 'Art. 69 CP', label: 'Grados' },
            { ref: 'Art. 70 CP', label: 'Límites' },
          ].map((art) => (
            <button
              key={art.ref}
              type="button"
              onClick={() => onOpenArticle(art.ref)}
              className="inline-flex items-center gap-1 h-7 px-2.5 rounded-full border border-border bg-surface text-xxs font-semibold text-text hover:border-accent hover:text-accent-dark"
            >
              {art.ref}
            </button>
          ))}
        </div>
      </Card>

      {/* VI. Disclaimer */}
      <Card padding="md" tone="default" className="bg-warning-bg border-warning/30">
        <p className="text-xxs text-text-secondary italic font-serif leading-5">
          {resultado.disclaimer}
        </p>
      </Card>
    </div>
  );
}

function SectionHeader({
  numeral,
  title,
  icon,
  action,
}: {
  numeral: string;
  title: string;
  icon: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border-light">
      <span className="text-xxs font-bold text-accent-dark tracking-widest">{numeral}.</span>
      <span className="text-accent-dark">{icon}</span>
      <h3 className="font-bold text-sm text-primary uppercase tracking-wider flex-1">{title}</h3>
      {action}
    </div>
  );
}
