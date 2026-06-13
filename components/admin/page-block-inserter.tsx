'use client';

import { useState } from 'react';
import {
  Plus, Type, Image, TextQuote, Layout, List,
  MessageSquare, Star, FileText, MapPin, Grid3X3,
  Monitor, SeparatorHorizontal, SquareDashed,
} from 'lucide-react';
import { cn } from '@/lib/ui';

interface BlockTemplate {
  key: string;
  label: string;
  desc: string;
  icon: React.ComponentType<{ size?: number }>;
}

const ALL_BLOCKS: BlockTemplate[] = [
  { key: 'hero', label: 'Hero', desc: 'Título grande + subtítulo', icon: Type },
  { key: 'content', label: 'Texto enriquecido', desc: 'Párrafos con formato', icon: TextQuote },
  { key: 'image_text', label: 'Imagen + texto', desc: 'Imagen y texto lado a lado', icon: Image },
  { key: 'gallery', label: 'Galería', desc: 'Grid de imágenes', icon: Grid3X3 },
  { key: 'cards', label: 'Cards', desc: 'Tarjetas de contenido', icon: Layout },
  { key: 'services', label: 'Servicios', desc: 'Tarjetas de servicios', icon: List },
  { key: 'cta', label: 'CTA', desc: 'Llamada a la acción', icon: Monitor },
  { key: 'faq', label: 'FAQ', desc: 'Preguntas frecuentes', icon: MessageSquare },
  { key: 'testimonials', label: 'Testimonios', desc: 'Testimonios de clientes', icon: Star },
  { key: 'documents', label: 'Documentos', desc: 'Documentos legales', icon: FileText },
  { key: 'banner', label: 'Banner', desc: 'Banner destacado', icon: SquareDashed },
  { key: 'metrics', label: 'Métricas', desc: 'Números y estadísticas', icon: BarChart },
  { key: 'map', label: 'Mapa', desc: 'Mapa de ubicación', icon: MapPin },
  { key: 'form', label: 'Formulario', desc: 'Formulario de contacto', icon: Monitor },
  { key: 'separator', label: 'Separador', desc: 'Línea divisoria', icon: SeparatorHorizontal },
];

interface BlockInserterProps {
  onSelect: (blockKey: string) => void;
  allowedBlocks?: string[];
  position: 'before' | 'after' | 'between';
}

export function BlockInserter({ onSelect, allowedBlocks, position }: BlockInserterProps) {
  const [open, setOpen] = useState(false);

  const blocks = allowedBlocks
    ? ALL_BLOCKS.filter((b) => allowedBlocks.includes(b.key))
    : ALL_BLOCKS;

  return (
    <div className="ve-block-inserter" data-position={position}>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-40 w-72 max-h-64 overflow-y-auto bg-white border border-border-light rounded-lg shadow-lg p-2">
            <p className="text-xxs font-bold uppercase tracking-wider text-text-muted px-2 py-1">
              Añadir bloque
            </p>
            <div className="grid grid-cols-2 gap-1">
              {blocks.map((block) => (
                <button
                  key={block.key}
                  onClick={() => { onSelect(block.key); setOpen(false); }}
                  className="flex flex-col items-start gap-0.5 p-2 rounded-md hover:bg-surface-alt transition-colors text-left"
                >
                  <span className="text-accent-dark"><block.icon size={14} /></span>
                  <span className="text-xs font-semibold text-text leading-tight">{block.label}</span>
                  <span className="text-xxs text-text-muted leading-tight">{block.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          'flex items-center justify-center w-full py-1 group transition-all',
          'hover:bg-accent/5 border border-dashed border-transparent hover:border-accent/30 rounded-md',
        )}
      >
        <span className="flex items-center gap-1 text-xxs text-text-muted group-hover:text-accent-dark transition-colors">
          <Plus size={12} />
          Añadir bloque
        </span>
      </button>
    </div>
  );
}

function BarChart({ size }: { size?: number }) {
  return (
    <svg width={size ?? 14} height={size ?? 14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="20" x2="12" y2="10" />
      <line x1="18" y1="20" x2="18" y2="4" />
      <line x1="6" y1="20" x2="6" y2="16" />
    </svg>
  );
}
