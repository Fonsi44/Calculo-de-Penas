import { AlertTriangle } from 'lucide-react';
import { SgiePlaceholderPage } from '@/components/sgie/sgie-placeholder';

export default function SgieAlertasPage() {
  return (
    <SgiePlaceholderPage
      icon={<AlertTriangle size={18} className="text-accent" />}
      title="Alertas"
      subtitle="Riesgos, faltantes e inconsistencias detectadas"
      descripcion="Aquí verá las alertas del motor de reglas: documentos faltantes, baja confianza en campos extraídos, contradicciones entre documentos, vencimientos próximos e ilegibilidades. Cada alerta tendrá severidad (info, advertencia, error, crítico) y permitirá resolverla. El motor de reglas y confianza se activa en fases posteriores."
      fase="Fase 8 del plan SGIE"
    />
  );
}
