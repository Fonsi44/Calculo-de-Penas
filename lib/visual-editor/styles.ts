export const EDITOR_CSS = `
/* ─── Mode indicator ────────────────────────────────────────── */
.ve-active::before {
  content: '✎ MODO EDICIÓN — Los clics no navegan. Seleccioná un elemento para editarlo.';
  position: fixed;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2147483646;
  background: #0f1d3a;
  color: #c9a55c;
  font-size: 11px;
  font-weight: 600;
  padding: 6px 20px;
  border-radius: 20px;
  font-family: system-ui, -apple-system, sans-serif;
  box-shadow: 0 4px 16px rgba(0,0,0,0.3);
  pointer-events: none;
  white-space: nowrap;
  letter-spacing: 0.3px;
  border: 1px solid rgba(201, 165, 92, 0.3);
}

.ve-preview::before {
  content: '👁 VISTA PREVIA — Navegación activa. Volvé al editor para hacer cambios.';
  position: fixed;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2147483646;
  background: #1a3a2a;
  color: #6fcf97;
  font-size: 11px;
  font-weight: 600;
  padding: 6px 20px;
  border-radius: 20px;
  font-family: system-ui, -apple-system, sans-serif;
  box-shadow: 0 4px 16px rgba(0,0,0,0.3);
  pointer-events: none;
  white-space: nowrap;
  letter-spacing: 0.3px;
  border: 1px solid rgba(111, 207, 151, 0.3);
}

/* ─── Element-level editing ──────────────────────────────── */
.ve-active .ve-el {
  outline: 2px dashed rgba(212,175,55,0.3);
  outline-offset: 1px;
  cursor: pointer;
  transition: outline-color 0.15s, background-color 0.15s, box-shadow 0.15s;
  border-radius: 2px;
  position: relative;
}
.ve-active .ve-el:hover {
  outline-color: rgba(212,175,55,0.7);
  background-color: rgba(212,175,55,0.04);
}
.ve-active .ve-el.ve-selected {
  outline: 2.5px solid #c9a55c;
  outline-offset: 1px;
  background-color: rgba(212,175,55,0.08);
  box-shadow: 0 0 0 3px rgba(212,175,55,0.12);
}
.ve-active .ve-el.ve-selected.ve-editing {
  outline: 2.5px solid #a68840;
  background-color: rgba(255,255,255,0.95);
  box-shadow: 0 0 0 4px rgba(212,175,55,0.15);
  cursor: text;
}

/* Selection highlight ring for parents */
.ve-active .ve-parent-highlight {
  outline: 1px dashed rgba(15,29,58,0.15);
  outline-offset: 0px;
}

.ve-tooltip {
  position: fixed;
  z-index: 2147483647;
  background: #0f1d3a;
  color: #fff;
  font-size: 11px;
  padding: 4px 10px;
  border-radius: 4px;
  pointer-events: none;
  white-space: nowrap;
  font-family: system-ui, -apple-system, sans-serif;
  box-shadow: 0 2px 8px rgba(0,0,0,0.25);
  border: 1px solid rgba(255,255,255,0.1);
  line-height: 1.4;
}
.ve-tooltip em {
  color: #c9a55c;
  font-style: normal;
  font-weight: 600;
}

/* Hidden block indicator */
.ve-block-hidden {
  opacity: 0.4;
  filter: grayscale(0.8);
  position: relative;
}
.ve-block-hidden::before {
  content: "BLOQUE OCULTO — Solo visible en admin";
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(255,193,7,0.9);
  color: #333;
  font-size: 11px;
  font-weight: 600;
  padding: 4px 16px;
  border-radius: 4px;
  z-index: 10;
  white-space: nowrap;
  font-family: system-ui, sans-serif;
}

/* Removed element marker */
.ve-removed {
  opacity: 0.2;
  pointer-events: none;
  position: relative;
}
.ve-removed::after {
  content: "ELEMENTO ELIMINADO — Guardá para confirmar";
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(220,38,38,0.85);
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  padding: 8px 24px;
  border-radius: 6px;
  z-index: 10;
  white-space: nowrap;
  font-family: system-ui, sans-serif;
  pointer-events: none;
}

/* ─── Preview mode resets everything ─────────────────────── */
.ve-preview .ve-el {
  outline: none !important;
  cursor: auto !important;
  background-color: transparent !important;
  box-shadow: none !important;
}
.ve-preview .ve-el:hover {
  outline: none !important;
  background-color: transparent !important;
}
.ve-preview .ve-el.ve-selected,
.ve-preview .ve-el.ve-editing {
  outline: none !important;
  background-color: transparent !important;
  box-shadow: none !important;
}
.ve-preview .ve-block-hidden {
  opacity: 1 !important;
  filter: none !important;
}
.ve-preview .ve-block-hidden::before {
  display: none !important;
}
.ve-preview .ve-removed {
  display: none !important;
}
.ve-preview .ve-removed::after {
  display: none !important;
}
.ve-preview .ve-hidden-by-editor {
  display: none !important;
}

/* No interactive elements in edit mode */
.ve-active a, .ve-active button, .ve-active [onclick], .ve-active [role="button"],
.ve-active input, .ve-active select, .ve-active textarea, .ve-active [tabindex]:not(.ve-el) {
  pointer-events: none !important;
}
.ve-active .ve-el {
  pointer-events: auto !important;
}
`;
