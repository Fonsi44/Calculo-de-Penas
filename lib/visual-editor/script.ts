export function generateEditorScript(
  contentMap: Record<string, string>,
  page: string
): string {
  const mapJson = JSON.stringify(contentMap);
  const pageJson = JSON.stringify(page);

  return `
(function(){
if (document.getElementById('ve-root')) return;

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
var SECTION_LABELS = getSectionLabels();

function getSectionLabels() {
  var s = {};
  var els = document.querySelectorAll('[data-section]');
  for (var i = 0; i < els.length; i++) {
    var sec = els[i].getAttribute('data-section');
    if (sec && !s[sec]) s[sec] = true;
  }
  return s;
}

function stripHtml(html) {
  return html.replace(/<[^>]*>/g, '').replace(/\\s+/g, ' ').trim();
}

function normalizeText(t) {
  return t.replace(/\\s+/g, ' ').trim();
}

function matchElements() {
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
        var elWords = elText.split(' ').length;
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
    allVeEls[i].removeAttribute('contenteditable');
    allVeEls[i].setAttribute('contenteditable', 'true');
  }
}

function createTooltip() {
  TOOLTIP = document.createElement('div');
  TOOLTIP.className = 've-tooltip';
  TOOLTIP.id = 've-tooltip';
  document.body.appendChild(TOOLTIP);
}

function showTooltip(el, x, y) {
  if (!TOOLTIP) createTooltip();
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
}

function hideTooltip() {
  if (TOOLTIP) TOOLTIP.style.display = 'none';
}

function selectElement(el) {
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
}

function deselectAll() {
  if (SELECTED) {
    SELECTED.classList.remove('ve-selected');
    SELECTED.classList.remove('ve-editing');
    SELECTED = null;
  }
  IS_EDITING = false;
  hideTooltip();
  window.parent.postMessage({ type: 've:deselect' }, '*');
}

function setupEvents() {
  document.addEventListener('mouseover', function(e) {
    var el = e.target.closest('.ve-el');
    if (el && !IS_EDITING) {
      showTooltip(el, e.clientX, e.clientY);
    }
  }, true);

  document.addEventListener('mouseout', function(e) {
    var el = e.target.closest('.ve-el');
    if (el && !IS_EDITING && !document.querySelector('.ve-el:hover')) {
      hideTooltip();
    }
  }, true);

  document.addEventListener('click', function(e) {
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
  }, true);

  document.addEventListener('dblclick', function(e) {
    var el = e.target.closest('.ve-el');
    if (el) {
      e.preventDefault();
      e.stopPropagation();
      enterEditMode(el);
    }
  }, true);

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && IS_EDITING) {
      exitEditMode(SELECTED);
    }
    if (e.key === 'Enter' && !e.shiftKey && SELECTED && !SELECTED.hasAttribute('data-richtext')) {
      if (IS_EDITING) {
        e.preventDefault();
        exitEditMode(SELECTED);
      }
    }
  });

  document.addEventListener('input', function(e) {
    var el = e.target.closest('.ve-el');
    if (el && IS_EDITING) {
      sendUpdate(el);
    }
  }, true);

  window.addEventListener('message', function(e) {
    if (e.data && e.data.type === 've:set-content') {
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
    if (e.data && e.data.type === 've:deselect') {
      deselectAll();
    }
    if (e.data && e.data.type === 've:style') {
      applyStyle(e.data);
    }
    if (e.data && e.data.type === 've:refresh') {
      refreshEditor();
    }
    if (e.data && e.data.type === 've:focus') {
      if (SELECTED) {
        SELECTED.scrollIntoView({ behavior: 'smooth', block: 'center' });
        enterEditMode(SELECTED);
      }
    }
  });
}

function enterEditMode(el) {
  if (!el) return;
  IS_EDITING = true;
  el.classList.add('ve-editing');
  el.setAttribute('contenteditable', 'true');
  el.focus();

  var range = document.createRange();
  range.selectNodeContents(el);
  var sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);

  window.parent.postMessage({
    type: 've:editing',
    section: el.getAttribute('data-section') || '',
    field: el.getAttribute('data-field') || '',
  }, '*');
}

function exitEditMode(el) {
  if (!el) return;
  IS_EDITING = false;
  el.classList.remove('ve-editing');
  sendUpdate(el);
  window.getSelection().removeAllRanges();
}

function sendUpdate(el) {
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
}

function applyStyle(data) {
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
}

function refreshEditor() {
  SELECTED = null;
  IS_EDITING = false;
  document.querySelectorAll('.ve-el').forEach(function(el) {
    el.classList.remove('ve-selected', 've-editing');
  });
  matchElements();
}

document.body.classList.add('ve-active');
matchElements();
setupEvents();
createTooltip();
hideTooltip();

window.__veReady = true;
window.parent.postMessage({ type: 've:ready', page: PAGE }, '*');
console.log('[VisualEditor] Active on', PAGE, Object.keys(CONTENT_MAP).length, 'content fields');
})();
`;
}
