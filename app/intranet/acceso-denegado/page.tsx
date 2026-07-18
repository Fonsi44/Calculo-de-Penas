import Link from 'next/link';
import { ShieldX } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function AccessDeniedPage() {
  return <main className="min-h-screen bg-background flex items-center justify-center p-4">
    <Card padding="lg" className="max-w-md text-center">
      <ShieldX size={44} className="mx-auto text-danger mb-3" />
      <h1 className="text-xl font-extrabold text-primary">Acceso SGIE no disponible</h1>
      <p className="text-sm text-text-secondary my-3">
        La cuenta está suspendida, inactiva, sin membresía válida o con el acceso SGIE deshabilitado.
        Contacte con administración.
      </p>
      <Link href="/intranet/login"><Button variant="secondary">Volver al inicio de sesión</Button></Link>
    </Card>
  </main>;
}
