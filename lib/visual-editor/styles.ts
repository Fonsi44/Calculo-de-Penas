export const EDITOR_CSS = `
/* ─── Element-level editing ──────────────────────────────── */
.ve-active .ve-el {
  outline: 2px dashed rgba(212,175,55,0.4);
  outline-offset: 2px;
  cursor: text;
  transition: outline-color 0.15s, background-color 0.15s;
  border-radius: 2px;
}
.ve-active .ve-el:hover {
  outline-color: rgba(212,175,55,0.8);
  background-color: rgba(212,175,55,0.04);
}
.ve-active .ve-el.ve-selected {
  outline: 2px solid #c9a55c;
  outline-offset: 2px;
  background-color: rgba(212,175,55,0.08);
}
.ve-active .ve-el.ve-selected.ve-editing {
  outline: 2px solid #a68840;
  background-color: rgba(255,255,255,0.95);
  box-shadow: 0 0 0 4px rgba(212,175,55,0.15);
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

/* ─── Block-level editing ────────────────────────────────── */
.ve-block {
  position: relative;
  transition: box-shadow 0.15s;
}
.ve-block:hover {
  box-shadow: inset 0 0 0 1px rgba(212,175,55,0.25);
}
.ve-block.ve-block-selected {
  box-shadow: inset 0 0 0 2px rgba(212,175,55,0.5);
}

/* Block toolbar — appears on hover */
.ve-block-toolbar {
  display: none;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
}
.ve-block:hover > .ve-block-toolbar {
  display: block;
}

/* Block inserter — appears between blocks */
.ve-block-inserter {
  position: relative;
  z-index: 50;
}

/* Image editing badges */
.ve-image-editable {
  position: relative;
  cursor: pointer;
}
.ve-image-editable::after {
  content: "🖼 Reemplazar imagen";
  position: absolute;
  bottom: 4px;
  right: 4px;
  background: rgba(15,29,58,0.85);
  color: #fff;
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 4px;
  opacity: 0;
  transition: opacity 0.15s;
  pointer-events: none;
  font-family: system-ui, sans-serif;
}
.ve-image-editable:hover::after {
  opacity: 1;
}

/* Button editing badges */
.ve-btn-editable {
  position: relative;
  cursor: pointer;
}
.ve-btn-editable::after {
  content: "🔗 Editar enlace";
  position: absolute;
  bottom: calc(100% + 4px);
  left: 50%;
  transform: translateX(-50%);
  background: rgba(15,29,58,0.85);
  color: #fff;
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 4px;
  opacity: 0;
  transition: opacity 0.15s;
  pointer-events: none;
  white-space: nowrap;
  font-family: system-ui, sans-serif;
}
.ve-btn-editable:hover::after {
  opacity: 1;
}

/* Section highlight for block-level selection */
.ve-section-highlight {
  outline: 2px dashed rgba(15,29,58,0.12);
  outline-offset: -2px;
  position: relative;
}
.ve-section-highlight:hover {
  outline-color: rgba(15,29,58,0.35);
}

/* Hidden block indicator */
.ve-block-hidden {
  opacity: 0.4;
  filter: grayscale(0.8);
  position: relative;
}
.ve-block-hidden::before {
  content: "BLOQUE OCULTO — Visible solo en admin";
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
`;
