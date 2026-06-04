import type { Metadata } from 'next';
import { AppShell } from '@/components/layout/app-shell';

export const metadata: Metadata = {
  title: 'Política de Privacidad · LEX Honduras',
  description: 'Política de privacidad de LEX Honduras, calculadora de penas del Código Penal hondureño.',
};

export default function PrivacidadPage() {
  return (
    <AppShell title="Política de Privacidad" backHref="/">
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
          <h2 className="text-base font-bold text-primary mb-2">1. Responsable del Tratamiento</h2>
          <p className="text-sm leading-6">
            LEX Honduras (en adelante, &ldquo;la Plataforma&rdquo;) es responsable del tratamiento de los datos
            personales recopilados a través del servicio.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-primary mb-2">2. Datos que Recopilamos</h2>

          <h3 className="text-sm font-semibold text-primary mt-3 mb-1">2.1. Datos de Registro</h3>
          <ul className="text-sm leading-6 list-disc pl-5 space-y-1">
            <li>Correo electrónico.</li>
            <li>Nombre.</li>
            <li>Contraseña (almacenada como hash bcrypt, nunca en texto plano).</li>
            <li>Rol (abogado, administrador).</li>
          </ul>

          <h3 className="text-sm font-semibold text-primary mt-3 mb-1">2.2. Datos de Uso</h3>
          <ul className="text-sm leading-6 list-disc pl-5 space-y-1">
            <li>Casos creados, cálculos realizados.</li>
            <li>Fecha y hora de acceso.</li>
            <li>Dirección IP.</li>
            <li>Agente de usuario (navegador, SO).</li>
          </ul>

          <h3 className="text-sm font-semibold text-primary mt-3 mb-1">2.3. Datos NO Recopilados</h3>
          <ul className="text-sm leading-6 list-disc pl-5 space-y-1">
            <li>No usamos cookies de rastreo publicitario.</li>
            <li>No vendemos datos a terceros.</li>
            <li>No integramos redes sociales.</li>
            <li>No usamos Google Analytics ni similares.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold text-primary mb-2">3. Finalidad del Tratamiento</h2>
          <p className="text-sm leading-6">Los datos se utilizan exclusivamente para:</p>
          <ul className="text-sm leading-6 list-disc pl-5 mt-1 space-y-1">
            <li>Proporcionar el servicio de cálculo de penas.</li>
            <li>Autenticación y seguridad de la cuenta.</li>
            <li>Auditoría de accesos y prevención de fraude.</li>
            <li>Mejora del servicio (datos agregados, no individuales).</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold text-primary mb-2">4. Base Legal</h2>
          <p className="text-sm leading-6">
            El tratamiento se basa en el consentimiento del usuario (al registrarse y aceptar estos
            términos) y en la ejecución del contrato de prestación del servicio.
          </p>
          <p className="text-sm leading-6 mt-2">
            Honduras no cuenta con una ley general de protección de datos personales en 2026.
            Se aplican principios generales del derecho a la intimidad (Arts. 76-80 Constitución
            de la República) y del Código Civil.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-primary mb-2">5. Almacenamiento y Seguridad</h2>
          <ul className="text-sm leading-6 list-disc pl-5 space-y-1">
            <li>Base de datos: Neon (Postgres serverless, AWS US-East-1).</li>
            <li>Contraseñas: bcrypt con salt de 10 rounds.</li>
            <li>Sesiones: JWT firmado con HS256, cookie `__Host-token` (httpOnly, secure, sameSite=strict).</li>
            <li>HTTPS obligatorio en producción.</li>
            <li>Headers de seguridad: CSP, HSTS, X-Frame-Options, X-Content-Type-Options.</li>
            <li>Auditoría: tabla `auditoria_eventos` registra accesos y acciones críticas.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold text-primary mb-2">6. Compartición con Terceros</h2>
          <p className="text-sm leading-6">
            Los datos NO se comparten con terceros, salvo obligación legal o requerimiento judicial
            de autoridad competente hondureña.
          </p>
          <p className="text-sm leading-6 mt-2">
            Proveedores de infraestructura (Vercel, Neon) procesan datos solo en la medida necesaria
            para prestar el servicio. Sus políticas de privacidad aplican:
          </p>
          <ul className="text-sm leading-6 list-disc pl-5 mt-1 space-y-1">
            <li><a href="https://vercel.com/legal/privacy-policy" className="text-accent hover:underline">Vercel Privacy Policy</a></li>
            <li><a href="https://neon.tech/privacy-policy" className="text-accent hover:underline">Neon Privacy Policy</a></li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold text-primary mb-2">7. Retención de Datos</h2>
          <ul className="text-sm leading-6 list-disc pl-5 space-y-1">
            <li>Datos de cuenta: mientras la cuenta esté activa. Al eliminar la cuenta, se eliminan en 30 días.</li>
            <li>Casos y cálculos: mientras la cuenta esté activa.</li>
            <li>Logs de auditoría: 1 año (después se agregan/anonimizan).</li>
            <li>Backups de Neon: 7 días (PITR).</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold text-primary mb-2">8. Derechos del Usuario</h2>
          <p className="text-sm leading-6">El usuario puede:</p>
          <ul className="text-sm leading-6 list-disc pl-5 mt-1 space-y-1">
            <li>Acceder a sus datos personales.</li>
            <li>Rectificar datos incorrectos.</li>
            <li>Solicitar la eliminación de su cuenta y datos asociados.</li>
            <li>Oponerse al tratamiento.</li>
            <li>Solicitar la portabilidad de sus datos (export JSON).</li>
          </ul>
          <p className="text-sm leading-6 mt-2">
            Para ejercer estos derechos: contactar a través de los medios indicados en la página
            principal. Plazo de respuesta: 15 días hábiles.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-primary mb-2">9. Menores de Edad</h2>
          <p className="text-sm leading-6">
            La Plataforma NO está dirigida a menores de 18 años. Si se detecta que un menor se ha
            registrado, se eliminará la cuenta previa notificación.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-primary mb-2">10. Cambios a esta Política</h2>
          <p className="text-sm leading-6">
            Cualquier cambio se publicará en esta misma URL con la fecha de actualización. Se
            notificará a los usuarios registrados si el cambio es sustancial.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-primary mb-2">11. Contacto</h2>
          <p className="text-sm leading-6">
            Para consultas sobre privacidad: ver la sección de contacto en la página principal.
          </p>
        </section>

        <p className="text-xs text-text-muted pt-4 border-t border-border-light">
          Versión: 0.1 (Borrador, junio 2026)
        </p>
      </div>
    </AppShell>
  );
}
