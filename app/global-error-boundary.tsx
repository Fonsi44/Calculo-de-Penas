'use client';

import { Component, type ReactNode } from 'react';
import Link from 'next/link';
import { Scale, Home, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string }) {
    console.error('[GlobalErrorBoundary]', error.message, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col bg-background items-center justify-center p-4">
          <div className="text-center max-w-sm">
            <div className="w-16 h-16 rounded-2xl bg-danger/10 flex items-center justify-center mx-auto mb-4">
              <Scale size={32} className="text-danger" />
            </div>
            <h1 className="text-xl font-extrabold text-text mb-2">Error inesperado</h1>
            <p className="text-sm text-text-secondary mb-1">
              Algo salió mal al procesar tu solicitud.
            </p>
            <p className="text-xs text-text-muted mb-6 font-mono bg-surface-alt p-2 rounded border border-border">
              {this.state.error?.message || 'Error desconocido'}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-light transition-colors"
              >
                <RefreshCw size={14} />
                Reintentar
              </button>
              <Link
                href="/"
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border text-text-secondary text-sm font-semibold hover:bg-gray-50 transition-colors"
              >
                <Home size={14} />
                Ir al inicio
              </Link>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
