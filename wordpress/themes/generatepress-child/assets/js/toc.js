/**
 * Tabla de contenidos dinámica para posts del blog.
 * Genera un índice desde los H2 del artículo.
 *
 * @package Pineda y Asociados Blog Child
 */
(function() {
    'use strict';

    var container = document.getElementById('toc-container');
    var list = document.getElementById('toc-list');
    if (!container || !list) return;

    var headings = document.querySelectorAll('.entry-content h2');
    if (headings.length < 2) return;

    var items = [];
    headings.forEach(function(h2, index) {
        if (!h2.id) {
            h2.id = 'section-' + (index + 1);
        }
        items.push({
            id: h2.id,
            text: h2.textContent.trim()
        });
    });

    if (items.length < 2) return;

    items.forEach(function(item) {
        var li = document.createElement('li');
        var a = document.createElement('a');
        a.href = '#' + item.id;
        a.textContent = item.text;
        li.appendChild(a);
        list.appendChild(li);
    });

    container.style.display = 'block';

    // Scroll suave para los enlaces del TOC
    list.addEventListener('click', function(e) {
        var target = e.target;
        if (target.tagName === 'A' && target.getAttribute('href').startsWith('#')) {
            e.preventDefault();
            var id = target.getAttribute('href').substring(1);
            var el = document.getElementById(id);
            if (el) {
                var top = el.getBoundingClientRect().top + window.scrollY - 100;
                window.scrollTo({ top: top, behavior: 'smooth' });
                history.pushState(null, null, '#' + id);
            }
        }
    });
})();
