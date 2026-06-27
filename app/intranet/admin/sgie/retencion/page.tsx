'use client';

import { useAuth } from '@/app/auth-context';
import { Spinner } from '@/components/ui/spinner';
import { HardDrive, AlertTriangle } from 'lucide-react';

export default function RetencionAdminPage() {
  const { user, loading } = useAuth();

  if (loading) return <Spinner size="lg" />;
  if (!user || user.rol !== 'admin') return <div className="text-center py-20"><p className="font-bold text-primary">Acceso restringido</p></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-primary">Retención documental</h1>
        <p className="text-sm text-text-secondary mt-1">Políticas de conservación y eliminación de documentos</p>
      </div>

      <div className="bg-amber-50 border border-amber-300 rounded-lg p-6 text-center">
        <AlertTriangle size={40} className="mx-auto text-amber-600 mb-3" />
        <h2 className="font-bold text-amber-800 text-lg">NO VALIDADO</h2>
        <p className="text-sm text-amber-700 mt-2 max-w-lg mx-auto">
          Las políticas de retención documental requieren investigación normativa sobre los plazos legales
          de conservación aplicables en Honduras (Código Civil, Código Procesal Penal, Ley de Procedimiento
          Administrativo, normativa del Colegio de Abogados, etc.).
        </p>
        <p className="text-sm text-amber-700 mt-3 max-w-lg mx-auto">
          Esta investigación debe ser realizada y aprobada por el despacho antes de configurar cualquier
          política automática de retención o eliminación. El sistema no aplicará ninguna política de
          retención hasta que este paso sea completado y validado por un abogado responsable.
        </p>
        <div className="mt-4 p-3 bg-white rounded-md border border-amber-200 text-left text-sm text-text-secondary">
          <p className="font-semibold mb-1">Configuración pendiente:</p>
          <ul className="list-disc pl-5 space-y-1 text-xs">
            <li>Plazos de conservación por tipo de documento</li>
            <li>Plazos de conservación por tipo de procedimiento</li>
            <li>Política de eliminación (soft-delete vs hard-delete)</li>
            <li>Notificaciones previas a eliminación</li>
            <li>Aprobación requerida para eliminación</li>
            <li>Exportación previa a eliminación</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
