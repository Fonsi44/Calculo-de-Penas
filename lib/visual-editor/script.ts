export function generateEditorScript(
  contentMap: Record<string, string>,
  page: string,
  options?: {
    layout?: string[];
    visibility?: Record<string, boolean>;
    status?: string;
  }
): string {
  const mapJson = JSON.stringify(contentMap);
  const pageJson = JSON.stringify(page);
  const layoutJson = JSON.stringify(options?.layout ?? []);
  const visibilityJson = JSON.stringify(options?.visibility ?? {});
  const statusJson = JSON.stringify(options?.status ?? 'draft');

  return `
(function(){
if (window.__veReady) return;

var PAGE = ${pageJson};
var CONTENT_MAP = ${mapJson};
var LAYOUT = ${layoutJson};
var VISIBILITY = ${visibilityJson};
var STATUS = ${statusJson};
var REVERSE_MAP = {};

for (var k in CONTENT_MAP) {
  var v = CONTENT_MAP[k];
  if (v && v.length > 2) REVERSE_MAP[v] = k;
}

var SELECTED = null;
var IS_EDITING = false;
var IS_PREVIEW = false;
var TOOLTIP = null;
var BREADCRUMBS = [];

var PREVIEW_STYLES = null;
var EDITOR_STYLES = document.getElementById('ve-styles');

function stripHtml(html) {
  try { return html.replace(/<[^>]*>/g, '').replace(/\\s+/g, ' ').trim(); } catch(e) { return ''; }
}

function normalizeText(t) {
  try { return t.replace(/\\s+/g, ' ').trim(); } catch(e) { return ''; }
}

function veReportError(msg) {
  try {
    window.parent.postMessage({ type: 've:error', page: PAGE, message: msg }, '*');
  } catch(e) {}
}

// ─── TOTAL EVENT INTERCEPTION ──────────────────────────────────
// In EDIT mode, ALL interactive events are blocked.
// In PREVIEW mode, normal behavior is restored.

function setupEventInterception() {
  // Intercept ALL clicks in capture phase (runs before any other handler)
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
    if (el) {
      enterEditMode(el);
    }
  }, true);

  document.addEventListener('submit', function(e) {
    if (IS_PREVIEW) return;
    e.preventDefault();
    e.stopPropagation();
  }, true);

  // Block all anchor navigation
  document.addEventListener('click', function(e) {
    if (IS_PREVIEW) return;
    var anchor = e.target.closest('a');
    if (anchor) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, true);

  // Block any element with onclick or href
  document.addEventListener('click', function(e) {
    if (IS_PREVIEW) return;
    var interactive = e.target.closest('a, button, [onclick], [role="button"], input, select, textarea, [tabindex]:not(.ve-el)');
    if (interactive) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, true);

  // Block key events that could navigate
  document.addEventListener('keydown', function(e) {
    if (IS_PREVIEW) return;
    if (e.key === 'Escape' && IS_EDITING) {
      e.preventDefault();
      e.stopPropagation();
      exitEditMode(SELECTED);
      return;
    }
    if (e.key === 'Enter' && !e.shiftKey && SELECTED && !SELECTED.hasAttribute('data-richtext') && IS_EDITING) {
      e.preventDefault();
      e.stopPropagation();
      exitEditMode(SELECTED);
      return;
    }
  }, true);

  // Block context menu
  document.addEventListener('contextmenu', function(e) {
    if (IS_PREVIEW) return;
    e.preventDefault();
    e.stopPropagation();
  }, true);

  // Block drag events that could navigate
  document.addEventListener('dragstart', function(e) {
    if (IS_PREVIEW) return;
    e.preventDefault();
  }, true);
}

function enterPreviewMode() {
  IS_PREVIEW = true;
  document.body.classList.remove('ve-active');
  document.body.classList.add('ve-preview');
  document.querySelectorAll('.ve-el').forEach(function(el) {
    el.removeAttribute('contenteditable');
    el.classList.remove('ve-selected', 've-editing');
  });
  deselectAll();
  hideTooltip();
}

function exitPreviewMode() {
  IS_PREVIEW = false;
  document.body.classList.remove('ve-preview');
  document.body.classList.add('ve-active');
  matchElements();
  markHiddenBlocks();
}

// ─── ELEMENT MATCHING ──────────────────────────────────────────

function matchElements() {
  try {
    var ALL_ELS = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, li, a, button, label, blockquote, td, th, div.eyebrow-rule, div > div > p, div > h1, div > h2, div > h3');
    var matched = new Set();
    var contentKeys = Object.keys(CONTENT_MAP);
    if (contentKeys.length === 0) return;

    for (var ki = 0; ki < contentKeys.length; ki++) {
      var key = contentKeys[ki];
      var content = CONTENT_MAP[key];
      if (!content || content.length < 2) continue;
      var clean = normalizeText(stripHtml(content));
      if (clean.length < 2) continue;

      for (var ei = 0; ei < ALL_ELS.length; ei++) {
        var el = ALL_ELS[ei];
        if (matched.has(el)) continue;
        if (el.closest('script, style, noscript, svg, path, code, pre')) continue;
        if (el.offsetParent === null) continue;
        if (el.hasAttribute('data-noedit')) continue;

        var elText = normalizeText(el.textContent);
        if (elText.length < 2) continue;

        var match = false;
        if (elText === clean) {
          match = true;
        } else if (clean.length > 10 && (elText.indexOf(clean) !== -1 || clean.indexOf(elText) !== -1)) {
          match = true;
        } else if (elText.length > 10 && clean.length > 10) {
          var shared = 0;
          var elParts = elText.split(' ');
          var cleanParts = clean.split(' ');
          for (var wi = 0; wi < elParts.length; wi++) {
            for (var wj = 0; wj < cleanParts.length; wj++) {
              if (elParts[wi] === cleanParts[wj]) { shared++; break; }
            }
          }
          var ratio = shared / Math.max(elParts.length, cleanParts.length);
          if (ratio > 0.6) match = true;
        }

        if (match) {
          var parts = key.split('.');
          var section = parts.slice(0, -1).join('.') || parts[0];
          var field = parts[parts.length - 1];
          el.setAttribute('data-section', section);
          el.setAttribute('data-field', field);
          el.setAttribute('data-page', PAGE);
          el.setAttribute('contenteditable', 'true');
          el.classList.add('ve-el');
          el.setAttribute('tabindex', '0');

          if (content.indexOf('<') !== -1) {
            el.setAttribute('data-richtext', 'true');
          }
          matched.add(el);
          break;
        }
      }
    }

    markHiddenBlocks();
  } catch(e) {
    veReportError('matchElements: ' + (e.message || e));
  }
}

function markHiddenBlocks() {
  try {
    for (var section in VISIBILITY) {
      if (VISIBILITY[section] === false) {
        var els = document.querySelectorAll('[data-section="' + section + '"]');
        for (var i = 0; i < els.length; i++) {
          var block = els[i].closest('section') || els[i].parentElement;
          if (block) {
            block.classList.add('ve-block-hidden');
          }
        }
      }
    }
  } catch(e) {}
}

// ─── TOOLTIP ───────────────────────────────────────────────────

function createTooltip() {
  try {
    TOOLTIP = document.createElement('div');
    TOOLTIP.className = 've-tooltip';
    TOOLTIP.id = 've-tooltip';
    document.body.appendChild(TOOLTIP);
  } catch(e) {
    veReportError('createTooltip: ' + (e.message || e));
  }
}

function showTooltip(el, x, y) {
  try {
    if (!TOOLTIP) createTooltip();
    if (!TOOLTIP) return;
    var section = el.getAttribute('data-section') || '';
    var field = el.getAttribute('data-field') || '';
    var type = el.hasAttribute('data-richtext') ? 'richtext' : 'texto';
    var label = section + ' → ' + field;
    TOOLTIP.innerHTML = '<em>' + label + '</em> (' + type + ')';
    TOOLTIP.style.display = 'block';
    var tx = x + 12;
    var ty = y + 12;
    var tw = TOOLTIP.offsetWidth;
    var th = TOOLTIP.offsetHeight;
    if (tx + tw > window.innerWidth - 10) tx = window.innerWidth - tw - 10;
    if (ty + th > window.innerHeight - 10) ty = window.innerHeight - th - 10;
    TOOLTIP.style.left = tx + 'px';
    TOOLTIP.style.top = ty + 'px';
  } catch(e) {}
}

function hideTooltip() {
  try { if (TOOLTIP) TOOLTIP.style.display = 'none'; } catch(e) {}
}

// ─── SELECTION ─────────────────────────────────────────────────

function selectElement(el) {
  try {
    if (SELECTED && SELECTED !== el) {
      SELECTED.classList.remove('ve-selected');
      SELECTED.classList.remove('ve-editing');
    }
    SELECTED = el;
    el.classList.add('ve-selected');
    IS_EDITING = false;

    var section = el.getAttribute('data-section') || '';
    var field = el.getAttribute('data-field') || '';
    var content = el.innerHTML || el.textContent || '';
    var isRt = el.hasAttribute('data-richtext');

    // Build breadcrumb
    breadcrumbBuild(el);

    window.parent.postMessage({
      type: 've:select',
      page: PAGE,
      section: section,
      field: field,
      content: content,
      isRichtext: isRt,
      tagName: el.tagName.toLowerCase(),
      className: el.className,
    }, '*');
  } catch(e) {
    veReportError('selectElement: ' + (e.message || e));
  }
}

function deselectAll() {
  try {
    if (SELECTED) {
      SELECTED.classList.remove('ve-selected');
      SELECTED.classList.remove('ve-editing');
      SELECTED = null;
    }
    IS_EDITING = false;
    hideTooltip();
    window.parent.postMessage({ type: 've:deselect' }, '*');
  } catch(e) {}
}

// ─── BREADCRUMB ────────────────────────────────────────────────

function breadcrumbBuild(el) {
  try {
    BREADCRUMBS = [];
    var current = el.parentElement;
    var maxDepth = 5;
    while (current && current !== document.body && BREADCRUMBS.length < maxDepth) {
      var tag = current.tagName.toLowerCase();
      var id = current.id ? '#' + current.id : '';
      var cls = current.className && typeof current.className === 'string'
        ? '.' + current.className.split(' ').filter(function(c) { return c && c.indexOf('ve-') !== 0; }).slice(0, 2).join('.')
        : '';
      var section = current.getAttribute('data-section') || '';
      BREADCRUMBS.unshift({
        tag: tag + id + cls,
        section: section,
        elRef: current
      });
      current = current.parentElement;
    }
    window.parent.postMessage({
      type: 've:breadcrumb',
      breadcrumbs: BREADCRUMBS.map(function(b) { return { tag: b.tag, section: b.section }; })
    }, '*');
  } catch(e) {}
}

function breadcrumbClear() {
  BREADCRUMBS = [];
  window.parent.postMessage({ type: 've:breadcrumb', breadcrumbs: [] }, '*');
}

// ─── EDIT MODE ─────────────────────────────────────────────────

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
    } catch(rangeErr) {}

    window.parent.postMessage({
      type: 've:editing',
      section: el.getAttribute('data-section') || '',
      field: el.getAttribute('data-field') || '',
    }, '*');
  } catch(e) {
    veReportError('enterEditMode: ' + (e.message || e));
  }
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
    var section = el.getAttribute('data-section') || '';
    var field = el.getAttribute('data-field') || '';
    var content = el.innerHTML;
    window.parent.postMessage({
      type: 've:update',
      page: PAGE,
      section: section,
      field: field,
      content: content,
    }, '*');
  } catch(e) {}
}

function applyStyle(data) {
  try {
    if (!SELECTED) return;
    if (data.bold !== undefined) {
      document.execCommand('bold');
    }
    if (data.italic !== undefined) {
      document.execCommand('italic');
    }
    if (data.underline !== undefined) {
      document.execCommand('underline');
    }
    if (data.fontSize) {
      SELECTED.style.fontSize = data.fontSize;
    }
    if (data.color) {
      document.execCommand('foreColor', false, data.color);
    }
    if (data.textAlign) {
      SELECTED.style.textAlign = data.textAlign;
    }
    sendUpdate(SELECTED);
  } catch(e) {
    veReportError('applyStyle: ' + (e.message || e));
  }
}

function refreshEditor() {
  try {
    SELECTED = null;
    IS_EDITING = false;
    document.querySelectorAll('.ve-el').forEach(function(el) {
      try { el.classList.remove('ve-selected', 've-editing'); } catch(e) {}
    });
    matchElements();
    markHiddenBlocks();
  } catch(e) {
    veReportError('refreshEditor: ' + (e.message || e));
  }
}

function clearEditorClass(className) {
  try {
    document.querySelectorAll('.' + className).forEach(function(el) {
      el.classList.remove(className);
    });
  } catch(e) {}
}

// ─── COMPONENT INSERTION ──────────────────────────────────────

function insertComponent(html, sectionName) {
  try {
    if (sectionName) {
      var target = document.querySelector('[data-section="' + sectionName + '"]');
      if (target) {
        target.insertAdjacentHTML('afterend', html);
      } else {
        document.body.insertAdjacentHTML('beforeend', html);
      }
    } else if (SELECTED) {
      SELECTED.insertAdjacentHTML('afterend', html);
    } else {
      document.body.insertAdjacentHTML('beforeend', html);
    }
    refreshEditor();
    window.parent.postMessage({ type: 've:component-inserted', page: PAGE }, '*');
  } catch(e) {
    veReportError('insertComponent: ' + (e.message || e));
  }
}

function removeElement(sectionKey) {
  try {
    if (sectionKey) {
      var els = document.querySelectorAll('[data-section="' + sectionKey + '"]');
      for (var i = 0; i < els.length; i++) {
        var block = els[i].closest('section') || els[i].parentElement;
        if (block && block !== document.body) {
          block.style.display = 'none';
          block.classList.add('ve-removed');
        }
      }
      window.parent.postMessage({ type: 've:element-removed', section: sectionKey, page: PAGE }, '*');
      deselectAll();
    }
  } catch(e) {
    veReportError('removeElement: ' + (e.message || e));
  }
}

function hideElement(sectionKey) {
  try {
    if (sectionKey) {
      var els = document.querySelectorAll('[data-section="' + sectionKey + '"]');
      for (var i = 0; i < els.length; i++) {
        var block = els[i].closest('section') || els[i].parentElement;
        if (block && block !== document.body) {
          block.style.display = 'none';
          block.classList.add('ve-hidden-by-editor');
        }
      }
      window.parent.postMessage({ type: 've:element-hidden', section: sectionKey, page: PAGE }, '*');
      deselectAll();
    }
  } catch(e) {
    veReportError('hideElement: ' + (e.message || e));
  }
}

function showElement(sectionKey) {
  try {
    if (sectionKey) {
      var els = document.querySelectorAll('[data-section="' + sectionKey + '"]');
      for (var i = 0; i < els.length; i++) {
        var block = els[i].closest('section') || els[i].parentElement;
        if (block) {
          block.style.display = '';
          block.classList.remove('ve-hidden-by-editor');
        }
      }
      window.parent.postMessage({ type: 've:element-shown', section: sectionKey, page: PAGE }, '*');
    }
  } catch(e) {
    veReportError('showElement: ' + (e.message || e));
  }
}

function getSelectedInfo() {
  try {
    if (!SELECTED) return;
    var section = SELECTED.getAttribute('data-section') || '';
    var field = SELECTED.getAttribute('data-field') || '';
    var rect = SELECTED.getBoundingClientRect();
    window.parent.postMessage({
      type: 've:selected-info',
      page: PAGE,
      section: section,
      field: field,
      tagName: SELECTED.tagName.toLowerCase(),
      className: SELECTED.className,
      rect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
    }, '*');
  } catch(e) {}
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
      }
    }
    refreshEditor();
    window.parent.postMessage({ type: 've:element-moved', section: sectionKey, direction: 'up', page: PAGE }, '*');
  } catch(e) {}
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
      }
    }
    refreshEditor();
    window.parent.postMessage({ type: 've:element-moved', section: sectionKey, direction: 'down', page: PAGE }, '*');
  } catch(e) {}
}

// ─── POST-MESSAGE COMMUNICATION ──────────────────────────────

function setupPostMessage() {
  window.addEventListener('message', function(e) {
    try {
      if (!e.data || !e.data.type) return;

      switch (e.data.type) {
        case 've:set-content':
          if (SELECTED && e.data.content !== undefined) {
            if (e.data.isHtml) {
              SELECTED.innerHTML = e.data.content;
            } else {
              SELECTED.textContent = e.data.content;
            }
            sendUpdate(SELECTED);
          }
          break;

        case 've:deselect':
          deselectAll();
          break;

        case 've:style':
          applyStyle(e.data);
          break;

        case 've:refresh':
          refreshEditor();
          break;

        case 've:focus':
          if (SELECTED) {
            SELECTED.scrollIntoView({ behavior: 'smooth', block: 'center' });
            enterEditMode(SELECTED);
          }
          break;

        case 've:preview':
          enterPreviewMode();
          break;

        case 've:edit':
          exitPreviewMode();
          break;

        case 've:insert-component':
          insertComponent(e.data.html, e.data.section);
          break;

        case 've:remove-element':
          removeElement(e.data.section);
          break;

        case 've:hide-element':
          hideElement(e.data.section);
          break;

        case 've:show-element':
          showElement(e.data.section);
          break;

        case 've:move-up':
          moveElementUp(e.data.section);
          break;

        case 've:move-down':
          moveElementDown(e.data.section);
          break;

        case 've:clear-selected-class':
          clearEditorClass(e.data.className);
          break;
      }
    } catch(inner) {}
  });
}

// ─── MOUSE OVERS (only for tooltip, no navigation) ──────────

function setupHoverEvents() {
  document.addEventListener('mouseover', function(e) {
    try {
      var el = e.target.closest('.ve-el');
      if (el && !IS_EDITING && !IS_PREVIEW) {
        showTooltip(el, e.clientX, e.clientY);
      }
    } catch(inner) {}
  }, true);

  document.addEventListener('mouseout', function(e) {
    try {
      if (!IS_EDITING && !IS_PREVIEW && !document.querySelector('.ve-el:hover')) {
        hideTooltip();
      }
    } catch(inner) {}
  }, true);
}

// ─── INIT ──────────────────────────────────────────────────────

try {
  document.body.classList.add('ve-active');
  window.__veReady = true;
  window.__veSetPreview = function(v) { if (v) enterPreviewMode(); else exitPreviewMode(); };

  matchElements();
  setupEventInterception();
  setupHoverEvents();
  setupPostMessage();
  createTooltip();
  hideTooltip();
  markHiddenBlocks();

  window.parent.postMessage({ type: 've:ready', page: PAGE }, '*');
} catch(e) {
  veReportError('init: ' + (e.message || e));
  window.parent.postMessage({ type: 've:ready', page: PAGE, initError: true }, '*');
}
})();
`;
}
