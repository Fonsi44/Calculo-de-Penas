'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CenteredSpinner } from '@/components/ui/spinner';

export default function DashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/intranet/admin');
  }, [router]);

  return <CenteredSpinner label="Redirigiendo al panel..." />;
}
