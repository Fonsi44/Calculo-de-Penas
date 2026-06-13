export function generateEditorScript(
  contentMap: Record<string, string>,
  page: string
): string {
  const mapJson = JSON.stringify(contentMap);
  const pageJson = JSON.stringify(page);

  return `
(function(){
var VE_ROOT = document.getElementById('ve-root');
if (VE_ROOT) return;

var PAGE = ${pageJson};
var CONTENT_MAP = ${mapJson};
var REVERSE_MAP = {};
for (var k in CONTENT_MAP) {
  var v = CONTENT_MAP[k];
  if (v && v.length > 2) REVERSE_MAP[v] = k;
}

var SELECTED = null;
var IS_EDITING = false;
var TOOLTIP = null;
var SECTION_LABELS = (function() {
  var s = {};
  try {
    var els = document.querySelectorAll('[data-section]');
    for (var i = 0; i < els.length; i++) {
      var sec = els[i].getAttribute('data-section');
      if (sec && !s[sec]) s[sec] = true;
    }
  } catch(e) {}
  return s;
})();

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
          matched.add(el);

          if (content.indexOf('<') !== -1) {
            el.setAttribute('data-richtext', 'true');
          }
          break;
        }
      }
    }

    var allVeEls = document.querySelectorAll('.ve-el');
    for (var i = 0; i < allVeEls.length; i++) {
      try {
        allVeEls[i].removeAttribute('contenteditable');
        allVeEls[i].setAttribute('contenteditable', 'true');
      } catch(e) {}
    }
  } catch(e) {
    veReportError('matchElements: ' + (e.message || e));
  }
}

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
    var label = (SECTION_LABELS[section] || section) + ' → ' + field;
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

function setupEvents() {
  try {
    document.addEventListener('mouseover', function(e) {
      try {
        var el = e.target.closest('.ve-el');
        if (el && !IS_EDITING) {
          showTooltip(el, e.clientX, e.clientY);
        }
      } catch(inner) {}
    }, true);

    document.addEventListener('mouseout', function(e) {
      try {
        if (!IS_EDITING && !document.querySelector('.ve-el:hover')) {
          hideTooltip();
        }
      } catch(inner) {}
    }, true);

    document.addEventListener('click', function(e) {
      try {
        var el = e.target.closest('.ve-el');
        if (el) {
          e.preventDefault();
          e.stopPropagation();
          if (SELECTED === el) {
            enterEditMode(el);
          } else {
            selectElement(el);
          }
        } else if (!e.target.closest('.ve-tooltip')) {
          deselectAll();
        }
      } catch(inner) {}
    }, true);

    document.addEventListener('dblclick', function(e) {
      try {
        var el = e.target.closest('.ve-el');
        if (el) {
          e.preventDefault();
          e.stopPropagation();
          enterEditMode(el);
        }
      } catch(inner) {}
    }, true);

    document.addEventListener('keydown', function(e) {
      try {
        if (e.key === 'Escape' && IS_EDITING) {
          exitEditMode(SELECTED);
        }
        if (e.key === 'Enter' && !e.shiftKey && SELECTED && !SELECTED.hasAttribute('data-richtext')) {
          if (IS_EDITING) {
            e.preventDefault();
            exitEditMode(SELECTED);
          }
        }
      } catch(inner) {}
    });

    document.addEventListener('input', function(e) {
      try {
        var el = e.target.closest('.ve-el');
        if (el && IS_EDITING) {
          sendUpdate(el);
        }
      } catch(inner) {}
    }, true);

    window.addEventListener('message', function(e) {
      try {
        if (!e.data || !e.data.type) return;
        if (e.data.type === 've:set-content') {
          var el = SELECTED;
          if (el && e.data.content !== undefined) {
            if (e.data.isHtml) {
              el.innerHTML = e.data.content;
            } else {
              el.textContent = e.data.content;
            }
            sendUpdate(el);
          }
        }
        if (e.data.type === 've:deselect') {
          deselectAll();
        }
        if (e.data.type === 've:style') {
          applyStyle(e.data);
        }
        if (e.data.type === 've:refresh') {
          refreshEditor();
        }
        if (e.data.type === 've:focus') {
          if (SELECTED) {
            SELECTED.scrollIntoView({ behavior: 'smooth', block: 'center' });
            enterEditMode(SELECTED);
          }
        }
      } catch(inner) {}
    });
  } catch(e) {
    veReportError('setupEvents: ' + (e.message || e));
  }
}

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
    var el = SELECTED;
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
      el.style.fontSize = data.fontSize;
    }
    if (data.color) {
      document.execCommand('foreColor', false, data.color);
    }
    if (data.textAlign) {
      el.style.textAlign = data.textAlign;
    }
    sendUpdate(el);
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
  } catch(e) {
    veReportError('refreshEditor: ' + (e.message || e));
  }
}

try {
  document.body.classList.add('ve-active');
  matchElements();
  setupEvents();
  createTooltip();
  hideTooltip();
  window.__veReady = true;
  window.parent.postMessage({ type: 've:ready', page: PAGE }, '*');
} catch(e) {
  veReportError('init: ' + (e.message || e));
  window.parent.postMessage({ type: 've:ready', page: PAGE, initError: true }, '*');
}
})();
`;
}
