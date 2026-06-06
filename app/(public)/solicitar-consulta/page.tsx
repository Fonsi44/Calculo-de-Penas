import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Phone,
  MessageCircle,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react';
import { telHref, whatsappHref } from '@/lib/site';
import { Section, Container } from '@/components/marketing/section';
import { Card } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Solicitar consulta',
  description: 'Solicite una consulta confidencial con un abogado penalista en Nacaome, Valle. Le respondemos en horario hábil.',
  alternates: { canonical: '/solicitar-consulta' },
};

const REASONS = [
  'Familiar detenido',
  'Citaciones o audiencias próximas',
  'Investigación en curso',
  'Querella o denuncia',
  'Recurso o apelación',
  'Asesoría preventiva',
];

const GUARANTEES = [
  { icon: ShieldCheck, title: 'Confidencialidad absoluta', desc: 'Su información está protegida por el secreto profesional.' },
  { icon: CheckCircle2, title: 'Sin compromiso', desc: 'La consulta inicial no le obliga a contratar nuestros servicios.' },
  { icon: Calendar, title: 'Respuesta en horario hábil', desc: 'Le respondemos el mismo día hábil por el canal que prefiera.' },
];

export default function SolicitarConsultaPage() {
  return (
    <>
      <section className="bg-primary text-text-inverse">
        <Container size="lg" className="py-12 md:py-16">
          <p className="text-[11px] font-bold uppercase tracking-widest text-accent mb-3">
            Solicitar consulta
          </p>
          <h1 className="font-serif font-extrabold text-3xl md:text-4xl lg:text-5xl leading-tight max-w-3xl">
            Cuéntenos su caso. Le escuchamos con discreción.
          </h1>
          <p className="mt-4 text-[15px] md:text-base text-text-inverse/85 leading-relaxed max-w-2xl">
            Complete el formulario o contáctenos directamente. Toda comunicación es
            estrictamente confidencial.
          </p>
        </Container>
      </section>

      <Section spacing="md">
        <div className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3">
            <Card padding="md" className="border-l-4 border-l-accent">
              <h2 className="font-bold text-base text-primary">Formulario de consulta</h2>
              <p className="text-[13px] text-text-secondary mt-1 mb-5">
                Los campos marcados con * son obligatorios. Por seguridad, no incluya
                contraseñas, números de tarjeta ni documentos de identidad completos.
              </p>
              <SolicitarConsultaForm />
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-3">
            <Card padding="md" className="bg-aggravation text-white">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={18} aria-hidden="true" />
                <h3 className="font-bold text-[15px]">¿Emergencia con detenido?</h3>
              </div>
              <p className="text-[13px] text-white/90 leading-relaxed">
                Si un familiar está siendo detenido o necesita asistencia letrada
                inmediata, no espere. Llámenos o escríbanos por WhatsApp ahora.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 mt-4">
                <a
                  href={telHref()}
                  className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-md bg-white text-aggravation text-[13px] font-bold hover:bg-white/90"
                >
                  <Phone size={14} /> Llamar
                </a>
                <a
                  href={whatsappHref('Emergencia: tengo un familiar detenido.')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-md bg-success text-white text-[13px] font-bold hover:opacity-90"
                >
                  <MessageCircle size={14} /> WhatsApp
                </a>
              </div>
            </Card>

            <Card padding="md">
              <h3 className="font-bold text-[14px] text-primary mb-3">Motivos frecuentes</h3>
              <ul className="space-y-1.5">
                {REASONS.map((r) => (
                  <li key={r} className="flex items-center gap-2 text-[13px] text-text-secondary">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-dark flex-shrink-0" />
                    {r}
                  </li>
                ))}
              </ul>
            </Card>

            <Card padding="md">
              <h3 className="font-bold text-[14px] text-primary mb-3">Nuestras garantías</h3>
              <ul className="space-y-2.5">
                {GUARANTEES.map((g) => (
                  <li key={g.title} className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-md bg-success/15 text-success flex items-center justify-center flex-shrink-0">
                      <g.icon size={14} />
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-text leading-tight">{g.title}</p>
                      <p className="text-[12px] text-text-secondary leading-relaxed">{g.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>
      </Section>

      <Section background="muted" spacing="md">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="font-serif font-extrabold text-2xl md:text-3xl text-primary">
            Prefiere vernos en persona
          </h2>
          <p className="mt-3 text-[14px] text-text-secondary">
            Con cita previa. Estamos en Nacaome, Valle, con horario de lunes a sábado.
          </p>
          <Link
            href="/como-llegar"
            className="inline-flex items-center gap-2 mt-5 text-[14px] font-semibold text-primary hover:text-accent-dark"
          >
            Ver cómo llegar <ArrowRight size={14} />
          </Link>
        </div>
      </Section>
    </>
  );
}

import { SolicitarConsultaForm } from '@/components/marketing/solicitar-consulta-form';
