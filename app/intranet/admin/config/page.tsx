'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Spinner } from '@/components/ui/spinner';

export default function AdminConfigRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/intranet/admin/pages/configuracion');
  }, [router]);

  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center space-y-2">
        <Spinner size="lg" />
        <p className="text-sm text-text-secondary">Redirigiendo a Configuración Global...</p>
      </div>
    </div>
  );
}
