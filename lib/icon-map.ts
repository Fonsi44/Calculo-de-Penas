import type { LucideIcon } from 'lucide-react';
import {
  Users, Briefcase, FileText, Building2, Banknote, Landmark,
  Ship, HeartPulse, Globe, Lightbulb, Receipt, Leaf, Scale,
  Gavel, Handshake, Baby, BookOpen, ShieldAlert, Target, Key,
  FileCheck2, Scroll, Plane,
} from 'lucide-react';
import type { PlaceholderTone } from '@/components/marketing/placeholder-photo';

const ICON_MAP: Record<string, LucideIcon> = {
  users: Users,
  briefcase: Briefcase,
  'file-text': FileText,
  'building-2': Building2,
  banknote: Banknote,
  landmark: Landmark,
  ship: Ship,
  'heart-pulse': HeartPulse,
  globe: Globe,
  lightbulb: Lightbulb,
  receipt: Receipt,
  leaf: Leaf,
  scale: Scale,
  gavel: Gavel,
  handshake: Handshake,
  baby: Baby,
  'book-open': BookOpen,
  'shield-alert': ShieldAlert,
  target: Target,
  key: Key,
  'file-check-2': FileCheck2,
  scroll: Scroll,
  plane: Plane,
};

const TONE_MAP: Record<string, PlaceholderTone> = {
  'derecho-de-familia': 'familia',
  'derecho-laboral': 'laboral',
  'derecho-civil-y-notarial': 'civil',
  'derecho-mercantil-empresarial': 'mercantil',
  'derecho-bancario-y-financiero': 'bancario',
  'derecho-administrativo-y-servicio-civil': 'administrativo',
  'derecho-aduanero-y-comercio-exterior': 'aduanero',
  'regulacion-sanitaria': 'sanitario',
  'extranjeria-en-honduras': 'migracion',
  'propiedad-intelectual': 'propiedad',
  'tributario-fiscal': 'tributario',
  'ambiental-regulatorio': 'ambiental',
  'conciliacion-y-arbitraje': 'arbitraje',
  'atencion-casos-penales-litigiosos': 'penal',
  'mediacion-conflictos-penales-y-multas': 'primary',
  'menores-justicia-juvenil': 'familia',
  'proceso-penal-completo': 'primary',
  'recursos-y-defensa-avanzada': 'primary',
  'estrategia-penal-y-litigio': 'primary',
  'ejecucion-penal-y-beneficios': 'primary',
  'gestion-documental-y-legalizacion': 'migrante',
  'actos-notariales-internacionales': 'migrante',
  'asuntos-civiles-y-familiares-desde-el-extranjero': 'familia',
  'servicios-juridicos': 'primary',
  'derecho-penal': 'penal',
  'hodurenos-en-espana': 'migrante',
};

export function getIcon(name: string): LucideIcon {
  return ICON_MAP[name] ?? Scale;
}

export function getAreaTone(slug: string): PlaceholderTone {
  return TONE_MAP[slug] ?? 'primary';
}
