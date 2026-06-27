import { CheckSquare } from 'lucide-react';
import { SgiePlaceholderPage } from '@/components/sgie/sgie-placeholder';

export default function SgieTareasPage() {
  return (
    <SgiePlaceholderPage
      icon={<CheckSquare size={18} className="text-accent" />}
      title="Tareas"
      subtitle="Trabajo pendiente automático y manual"
      descripcion="Aquí se listarán sus tareas: las generadas automáticamente por el sistema (seguimiento de faltantes, recordatorios, revisión de documentos) y las que cree manualmente. Cada tarea estará asociada a un expediente. La gestión completa de tareas se activa en fases posteriores junto con el motor documental."
      fase="Fase 5–9 del plan SGIE"
    />
  );
}
