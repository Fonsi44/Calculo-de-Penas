'use client';

import { useAuth } from '@/app/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { isAdminRole } from '@/lib/roles';

/**
 * Página de tránsito de la intranet.
 *
 * No muestra contenido propio: deriva al usuario según su rol.
 * - admin  → /intranet/admin (panel de administración)
 * - abogado → /intranet/sgie (cockpit del SGIE)
 *
 * SGIE (Fase 2): antes esta página mostraba un dashboard genérico a usuarios
 * no-admin. Ahora el abogado se dirige a su cockpit SGIE.
 */
export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading || !user) return;
    if (isAdminRole(user.rol)) {
      router.replace('/intranet/admin');
    } else {
      // SGIE — el abogado se dirige a su cockpit.
      router.replace('/intranet/sgie');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    router.replace('/intranet/login');
    return null;
  }

  // El dashboard es sólo una página de tránsito: admin y abogado se redirigen.
  return null;
}
