import { Calendar } from 'lucide-react';
import { SgiePlaceholderPage } from '@/components/sgie/sgie-placeholder';

export default function SgieAgendaPage() {
  return (
    <SgiePlaceholderPage
      icon={<Calendar size={18} className="text-accent" />}
      title="Agenda"
      subtitle="Plazos, audiencias y vencimientos"
      descripcion="Aquí verá los eventos de agenda: fechas procesales internas, audiencias, plazos detectados en documentos y recordatorios. Los eventos propuestos por el sistema requerirán su confirmación. Las bandejas operativas (hoy, próximos 7 días, vencidos) se activarán en fases posteriores junto con el motor documental y de reglas."
      fase="Fase 9 del plan SGIE"
    />
  );
}
