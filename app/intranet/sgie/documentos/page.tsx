import { FileText } from 'lucide-react';
import { SgiePlaceholderPage } from '@/components/sgie/sgie-placeholder';

export default function SgieDocumentosPage() {
  return (
    <SgiePlaceholderPage
      icon={<FileText size={18} className="text-accent" />}
      title="Documentos"
      subtitle="Motor documental del SGIE"
      descripcion="Aquí se listarán los documentos de sus expedientes con su estado (solicitado, subido, clasificado, aprobado, rechazado), hash de verificación, tipo clasificado y origen. El motor documental (recepción, validación, clasificación y extracción de texto) se activa en fases posteriores."
      fase="Fase 4–6 del plan SGIE"
    />
  );
}
