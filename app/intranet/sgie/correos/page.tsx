import { Mail } from 'lucide-react';
import { SgiePlaceholderPage } from '@/components/sgie/sgie-placeholder';

export default function SgieCorreosPage() {
  return (
    <SgiePlaceholderPage
      icon={<Mail size={18} className="text-accent" />}
      title="Correos"
      subtitle="Comunicación automatizada con clientes"
      descripcion="Aquí se registrará el histórico de correos transaccionales enviados a sus clientes por cada fase del expediente (solicitud documental, acuses, recordatorios, faltantes, rechazos). El envío automatizado vía Resend con control anti-duplicado se activa en fases posteriores. No se añaden proveedores nuevos."
      fase="Fase 5 del plan SGIE"
    />
  );
}
