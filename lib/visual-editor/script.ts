export function generateEditorScript(
  contentMap: Record<string, string>,
  page: string,
  options?: {
    layout?: string[];
    visibility?: Record<string, boolean>;
    status?: string;
  }
): string {
  const mapJson = JSON.stringify(contentMap).replace(/<\/script>/gi, '<\\/script>');
  const pageJson = JSON.stringify(page);
  const layoutJson = JSON.stringify(options?.layout ?? []);
  const visibilityJson = JSON.stringify(options?.visibility ?? {});
  const statusJson = JSON.stringify(options?.status ?? 'draft');

  return `
(function(){
var PAGE = ${pageJson};
var CONTENT_MAP = ${mapJson};
var LAYOUT = ${layoutJson};
var VISIBILITY = ${visibilityJson};
var STATUS = ${statusJson};

// ─── Build reverse map for O(n) lookup ────────────────────
var REVERSE_MAP = {};
var CONTENT_KEYS = Object.keys(CONTENT_MAP);
for (var ki = 0; ki < CONTENT_KEYS.length; ki++) {
  var key = CONTENT_KEYS[ki];
  var val = CONTENT_MAP[key];
  if (val && val.length > 2) {
    var normalized = val.replace(/<[^>]*>/g, '').replace(/\\s+/g, ' ').trim();
    if (normalized.length > 2) {
      REVERSE_MAP[normalized] = key;
      var keyLower = normalized.toLowerCase();
      if (keyLower !== normalized) REVERSE_MAP[keyLower] = key;
    }
  }
}

var SELECTED = null;
var IS_EDITING = false;
var IS_PREVIEW = false;
var TOOLTIP = null;
var BREADCRUMBS = [];
var TOOLTIP_RAF = null;
var HIGHLIGHT_CACHE = new Set();

function normalize(t) {
  try { return t.replace(/<[^>]*>/g, '').replace(/\\s+/g, ' ').trim(); } catch(e) { return ''; }
}

function veReportError(msg) {
  try {
    window.parent.postMessage({ type: 've:error', page: PAGE, message: String(msg).slice(0, 200) }, window.location.origin);
  } catch(e) {}
}

// ─── MATCH ELEMENTS: O(n) using REVERSE_MAP lookup ─────────
function matchElements() {
  try {
    var candidates = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, li, a, button, label, blockquote, td, th, div');
    var matched = new Set();

    for (var ei = 0; ei < candidates.length; ei++) {
      var el = candidates[ei];
      if (matched.has(el)) continue;
      if (el.closest('script, style, noscript, svg, path, code, pre')) continue;
      if (el.offsetParent === null && el.closest('[data-ve-hidden]') === null) continue;
      if (el.hasAttribute('data-noedit')) continue;

      // First check for existing data-section/data-field (already injected server-side)
      var existingSection = el.getAttribute('data-section');
      var existingField = el.getAttribute('data-field');
      if (existingSection && existingField) {
        el.classList.add('ve-el');
        el.setAttribute('tabindex', '0');
        matched.add(el);
        el.setAttribute('contenteditable', 'true');
        if (CONTENT_MAP[existingSection + '.' + existingField] && CONTENT_MAP[existingSection + '.' + existingField].indexOf('<') !== -1) {
          el.setAttribute('data-richtext', 'true');
        }
        continue;
      }

      // Fallback: O(1) REVERSE_MAP lookup by text content
      var elText = normalize(el.textContent);
      if (elText.length < 3) continue;

      var matchedKey = REVERSE_MAP[elText] || REVERSE_MAP[elText.toLowerCase()];
      if (!matchedKey) continue;

      var parts = matchedKey.split('.');
      var section = parts.slice(0, -1).join('.') || parts[0];
      var field = parts[parts.length - 1];

      el.setAttribute('data-section', section);
      el.setAttribute('data-field', field);
      el.setAttribute('data-page', PAGE);
      el.classList.add('ve-el');
      el.setAttribute('tabindex', '0');
      el.setAttribute('contenteditable', 'true');

      if (CONTENT_MAP[matchedKey] && CONTENT_MAP[matchedKey].indexOf('<') !== -1) {
        el.setAttribute('data-richtext', 'true');
      }
      matched.add(el);
    }

    HIGHLIGHT_CACHE = matched;
    markHiddenBlocks();
  } catch(e) {
    veReportError('matchElements: ' + e.message);
  }
}

function markHiddenBlocks() {
  try {
    for (var section in VISIBILITY) {
      if (VISIBILITY[section] === false) {
        var els = document.querySelectorAll('[data-section="' + section + '"]');
        for (var i = 0; i < els.length; i++) {
          var block = els[i].closest('section') || els[i].parentElement;
          if (block) block.classList.add('ve-block-hidden');
        }
      }
    }
  } catch(e) {}
}

// ─── TOOLTIP (throttled via requestAnimationFrame) ─────────
function createTooltip() {
  try {
    TOOLTIP = document.createElement('div');
    TOOLTIP.className = 've-tooltip';
    TOOLTIP.id = 've-tooltip';
    document.body.appendChild(TOOLTIP);
  } catch(e) {}
}

function showTooltip(el, x, y) {
  if (!TOOLTIP) createTooltip();
  if (!TOOLTIP) return;
  var section = el.getAttribute('data-section') || '';
  var field = el.getAttribute('data-field') || '';
  var type = el.hasAttribute('data-richtext') ? 'richtext' : 'texto';
  TOOLTIP.innerHTML = '<em>' + section + ' → ' + field + '</em> (' + type + ')';
  TOOLTIP.style.display = 'block';

  if (TOOLTIP_RAF) cancelAnimationFrame(TOOLTIP_RAF);
  TOOLTIP_RAF = requestAnimationFrame(function() {
    var tx = Math.min(x + 12, window.innerWidth - TOOLTIP.offsetWidth - 10);
    var ty = Math.min(y + 12, window.innerHeight - TOOLTIP.offsetHeight - 10);
    TOOLTIP.style.left = Math.max(4, tx) + 'px';
    TOOLTIP.style.top = Math.max(4, ty) + 'px';
    TOOLTIP_RAF = null;
  });
}

function hideTooltip() {
  if (TOOLTIP_RAF) cancelAnimationFrame(TOOLTIP_RAF);
  try { if (TOOLTIP) TOOLTIP.style.display = 'none'; } catch(e) {}
}

// ─── SELECTION ──────────────────────────────────────────────
function selectElement(el) {
  try {
    if (SELECTED && SELECTED !== el) {
      SELECTED.classList.remove('ve-selected', 've-editing');
    }
    SELECTED = el;
    el.classList.add('ve-selected');
    IS_EDITING = false;

    var section = el.getAttribute('data-section') || '';
    var field = el.getAttribute('data-field') || '';
    var content = el.innerHTML || el.textContent || '';
    var isRt = el.hasAttribute('data-richtext');

    breadcrumbBuild(el);
    sendToParent('ve:select', {
      section: section, field: field, content: content,
      isRichtext: isRt, tagName: el.tagName.toLowerCase(), className: el.className
    });
  } catch(e) { veReportError('select: ' + e.message); }
}

function deselectAll() {
  try {
    if (SELECTED) {
      SELECTED.classList.remove('ve-selected', 've-editing');
      SELECTED = null;
    }
    IS_EDITING = false;
    hideTooltip();
    breadcrumbClear();
    sendToParent('ve:deselect', {});
  } catch(e) {}
}

function sendToParent(type, data) {
  try {
    var msg = { type: type, page: PAGE };
    for (var k in data) msg[k] = data[k];
    window.parent.postMessage(msg, window.location.origin);
  } catch(e) {}
}

// ─── BREADCRUMB ─────────────────────────────────────────────
function breadcrumbBuild(el) {
  try {
    BREADCRUMBS = [];
    var current = el.parentElement;
    var depth = 0;
    while (current && current !== document.body && current !== document.documentElement && depth < 5) {
      var tag = current.tagName.toLowerCase();
      var id = current.id ? '#' + current.id : '';
      var cls = '';
      if (current.className && typeof current.className === 'string') {
        cls = '.' + current.className.split(' ').filter(function(c) {
          return c && c.indexOf('ve-') !== 0 && c.indexOf('se-') !== 0;
        }).slice(0, 2).join('.');
      }
      BREADCRUMBS.unshift({ tag: tag + id + cls, section: current.getAttribute('data-section') || '' });
      current = current.parentElement;
      depth++;
    }
    sendToParent('ve:breadcrumb', { breadcrumbs: BREADCRUMBS });
  } catch(e) {}
}

function breadcrumbClear() {
  BREADCRUMBS = [];
  sendToParent('ve:breadcrumb', { breadcrumbs: [] });
}

// ─── EDIT MODE ──────────────────────────────────────────────
function enterEditMode(el) {
  try {
    if (!el) return;
    IS_EDITING = true;
    el.classList.add('ve-editing');
    el.setAttribute('contenteditable', 'true');
    el.focus();
    try {
      var range = document.createRange();
      range.selectNodeContents(el);
      var sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    } catch(e) {}
    sendToParent('ve:editing', { section: el.getAttribute('data-section'), field: el.getAttribute('data-field') });
  } catch(e) { veReportError('enterEdit: ' + e.message); }
}

function exitEditMode(el) {
  try {
    if (!el) return;
    IS_EDITING = false;
    el.classList.remove('ve-editing');
    sendUpdate(el);
    try { window.getSelection().removeAllRanges(); } catch(e) {}
  } catch(e) {}
}

function sendUpdate(el) {
  try {
    if (!el) return;
    sendToParent('ve:update', {
      section: el.getAttribute('data-section') || '',
      field: el.getAttribute('data-field') || '',
      content: el.innerHTML
    });
  } catch(e) {}
}

// ─── STYLES ─────────────────────────────────────────────────
function applyStyle(data) {
  try {
    if (!SELECTED) return;
    if (data.bold !== undefined) document.execCommand('bold');
    if (data.italic !== undefined) document.execCommand('italic');
    if (data.underline !== undefined) document.execCommand('underline');
    if (data.fontSize) SELECTED.style.fontSize = data.fontSize;
    if (data.color) document.execCommand('foreColor', false, data.color);
    if (data.textAlign) SELECTED.style.textAlign = data.textAlign;
    sendUpdate(SELECTED);
  } catch(e) { veReportError('style: ' + e.message); }
}

// ─── EVENTS: single consolidated click handler ─────────────
function setupEvents() {
  document.addEventListener('click', function(e) {
    if (IS_PREVIEW) return;
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    var el = e.target.closest('.ve-el');
    if (el) {
      if (SELECTED === el && !IS_EDITING) {
        enterEditMode(el);
      } else {
        selectElement(el);
      }
    } else {
      breadcrumbClear();
      deselectAll();
    }
  }, true);

  document.addEventListener('mousedown', function(e) {
    if (IS_PREVIEW) return;
    e.preventDefault();
    e.stopPropagation();
  }, true);

  document.addEventListener('mouseup', function(e) {
    if (IS_PREVIEW) return;
    e.preventDefault();
    e.stopPropagation();
  }, true);

  document.addEventListener('dblclick', function(e) {
    if (IS_PREVIEW) return;
    e.preventDefault();
    e.stopPropagation();
    var el = e.target.closest('.ve-el');
    if (el) enterEditMode(el);
  }, true);

  document.addEventListener('submit', function(e) {
    if (IS_PREVIEW) return;
    e.preventDefault();
    e.stopPropagation();
  }, true);

  document.addEventListener('keydown', function(e) {
    if (IS_PREVIEW) return;
    if (e.key === 'Escape' && IS_EDITING) {
      e.preventDefault();
      exitEditMode(SELECTED);
      return;
    }
    if (e.key === 'Enter' && !e.shiftKey && SELECTED && !SELECTED.hasAttribute('data-richtext') && IS_EDITING) {
      e.preventDefault();
      exitEditMode(SELECTED);
      return;
    }
  }, true);

  document.addEventListener('contextmenu', function(e) {
    if (IS_PREVIEW) return;
    e.preventDefault();
    e.stopPropagation();
  }, true);

  document.addEventListener('dragstart', function(e) {
    if (IS_PREVIEW) return;
    e.preventDefault();
  }, true);

  // Input handler for live updates during editing
  document.addEventListener('input', function(e) {
    try {
      var el = e.target.closest('.ve-el');
      if (el && IS_EDITING) sendUpdate(el);
    } catch(inner) {}
  }, true);
}

// ─── HOVER (throttled) ──────────────────────────────────────
function setupHover() {
  var hoverRAF = null;
  document.addEventListener('mouseover', function(e) {
    if (IS_PREVIEW) return;
    if (hoverRAF) cancelAnimationFrame(hoverRAF);
    hoverRAF = requestAnimationFrame(function() {
      try {
        var el = e.target.closest('.ve-el');
        if (el && !IS_EDITING) showTooltip(el, e.clientX, e.clientY);
        else hideTooltip();
      } catch(inner) {}
      hoverRAF = null;
    });
  }, true);

  document.addEventListener('mouseout', function(e) {
    if (IS_PREVIEW) return;
    if (hoverRAF) cancelAnimationFrame(hoverRAF);
    hoverRAF = requestAnimationFrame(function() {
      try {
        if (!IS_EDITING && !document.querySelector('.ve-el:hover')) hideTooltip();
      } catch(inner) {}
      hoverRAF = null;
    });
  }, true);
}

// ─── POST-MESSAGE ───────────────────────────────────────────
function setupPostMessage() {
  window.addEventListener('message', function(e) {
    if (e.origin !== window.location.origin && e.origin !== 'null') return;
    try {
      if (!e.data || !e.data.type) return;
      switch (e.data.type) {
        case 've:set-content':
          if (SELECTED && e.data.content !== undefined) {
            if (e.data.isHtml) SELECTED.innerHTML = e.data.content;
            else SELECTED.textContent = e.data.content;
            sendUpdate(SELECTED);
          }
          break;
        case 've:deselect': deselectAll(); break;
        case 've:style': applyStyle(e.data); break;
        case 've:refresh': refreshEditor(); break;
        case 've:focus':
          if (SELECTED) {
            SELECTED.scrollIntoView({ behavior: 'smooth', block: 'center' });
            enterEditMode(SELECTED);
          }
          break;
        case 've:preview':
          IS_PREVIEW = true;
          document.body.classList.remove('ve-active');
          document.body.classList.add('ve-preview');
          document.querySelectorAll('.ve-el').forEach(function(el) {
            el.removeAttribute('contenteditable');
            el.classList.remove('ve-selected', 've-editing');
          });
          deselectAll();
          hideTooltip();
          break;
        case 've:edit':
          IS_PREVIEW = false;
          document.body.classList.remove('ve-preview');
          document.body.classList.add('ve-active');
          matchElements();
          markHiddenBlocks();
          break;
        case 've:insert-component':
          insertComponent(e.data.html, e.data.section);
          break;
        case 've:remove-element': removeElement(e.data.section); break;
        case 've:hide-element': hideElement(e.data.section); break;
        case 've:show-element': showElement(e.data.section); break;
        case 've:move-up': moveElementUp(e.data.section); break;
        case 've:move-down': moveElementDown(e.data.section); break;
        case 've:duplicate-element': duplicateElement(e.data.section); break;
        case 've:get-debug-info':
          sendToParent('ve:debug-info', {
            matchedCount: HIGHLIGHT_CACHE.size,
            contentKeys: CONTENT_KEYS.length,
            reverseMapSize: Object.keys(REVERSE_MAP).length,
            selectedTag: SELECTED ? SELECTED.tagName : null,
            isEditing: IS_EDITING,
            listenerCount: 1
          });
          break;
        case 've:select-ancestor':
          selectAncestor();
          break;
        case 've:select-descendant':
          selectDescendant();
          break;
      }
    } catch(inner) {}
  });
}

// ─── COMPONENT OPERATIONS ───────────────────────────────────
function insertComponent(html, sectionName) {
  try {
    if (sectionName) {
      var target = document.querySelector('[data-section="' + sectionName + '"]');
      if (target) target.insertAdjacentHTML('afterend', html);
      else document.body.insertAdjacentHTML('beforeend', html);
    } else if (SELECTED) {
      SELECTED.insertAdjacentHTML('afterend', html);
    } else {
      document.body.insertAdjacentHTML('beforeend', html);
    }
    // Assign a unique temp key so the new element is immediately editable
    assignTempKeys();
    refreshEditor();
    sendToParent('ve:component-inserted', {});
  } catch(e) { veReportError('insert: ' + e.message); }
}

function assignTempKeys() {
  var idx = 0;
  var els = document.querySelectorAll('[data-section="__new__"]');
  for (var i = 0; i < els.length; i++) {
    var el = els[i];
    var field = el.getAttribute('data-field') || 'content';
    var uid = '__new_' + (idx++) + '_' + Date.now();
    el.setAttribute('data-section', uid);
    if (!el.hasAttribute('data-field')) el.setAttribute('data-field', field);
    el.setAttribute('data-page', PAGE);
    if (CONTENT_MAP[uid + '.' + field] === undefined) {
      CONTENT_MAP[uid + '.' + field] = el.innerHTML || el.textContent || '';
      REVERSE_MAP[normalize(CONTENT_MAP[uid + '.' + field])] = uid + '.' + field;
    }
  }
}

function removeElement(sectionKey) {
  try {
    var els = document.querySelectorAll('[data-section="' + sectionKey + '"]');
    for (var i = 0; i < els.length; i++) {
      var block = els[i].closest('section') || els[i].parentElement;
      if (block && block !== document.body) {
        block.dataset.veRemoved = 'true';
        block.classList.add('ve-removed');
      }
    }
    sendToParent('ve:element-removed', { section: sectionKey });
    deselectAll();
  } catch(e) { veReportError('remove: ' + e.message); }
}

function hideElement(sectionKey) {
  try {
    var els = document.querySelectorAll('[data-section="' + sectionKey + '"]');
    for (var i = 0; i < els.length; i++) {
      var block = els[i].closest('section') || els[i].parentElement;
      if (block && block !== document.body) {
        block.dataset.veHidden = 'true';
        block.style.display = 'none';
        block.classList.add('ve-hidden-by-editor');
      }
    }
    sendToParent('ve:element-hidden', { section: sectionKey });
    deselectAll();
  } catch(e) { veReportError('hide: ' + e.message); }
}

function showElement(sectionKey) {
  try {
    var els = document.querySelectorAll('[data-section="' + sectionKey + '"]');
    for (var i = 0; i < els.length; i++) {
      var block = els[i].closest('section') || els[i].parentElement;
      if (block) {
        delete block.dataset.veHidden;
        block.style.display = '';
        block.classList.remove('ve-hidden-by-editor');
      }
    }
    sendToParent('ve:element-shown', { section: sectionKey });
  } catch(e) { veReportError('show: ' + e.message); }
}

function moveElementUp(sectionKey) {
  try {
    if (!sectionKey) return;
    var els = document.querySelectorAll('[data-section="' + sectionKey + '"]');
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      var prev = el.previousElementSibling;
      if (prev) {
        el.parentElement.insertBefore(el, prev);
        break;
      }
    }
    refreshEditor();
    sendToParent('ve:element-moved', { section: sectionKey, direction: 'up' });
  } catch(e) { veReportError('moveUp: ' + e.message); }
}

function moveElementDown(sectionKey) {
  try {
    if (!sectionKey) return;
    var els = document.querySelectorAll('[data-section="' + sectionKey + '"]');
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      var next = el.nextElementSibling;
      if (next) {
        el.parentElement.insertBefore(next, el);
        break;
      }
    }
    refreshEditor();
    sendToParent('ve:element-moved', { section: sectionKey, direction: 'down' });
  } catch(e) { veReportError('moveDown: ' + e.message); }
}

function duplicateElement(sectionKey) {
  try {
    if (!sectionKey) return;
    var els = document.querySelectorAll('[data-section="' + sectionKey + '"]');
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      var clone = el.cloneNode(true);
      clone.removeAttribute('data-section');
      clone.setAttribute('data-section', sectionKey + '_copy');
      var parent = el.parentElement;
      if (parent) {
        parent.insertBefore(clone, el.nextSibling);
        break;
      }
    }
    refreshEditor();
    sendToParent('ve:element-duplicated', { section: sectionKey });
  } catch(e) { veReportError('duplicate: ' + e.message); }
}

// ─── ANCESTOR/DESCENDANT NAVIGATION ─────────────────────────
function selectAncestor() {
  try {
    if (!SELECTED) return;
    var parent = SELECTED.parentElement;
    if (parent && parent !== document.body && parent !== document.documentElement) {
      // Temporarily mark as ve-el to allow selection
      if (!parent.classList.contains('ve-el')) {
        parent.classList.add('ve-el', 've-parent-highlight');
        parent.setAttribute('data-section', SELECTED.getAttribute('data-section') || 'parent');
        parent.setAttribute('data-field', SELECTED.getAttribute('data-field') || 'container');
      }
      selectElement(parent);
    }
  } catch(e) { veReportError('ancestor: ' + e.message); }
}

function selectDescendant() {
  try {
    if (!SELECTED) return;
    var child = SELECTED.querySelector('.ve-el');
    if (child) selectElement(child);
  } catch(e) { veReportError('descendant: ' + e.message); }
}

// ─── REFRESH ─────────────────────────────────────────────────
function refreshEditor() {
  try {
    SELECTED = null;
    IS_EDITING = false;
    document.querySelectorAll('.ve-el').forEach(function(el) {
      try { el.classList.remove('ve-selected', 've-editing', 've-parent-highlight'); } catch(e) {}
    });
    matchElements();
    markHiddenBlocks();
  } catch(e) { veReportError('refresh: ' + e.message); }
}

// ─── INIT ──────────────────────────────────────────────────
try {
  window.__veReady = true;
  document.body.classList.add('ve-active');
  matchElements();
  setupEvents();
  setupHover();
  setupPostMessage();
  createTooltip();
  hideTooltip();
  markHiddenBlocks();
  sendToParent('ve:ready', {});
} catch(e) {
  veReportError('init: ' + e.message);
  sendToParent('ve:ready', { initError: true, message: e.message });
}
})();
`;
}
