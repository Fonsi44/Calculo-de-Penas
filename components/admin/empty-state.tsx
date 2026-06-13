'use client';

import { AlertTriangle, SearchSlash } from 'lucide-react';

type EmptyStateProps = {
  type?: 'empty' | 'permission_denied' | 'not_configured' | 'error';
  title?: string;
  message?: string;
  onRetry?: () => void;
};

export function EmptyState({ type = 'empty', title, message, onRetry }: EmptyStateProps) {
  const config = {
    empty: { icon: SearchSlash, defaultTitle: 'Sin datos', defaultMsg: 'No hay datos disponibles para el período seleccionado.' },
    permission_denied: { icon: AlertTriangle, defaultTitle: 'Permiso denegado', defaultMsg: 'No se puede acceder a esta integración. Verifica los permisos.' },
    not_configured: { icon: AlertTriangle, defaultTitle: 'No configurado', defaultMsg: 'Esta integración no está configurada. Revisa las variables de entorno.' },
    error: { icon: AlertTriangle, defaultTitle: 'Error', defaultMsg: 'Ocurrió un error al cargar los datos.' },
  };

  const c = config[type];
  const Icon = c.icon;

  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <Icon size={32} className="text-text-muted mb-3" />
      <p className="text-sm font-bold text-text">{title ?? c.defaultTitle}</p>
      <p className="text-xs text-text-secondary mt-1 max-w-md">{message ?? c.defaultMsg}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-3 text-xs font-semibold text-primary hover:text-accent-dark transition-colors">
          Reintentar
        </button>
      )}
    </div>
  );
}
