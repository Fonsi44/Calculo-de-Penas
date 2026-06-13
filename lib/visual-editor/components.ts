export type ComponentCategory = 'layout' | 'content' | 'media' | 'interactive' | 'legal';

export interface EditorComponentDef {
  id: string;
  name: string;
  description: string;
  category: ComponentCategory;
  icon: string;
  html: string;
  defaultContent: Record<string, string>;
  editableFields: { key: string; label: string; type: 'text' | 'textarea' | 'richtext' }[];
  section?: string;
  allowedParents?: string[];
}

const components: EditorComponentDef[] = [
  // ─── Layout ───────────────────────────────────────────────
  {
    id: 'section',
    name: 'Sección',
    description: 'Contenedor de sección con fondo y padding',
    category: 'layout',
    icon: '⊞',
    html: `<section class="py-12 md:py-16 bg-white" data-section="__new__" data-field="content">
  <div class="max-w-7xl mx-auto px-4">
    <h2 class="text-2xl md:text-3xl font-bold text-[#0f1d3a] mb-4">Nueva Sección</h2>
    <p class="text-gray-600">Contenido de la sección. Reemplazá este texto.</p>
  </div>
</section>`,
    defaultContent: { title: 'Nueva Sección', body: 'Contenido de la sección. Reemplazá este texto.' },
    editableFields: [
      { key: 'title', label: 'Título', type: 'text' },
      { key: 'body', label: 'Contenido', type: 'richtext' },
    ],
  },
  {
    id: 'container',
    name: 'Contenedor',
    description: 'Contenedor genérico con padding',
    category: 'layout',
    icon: '▢',
    html: `<div class="max-w-7xl mx-auto px-4 py-8" data-section="__new__" data-field="content">
  <p class="text-gray-600">Contenido del contenedor.</p>
</div>`,
    defaultContent: { content: 'Contenido del contenedor.' },
    editableFields: [{ key: 'content', label: 'Contenido', type: 'richtext' }],
  },
  {
    id: 'grid-2col',
    name: 'Grid 2 columnas',
    description: 'Cuadrícula de dos columnas iguales',
    category: 'layout',
    icon: '▦',
    html: `<div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-7xl mx-auto px-4 py-8" data-section="__new__">
  <div class="bg-gray-50 p-6 rounded-lg" data-field="col1">
    <h3 class="font-bold text-[#0f1d3a] mb-2">Columna 1</h3>
    <p class="text-gray-600">Contenido de la columna izquierda.</p>
  </div>
  <div class="bg-gray-50 p-6 rounded-lg" data-field="col2">
    <h3 class="font-bold text-[#0f1d3a] mb-2">Columna 2</h3>
    <p class="text-gray-600">Contenido de la columna derecha.</p>
  </div>
</div>`,
    defaultContent: { col1: 'Contenido columna 1', col2: 'Contenido columna 2' },
    editableFields: [
      { key: 'col1', label: 'Columna 1', type: 'richtext' },
      { key: 'col2', label: 'Columna 2', type: 'richtext' },
    ],
  },
  {
    id: 'separator',
    name: 'Separador',
    description: 'Línea divisoria horizontal',
    category: 'layout',
    icon: '—',
    html: `<hr class="border-t border-gray-200 my-8 max-w-7xl mx-auto" data-section="__new__" data-field="separator">`,
    defaultContent: {},
    editableFields: [],
  },
  {
    id: 'spacer',
    name: 'Espaciador',
    description: 'Espacio vertical',
    category: 'layout',
    icon: '⇕',
    html: `<div class="h-8" data-section="__new__" data-field="spacer"></div>`,
    defaultContent: {},
    editableFields: [],
  },

  // ─── Content ──────────────────────────────────────────────
  {
    id: 'heading',
    name: 'Título',
    description: 'Encabezado H2',
    category: 'content',
    icon: 'H',
    html: `<h2 class="text-2xl md:text-3xl font-bold text-[#0f1d3a]" data-section="__new__" data-field="heading">Nuevo Título</h2>`,
    defaultContent: { heading: 'Nuevo Título' },
    editableFields: [{ key: 'heading', label: 'Texto', type: 'text' }],
  },
  {
    id: 'subheading',
    name: 'Subtítulo',
    description: 'Encabezado H3',
    category: 'content',
    icon: 'h',
    html: `<h3 class="text-xl font-semibold text-[#0f1d3a]" data-section="__new__" data-field="subheading">Nuevo Subtítulo</h3>`,
    defaultContent: { subheading: 'Nuevo Subtítulo' },
    editableFields: [{ key: 'subheading', label: 'Texto', type: 'text' }],
  },
  {
    id: 'paragraph',
    name: 'Bloque de texto',
    description: 'Párrafo de texto',
    category: 'content',
    icon: '¶',
    html: `<p class="text-gray-600 leading-relaxed" data-section="__new__" data-field="text">Texto del párrafo. Reemplazá este contenido por el texto que necesites.</p>`,
    defaultContent: { text: 'Texto del párrafo.' },
    editableFields: [{ key: 'text', label: 'Texto', type: 'richtext' }],
  },
  {
    id: 'text-block',
    name: 'Bloque de contenido',
    description: 'Bloque de contenido HTML libre',
    category: 'content',
    icon: '📄',
    html: `<div class="prose max-w-none" data-section="__new__" data-field="content">
  <p class="text-gray-600">Contenido editable con formato enriquecido.</p>
</div>`,
    defaultContent: { content: '<p>Contenido editable.</p>' },
    editableFields: [{ key: 'content', label: 'Contenido', type: 'richtext' }],
  },
  {
    id: 'list',
    name: 'Lista',
    description: 'Lista con viñetas',
    category: 'content',
    icon: '•',
    html: `<ul class="list-disc list-inside text-gray-600 space-y-1" data-section="__new__" data-field="list">
  <li>Elemento 1</li>
  <li>Elemento 2</li>
  <li>Elemento 3</li>
</ul>`,
    defaultContent: { list: 'Elemento 1\nElemento 2\nElemento 3' },
    editableFields: [{ key: 'list', label: 'Elementos', type: 'textarea' }],
  },
  {
    id: 'numbered-list',
    name: 'Lista numerada',
    description: 'Lista ordenada',
    category: 'content',
    icon: '1.',
    html: `<ol class="list-decimal list-inside text-gray-600 space-y-1" data-section="__new__" data-field="list">
  <li>Primer paso</li>
  <li>Segundo paso</li>
  <li>Tercer paso</li>
</ol>`,
    defaultContent: { list: 'Primer paso\nSegundo paso\nTercer paso' },
    editableFields: [{ key: 'list', label: 'Elementos', type: 'textarea' }],
  },

  // ─── Buttons & CTA ────────────────────────────────────────
  {
    id: 'button-primary',
    name: 'Botón primario',
    description: 'Botón principal con fondo azul',
    category: 'interactive',
    icon: '▣',
    html: `<a href="#" class="inline-flex items-center gap-2 h-11 px-6 rounded-md bg-[#0f1d3a] text-white font-bold text-sm hover:bg-[#1a2d4a] transition-colors" data-section="__new__" data-field="button">Botón</a>`,
    defaultContent: { button: 'Botón' },
    editableFields: [{ key: 'button', label: 'Texto', type: 'text' }],
  },
  {
    id: 'button-secondary',
    name: 'Botón secundario',
    description: 'Botón secundario con borde',
    category: 'interactive',
    icon: '▢',
    html: `<a href="#" class="inline-flex items-center gap-2 h-11 px-6 rounded-md border border-[#0f1d3a] text-[#0f1d3a] font-bold text-sm hover:bg-[#0f1d3a] hover:text-white transition-colors" data-section="__new__" data-field="button">Botón secundario</a>`,
    defaultContent: { button: 'Botón secundario' },
    editableFields: [{ key: 'button', label: 'Texto', type: 'text' }],
  },
  {
    id: 'button-accent',
    name: 'Botón dorado',
    description: 'Botón con acento dorado',
    category: 'interactive',
    icon: '✦',
    html: `<a href="#" class="inline-flex items-center gap-2 h-11 px-6 rounded-md bg-[#c9a55c] text-white font-bold text-sm hover:bg-[#b8944a] transition-colors" data-section="__new__" data-field="button">Consultar</a>`,
    defaultContent: { button: 'Consultar' },
    editableFields: [{ key: 'button', label: 'Texto', type: 'text' }],
  },
  {
    id: 'link',
    name: 'Enlace',
    description: 'Enlace de texto',
    category: 'interactive',
    icon: '🔗',
    html: `<a href="#" class="text-[#c9a55c] hover:text-[#b8944a] underline font-medium" data-section="__new__" data-field="link">Enlace</a>`,
    defaultContent: { link: 'Enlace' },
    editableFields: [{ key: 'link', label: 'Texto', type: 'text' }],
  },
  {
    id: 'cta-block',
    name: 'Bloque CTA',
    description: 'Llamado a la acción completo',
    category: 'interactive',
    icon: '📢',
    html: `<div class="bg-[#0f1d3a] text-white py-12 px-4" data-section="__new__">
  <div class="max-w-3xl mx-auto text-center">
    <h2 class="text-2xl md:text-3xl font-bold mb-3" data-field="title">¿Necesita ayuda legal?</h2>
    <p class="text-gray-300 mb-6" data-field="subtitle">Contáctenos hoy para una consulta sin compromiso.</p>
    <a href="/solicitar-consulta" class="inline-flex items-center gap-2 h-12 px-8 rounded-md bg-[#c9a55c] text-white font-bold text-sm hover:bg-[#b8944a] transition-colors" data-field="button">Solicitar consulta</a>
  </div>
</div>`,
    defaultContent: { title: '¿Necesita ayuda legal?', subtitle: 'Contáctenos hoy para una consulta sin compromiso.', button: 'Solicitar consulta' },
    editableFields: [
      { key: 'title', label: 'Título', type: 'text' },
      { key: 'subtitle', label: 'Subtítulo', type: 'textarea' },
      { key: 'button', label: 'Texto del botón', type: 'text' },
    ],
  },
  {
    id: 'cta-group',
    name: 'Grupo CTA',
    description: 'Dos botones lado a lado',
    category: 'interactive',
    icon: '▣▣',
    html: `<div class="flex flex-wrap gap-3" data-section="__new__">
  <a href="#" class="inline-flex items-center gap-2 h-11 px-6 rounded-md bg-[#0f1d3a] text-white font-bold text-sm hover:bg-[#1a2d4a] transition-colors" data-field="button1">Acción principal</a>
  <a href="#" class="inline-flex items-center gap-2 h-11 px-6 rounded-md border border-[#0f1d3a] text-[#0f1d3a] font-bold text-sm hover:bg-[#0f1d3a] hover:text-white transition-colors" data-field="button2">Acción secundaria</a>
</div>`,
    defaultContent: { button1: 'Acción principal', button2: 'Acción secundaria' },
    editableFields: [
      { key: 'button1', label: 'Botón 1', type: 'text' },
      { key: 'button2', label: 'Botón 2', type: 'text' },
    ],
  },

  // ─── Cards ─────────────────────────────────────────────────
  {
    id: 'card',
    name: 'Tarjeta',
    description: 'Tarjeta de contenido',
    category: 'content',
    icon: '▭',
    html: `<div class="bg-white border border-gray-200 rounded-lg p-6 shadow-sm" data-section="__new__">
  <h3 class="font-bold text-[#0f1d3a] mb-2" data-field="title">Título de tarjeta</h3>
  <p class="text-gray-600 text-sm" data-field="description">Descripción de la tarjeta. Reemplazá este texto.</p>
</div>`,
    defaultContent: { title: 'Título de tarjeta', description: 'Descripción de la tarjeta.' },
    editableFields: [
      { key: 'title', label: 'Título', type: 'text' },
      { key: 'description', label: 'Descripción', type: 'textarea' },
    ],
  },
  {
    id: 'card-accent',
    name: 'Tarjeta destacada',
    description: 'Tarjeta con borde dorado',
    category: 'content',
    icon: '★',
    html: `<div class="bg-white border border-[#c9a55c] rounded-lg p-6 shadow-sm border-l-4 border-l-[#c9a55c]" data-section="__new__">
  <h3 class="font-bold text-[#0f1d3a] mb-2" data-field="title">Tarjeta destacada</h3>
  <p class="text-gray-600 text-sm" data-field="description">Contenido destacado.</p>
</div>`,
    defaultContent: { title: 'Tarjeta destacada', description: 'Contenido destacado.' },
    editableFields: [
      { key: 'title', label: 'Título', type: 'text' },
      { key: 'description', label: 'Descripción', type: 'textarea' },
    ],
  },
  {
    id: 'card-dark',
    name: 'Tarjeta oscura',
    description: 'Tarjeta con fondo oscuro',
    category: 'content',
    icon: '▮',
    html: `<div class="bg-[#0f1d3a] text-white rounded-lg p-6" data-section="__new__">
  <h3 class="font-bold mb-2" data-field="title">Título</h3>
  <p class="text-gray-300 text-sm" data-field="description">Contenido sobre fondo oscuro.</p>
</div>`,
    defaultContent: { title: 'Título', description: 'Contenido sobre fondo oscuro.' },
    editableFields: [
      { key: 'title', label: 'Título', type: 'text' },
      { key: 'description', label: 'Descripción', type: 'textarea' },
    ],
  },
  {
    id: 'card-grid-3',
    name: 'Grid de 3 tarjetas',
    description: 'Tres tarjetas en fila',
    category: 'content',
    icon: '☰',
    html: `<div class="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto px-4 py-8" data-section="__new__">
  <div class="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
    <h3 class="font-bold text-[#0f1d3a] mb-2" data-field="card1_title">Tarjeta 1</h3>
    <p class="text-gray-600 text-sm" data-field="card1_desc">Descripción de la primera tarjeta.</p>
  </div>
  <div class="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
    <h3 class="font-bold text-[#0f1d3a] mb-2" data-field="card2_title">Tarjeta 2</h3>
    <p class="text-gray-600 text-sm" data-field="card2_desc">Descripción de la segunda tarjeta.</p>
  </div>
  <div class="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
    <h3 class="font-bold text-[#0f1d3a] mb-2" data-field="card3_title">Tarjeta 3</h3>
    <p class="text-gray-600 text-sm" data-field="card3_desc">Descripción de la tercera tarjeta.</p>
  </div>
</div>`,
    defaultContent: {
      card1_title: 'Tarjeta 1', card1_desc: 'Descripción 1',
      card2_title: 'Tarjeta 2', card2_desc: 'Descripción 2',
      card3_title: 'Tarjeta 3', card3_desc: 'Descripción 3',
    },
    editableFields: [
      { key: 'card1_title', label: 'Tarjeta 1 - título', type: 'text' },
      { key: 'card1_desc', label: 'Tarjeta 1 - descripción', type: 'textarea' },
      { key: 'card2_title', label: 'Tarjeta 2 - título', type: 'text' },
      { key: 'card2_desc', label: 'Tarjeta 2 - descripción', type: 'textarea' },
      { key: 'card3_title', label: 'Tarjeta 3 - título', type: 'text' },
      { key: 'card3_desc', label: 'Tarjeta 3 - descripción', type: 'textarea' },
    ],
  },

  // ─── Media ─────────────────────────────────────────────────
  {
    id: 'image',
    name: 'Imagen',
    description: 'Imagen con placeholder',
    category: 'media',
    icon: '🖼',
    html: `<div class="max-w-7xl mx-auto px-4 py-4" data-section="__new__">
  <div class="bg-gray-100 rounded-lg h-48 flex items-center justify-center text-gray-400" data-field="image">
    <span>Hacé clic para reemplazar imagen</span>
  </div>
</div>`,
    defaultContent: { image: 'Imagen placeholder' },
    editableFields: [{ key: 'image', label: 'URL de imagen', type: 'text' }],
  },
  {
    id: 'image-with-text',
    name: 'Imagen + texto',
    description: 'Imagen y texto lado a lado',
    category: 'media',
    icon: '▤',
    html: `<div class="grid grid-cols-1 md:grid-cols-2 gap-8 items-center max-w-7xl mx-auto px-4 py-8" data-section="__new__">
  <div class="bg-gray-100 rounded-lg h-64 flex items-center justify-center text-gray-400" data-field="image">Imagen</div>
  <div>
    <h3 class="text-xl font-bold text-[#0f1d3a] mb-3" data-field="title">Texto junto a imagen</h3>
    <p class="text-gray-600" data-field="text">Contenido descriptivo que acompaña a la imagen.</p>
  </div>
</div>`,
    defaultContent: { image: '', title: 'Texto junto a imagen', text: 'Contenido descriptivo.' },
    editableFields: [
      { key: 'image', label: 'URL de imagen', type: 'text' },
      { key: 'title', label: 'Título', type: 'text' },
      { key: 'text', label: 'Texto', type: 'richtext' },
    ],
  },

  // ─── Legal ─────────────────────────────────────────────────
  {
    id: 'legal-notice',
    name: 'Aviso legal',
    description: 'Bloque de información legal',
    category: 'legal',
    icon: '⚖',
    html: `<div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800" data-section="__new__" data-field="notice">
  <strong>⚖ Aviso importante:</strong> Esta información tiene carácter orientativo y no constituye asesoría legal. Consulte a un abogado para su caso concreto.
</div>`,
    defaultContent: { notice: 'Aviso importante: información orientativa.' },
    editableFields: [{ key: 'notice', label: 'Texto del aviso', type: 'textarea' }],
  },
  {
    id: 'disclaimer-block',
    name: 'Disclaimer',
    description: 'Exención de responsabilidad',
    category: 'legal',
    icon: '⚠',
    html: `<div class="bg-gray-50 border border-gray-200 rounded-lg p-4 text-xs text-gray-500" data-section="__new__" data-field="disclaimer">
  <strong>Exención de responsabilidad:</strong> Los resultados de esta calculadora son orientativos y no constituyen asesoría legal. Consulte con un abogado para un análisis definitivo.
</div>`,
    defaultContent: { disclaimer: 'Exención de responsabilidad estándar.' },
    editableFields: [{ key: 'disclaimer', label: 'Texto', type: 'textarea' }],
  },

  // ─── Contact ───────────────────────────────────────────────
  {
    id: 'contact-info',
    name: 'Información de contacto',
    description: 'Bloque de contacto',
    category: 'content',
    icon: '✉',
    html: `<div class="bg-gray-50 rounded-lg p-6" data-section="__new__">
  <h3 class="font-bold text-[#0f1d3a] mb-3" data-field="title">Contacto</h3>
  <div class="space-y-2 text-sm text-gray-600">
    <p data-field="phone">📞 +504 XXXX-XXXX</p>
    <p data-field="email">✉ info@pinedayasociadoshn.com</p>
    <p data-field="address">📍 Nacaome, Valle, Honduras</p>
  </div>
</div>`,
    defaultContent: { title: 'Contacto', phone: '+504 XXXX-XXXX', email: 'info@pinedayasociadoshn.com', address: 'Nacaome, Valle, Honduras' },
    editableFields: [
      { key: 'title', label: 'Título', type: 'text' },
      { key: 'phone', label: 'Teléfono', type: 'text' },
      { key: 'email', label: 'Email', type: 'text' },
      { key: 'address', label: 'Dirección', type: 'text' },
    ],
  },
  {
    id: 'whatsapp-button',
    name: 'Botón WhatsApp',
    description: 'Botón de contacto por WhatsApp',
    category: 'interactive',
    icon: '💬',
    html: `<a href="https://wa.me/504XXXXXXXXX?text=Hola%2C%20necesito%20una%20consulta%20jur%C3%ADdica." target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 h-11 px-6 rounded-md bg-[#25D366] text-white font-bold text-sm hover:bg-[#20BD5A] transition-colors" data-section="__new__" data-field="button">💬 WhatsApp</a>`,
    defaultContent: { button: 'WhatsApp' },
    editableFields: [{ key: 'button', label: 'Texto', type: 'text' }],
  },

  // ─── Feature / Stats ──────────────────────────────────────
  {
    id: 'stats-bar',
    name: 'Barra de estadísticas',
    description: 'Métrica horizontal',
    category: 'content',
    icon: '📊',
    html: `<div class="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-7xl mx-auto px-4 py-8" data-section="__new__">
  <div class="text-center">
    <div class="text-2xl font-bold text-[#c9a55c]" data-field="stat1_value">483</div>
    <div class="text-xs text-gray-500" data-field="stat1_label">Delitos</div>
  </div>
  <div class="text-center">
    <div class="text-2xl font-bold text-[#c9a55c]" data-field="stat2_value">635</div>
    <div class="text-xs text-gray-500" data-field="stat2_label">Arts. CP</div>
  </div>
  <div class="text-center">
    <div class="text-2xl font-bold text-[#c9a55c]" data-field="stat3_value">119</div>
    <div class="text-xs text-gray-500" data-field="stat3_label">Ramas</div>
  </div>
  <div class="text-center">
    <div class="text-2xl font-bold text-[#c9a55c]" data-field="stat4_value">8</div>
    <div class="text-xs text-gray-500" data-field="stat4_label">Pasos</div>
  </div>
</div>`,
    defaultContent: { stat1_value: '483', stat1_label: 'Delitos', stat2_value: '635', stat2_label: 'Arts. CP', stat3_value: '119', stat3_label: 'Ramas', stat4_value: '8', stat4_label: 'Pasos' },
    editableFields: [
      { key: 'stat1_value', label: 'Valor 1', type: 'text' }, { key: 'stat1_label', label: 'Etiqueta 1', type: 'text' },
      { key: 'stat2_value', label: 'Valor 2', type: 'text' }, { key: 'stat2_label', label: 'Etiqueta 2', type: 'text' },
      { key: 'stat3_value', label: 'Valor 3', type: 'text' }, { key: 'stat3_label', label: 'Etiqueta 3', type: 'text' },
      { key: 'stat4_value', label: 'Valor 4', type: 'text' }, { key: 'stat4_label', label: 'Etiqueta 4', type: 'text' },
    ],
  },
  {
    id: 'icon-feature',
    name: 'Característica con icono',
    description: 'Feature con icono circular',
    category: 'content',
    icon: '⊕',
    html: `<div class="flex items-start gap-4 max-w-7xl mx-auto px-4 py-4" data-section="__new__">
  <div class="w-12 h-12 rounded-full bg-[#c9a55c]/20 flex items-center justify-center flex-shrink-0">
    <span class="text-[#c9a55c] font-bold text-lg">✓</span>
  </div>
  <div>
    <h4 class="font-bold text-[#0f1d3a]" data-field="title">Característica</h4>
    <p class="text-gray-600 text-sm" data-field="desc">Descripción de esta característica.</p>
  </div>
</div>`,
    defaultContent: { title: 'Característica', desc: 'Descripción de esta característica.' },
    editableFields: [
      { key: 'title', label: 'Título', type: 'text' },
      { key: 'desc', label: 'Descripción', type: 'textarea' },
    ],
  },
];

export function getComponentsByCategory(): Record<ComponentCategory, EditorComponentDef[]> {
  const grouped: Record<string, EditorComponentDef[]> = {};
  for (const c of components) {
    if (!grouped[c.category]) grouped[c.category] = [];
    grouped[c.category].push(c);
  }
  return grouped as Record<ComponentCategory, EditorComponentDef[]>;
}

export function getComponentById(id: string): EditorComponentDef | undefined {
  return components.find(c => c.id === id);
}

export const CATEGORY_LABELS: Record<ComponentCategory, string> = {
  layout: 'Estructura',
  content: 'Contenido',
  media: 'Multimedia',
  interactive: 'Botones y CTA',
  legal: 'Legal',
};

export const ALL_COMPONENTS = components;
