import type { Metadata } from 'next';
import { AppShell } from '@/components/layout/app-shell';

export const metadata: Metadata = {
  title: 'Términos y Condiciones · LEX Honduras',
  description: 'Términos y condiciones de uso de LEX Honduras, calculadora de penas del Código Penal hondureño.',
};

export default function TerminosPage() {
  return (
    <AppShell title="Términos y Condiciones" backHref="/">
      <div className="prose prose-sm max-w-none p-3 space-y-4 text-text">
        <div className="bg-warning/10 border border-warning rounded-md p-3 text-xs">
          <p className="font-semibold text-primary mb-1">BORRADOR — NO VALIDADOS POR ABOGADO</p>
          <p>
            Este texto es una plantilla base. La versión definitiva debe ser revisada y aprobada
            por un abogado colegiado en Honduras antes de su publicación oficial. Última revisión:
            junio 2026.
          </p>
        </div>

        <section>
          <h2 className="text-base font-bold text-primary mb-2">1. Aceptación</h2>
          <p className="text-sm leading-6">
            Al acceder y utilizar LEX Honduras (en adelante, &ldquo;la Plataforma&rdquo;), usted acepta estos
            Términos y Condiciones en su totalidad. Si no está de acuerdo, debe abstenerse de usar
            la Plataforma.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-primary mb-2">2. Descripción del Servicio</h2>
          <p className="text-sm leading-6">
            LEX Honduras es una calculadora jurídica que aplica las reglas del Código Penal de
            Honduras (Decreto 130-2017) para estimar la pena correspondiente a uno o varios delitos,
            considerando atenuantes, agravantes, eximentes, grados de autoría, ejecución y tipo de
            concurso.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-primary mb-2">3. AVISO IMPORTANTE — Sin Asesoramiento Legal</h2>
          <p className="text-sm leading-6 font-semibold">
            La Plataforma es una HERRAMIENTA DE APOYO. NO constituye asesoramiento legal,
            NO sustituye la consulta con un abogado colegiado, y NO garantiza la exactitud de
            los resultados.
          </p>
          <p className="text-sm leading-6 mt-2">
            El usuario es el único responsable del uso que haga de los resultados generados.
            Los resultados pueden contener errores derivados de:
          </p>
          <ul className="text-sm leading-6 list-disc pl-5 mt-1 space-y-1">
            <li>Datos de entrada incorrectos o incompletos.</li>
            <li>Interpretación jurisprudencial variable.</li>
            <li>Errores en la base de datos de delitos.</li>
            <li>Cambios normativos posteriores al Decreto 130-2017.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold text-primary mb-2">4. Registro y Cuenta</h2>
          <p className="text-sm leading-6">
            Algunas funcionalidades requieren registro. El usuario se compromete a:
          </p>
          <ul className="text-sm leading-6 list-disc pl-5 mt-1 space-y-1">
            <li>Proporcionar información veraz.</li>
            <li>Mantener la confidencialidad de su contraseña.</li>
            <li>Notificar cualquier uso no autorizado de su cuenta.</li>
            <li>No compartir su cuenta con terceros.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold text-primary mb-2">5. Uso Aceptable</h2>
          <p className="text-sm leading-6">Está prohibido:</p>
          <ul className="text-sm leading-6 list-disc pl-5 mt-1 space-y-1">
            <li>Usar la Plataforma para fines ilegales.</li>
            <li>Intentar acceder a cuentas o datos de otros usuarios.</li>
            <li>Realizar ingeniería inversa del software.</li>
            <li>Sobrecargar la infraestructura (ataques DoS/DDoS).</li>
            <li>Usar bots o scrapers sin autorización.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold text-primary mb-2">6. Propiedad Intelectual</h2>
          <p className="text-sm leading-6">
            La Plataforma, su código fuente, diseño, marca y contenidos están protegidos por las
            leyes de propiedad intelectual de Honduras y tratados internacionales. El usuario recibe
            una licencia limitada, no exclusiva, revocable y no transferible de uso.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-primary mb-2">7. Limitación de Responsabilidad</h2>
          <p className="text-sm leading-6">
            La Plataforma se proporciona &ldquo;TAL CUAL&rdquo;, sin garantías de ningún tipo. Los desarrolladores
            no serán responsables por daños directos, indirectos, incidentales o consecuentes
            derivados del uso o imposibilidad de uso de la Plataforma.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-primary mb-2">8. Modificaciones</h2>
          <p className="text-sm leading-6">
            Los desarrolladores se reservan el derecho de modificar estos Términos en cualquier
            momento. Los cambios se notificarán mediante la publicación de la versión actualizada
            en esta misma URL.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-primary mb-2">9. Ley Aplicable y Jurisdicción</h2>
          <p className="text-sm leading-6">
            Estos Términos se rigen por las leyes de la República de Honduras. Cualquier controversia
            se resolverá en los tribunales competentes de Tegucigalpa, Francisco Morazán.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-primary mb-2">10. Contacto</h2>
          <p className="text-sm leading-6">
            Para consultas sobre estos Términos: ver la sección de contacto en la página principal.
          </p>
        </section>

        <p className="text-xs text-text-muted pt-4 border-t border-border-light">
          Versión: 0.1 (Borrador, junio 2026)
        </p>
      </div>
    </AppShell>
  );
}
