export const EDITOR_CSS = `
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

.ve-image-button {
  transition: opacity 0.15s;
}

.ve-section-highlight {
  outline: 2px dashed rgba(15,29,58,0.12);
  outline-offset: -2px;
  position: relative;
}
.ve-section-highlight:hover {
  outline-color: rgba(15,29,58,0.35);
}
`;
